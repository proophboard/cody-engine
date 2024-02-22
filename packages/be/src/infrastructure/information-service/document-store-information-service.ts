import {InformationService} from "@server/infrastructure/information-service/information-service";
import {DocumentStore, SortOrder} from "@event-engine/infrastructure/DocumentStore";
import {types} from "@app/shared/types";
import {
  isQueryableNotStoredValueObjectDescription,
  isQueryableStateDescription,
  isQueryableStateListDescription,
  isQueryableValueObjectDescription
} from "@event-engine/descriptions/descriptions";
import {Session} from "@event-engine/infrastructure/MultiModelStore/Session";
import {Filter} from "@event-engine/infrastructure/DocumentStore/Filter";
import {asyncIteratorToArray} from "@event-engine/infrastructure/helpers/async-iterator-to-array";
import {asyncMap} from "@event-engine/infrastructure/helpers/async-map";
import {makeValueObject, ValueObjectRuntimeInfo} from "@event-engine/messaging/value-object";

export class DocumentStoreInformationService implements InformationService {
  private ds: DocumentStore;
  private session?: Session;

  public constructor(ds: DocumentStore) {
    this.ds = ds;
  }

  public useSession(session: Session): void {
    this.session = session;
  }

  public forgetSession(): void {
    this.session = undefined;
  }

  public async find<T extends object>(informationName: string, filter: Filter, skip?: number, limit?: number, orderBy?: SortOrder): Promise<Array<T>> {
    const collectionName = this.detectCollection(informationName);

    const cursor = await this.ds.findDocs<T>(collectionName, filter, skip, limit, orderBy);

    return asyncIteratorToArray(asyncMap(cursor, ([,doc]) => doc));
  }

  public async count(informationName: string, filter: Filter): Promise<number> {
    const collectionName = this.detectCollection(informationName);

    return this.ds.countDocs(collectionName, filter);
  }

  public async insert(informationName: string, id: string, data: object, metadata?: object, version?: number): Promise<void> {
    const collectionName = this.detectCollection(informationName);

    if(this.session) {
      this.session.insertDocument(collectionName, id, data, metadata, version);
      return;
    }
    return this.ds.addDoc(collectionName, id, data, metadata, version);
  }

  public async upsert(informationName: string, id: string, data: object, metadata?: object, version?: number): Promise<void> {
    const collectionName = this.detectCollection(informationName);

    if(this.session) {
      this.session.upsertDocument(collectionName, id, data, metadata, version);
      return;
    }
    return this.ds.upsertDoc(collectionName, id, data, metadata, version);
  }

  public async update(informationName: string, filter: Filter, data: object, metadata?: object, version?: number): Promise<void> {
    const collectionName = this.detectCollection(informationName);

    if (this.session) {
      this.session.updateManyDocuments(collectionName, filter, data, metadata, version);
      return;
    }
    return this.ds.updateMany(collectionName, filter, data, metadata, version);
  }

  public async replace(informationName: string, filter: Filter, data: object, metadata?: object, version?: number): Promise<void> {
    const collectionName = this.detectCollection(informationName);

    if(this.session) {
      this.session.replaceManyDocuments(collectionName, filter, data, metadata, version);
      return;
    }
    return this.ds.replaceMany(collectionName, filter, data, metadata, version);
  }

  public async delete(informationName: string, filter: Filter): Promise<void> {
    const collectionName = this.detectCollection(informationName);

    if(this.session) {
      this.session.deleteManyDocuments(collectionName, filter);
      return;
    }
    return this.ds.deleteMany(collectionName, filter);
  }

  private detectCollection(informationName: string): string {
    const runtimeInfo = this.detectSingleVoRuntimeInfo(informationName);

    const desc = runtimeInfo.desc;

    if(!isQueryableStateDescription(desc) && !isQueryableStateListDescription(desc) && !isQueryableValueObjectDescription(desc) ) {
      throw new Error(`The type: '${informationName}' is missing a 'collection' property in its type description. It cannot be stored in the read model database.`);
    }

    return desc.collection;
  }

  private detectSingleVoRuntimeInfo(informationName: string): ValueObjectRuntimeInfo {
    const runtimeInfo = types[informationName];

    if(!runtimeInfo) {
      throw new Error(`Can't find the type: '${informationName}' in the type registry. Did you forget to pass the corresponding information card on prooph board to Cody?`);
    }

    if(isQueryableStateListDescription(runtimeInfo.desc)) {
      return this.detectSingleVoRuntimeInfo(runtimeInfo.desc.itemType);
    }

    if(isQueryableStateDescription(runtimeInfo.desc) || isQueryableValueObjectDescription(runtimeInfo.desc) || isQueryableNotStoredValueObjectDescription(runtimeInfo.desc)) {
      return runtimeInfo;
    }

    throw new Error(`Information "${informationName}" is neither a queryable list nor queryable information. Please check your prooph board metadata configuration of the information card`);
  }
}
