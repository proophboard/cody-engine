import {InformationService} from "@event-engine/infrastructure/information-service/information-service";
import {DocumentStore, isLookup, Lookup, PartialSelect, SortOrder} from "@event-engine/infrastructure/DocumentStore";
import {
  isQueryableNotStoredValueObjectDescription,
  isQueryableStateDescription,
  isQueryableStateListDescription,
  isQueryableValueObjectDescription, isStoredQueryableListDescription
} from "@event-engine/descriptions/descriptions";
import {Session} from "@event-engine/infrastructure/MultiModelStore/Session";
import {Filter} from "@event-engine/infrastructure/DocumentStore/Filter";
import {asyncIteratorToArray} from "@event-engine/infrastructure/helpers/async-iterator-to-array";
import {asyncMap} from "@event-engine/infrastructure/helpers/async-map";
import {ValueObjectRuntimeInfo} from "@event-engine/messaging/value-object";
import {TypeRegistry} from "@event-engine/infrastructure/TypeRegistry";

export class DocumentStoreInformationService implements InformationService {
  private ds: DocumentStore;
  private types: TypeRegistry;

  public constructor(ds: DocumentStore, types: TypeRegistry) {
    this.ds = ds;
    this.types = types;
  }

  public useTypes(types: TypeRegistry): void {
    this.types = types;
  }

  public async find<T extends object>(informationName: string, filter: Filter, skip?: number, limit?: number, orderBy?: SortOrder): Promise<Array<T>> {
    const collectionName = this.detectCollection(informationName);

    const cursor = await this.ds.findDocs<T>(collectionName, filter, skip, limit, orderBy);

    return asyncIteratorToArray(asyncMap(cursor, ([,doc]) => doc));
  }

  public async findById<T extends object>(informationName: string, id: string): Promise<T|null> {
    return this.ds.getDoc<T>(this.detectCollection(informationName), id);
  }

  public async findOne<T extends object>(informationName: string, filter: Filter): Promise<T|null> {
    const collectionName = this.detectCollection(informationName);

    const cursor = await this.ds.findDocs<T>(collectionName, filter, 0, 1);

    const result = await asyncIteratorToArray(asyncMap(cursor, ([,doc]) => doc));

    if(result.length) {
      return result[0];
    } else {
      return null;
    }
  }

  public async findPartial<T extends object>(informationName: string, select: PartialSelect, filter: Filter, skip?: number, limit?: number, orderBy?: SortOrder): Promise<Array<T>> {
    const collectionName = this.detectCollection(informationName);

    const cursor = await this.ds.findPartialDocs<T>(collectionName, this.normalizeLookup(select), filter, skip, limit, orderBy);

    return asyncIteratorToArray(asyncMap(cursor, ([,doc]) => doc));
  }

  public async findPartialById<T extends object>(informationName: string, id: string, select: PartialSelect): Promise<T|null> {
    return this.ds.getPartialDoc<T>(this.detectCollection(informationName), id, this.normalizeLookup(select));
  }

  public async findOnePartial<T extends object>(informationName: string, select: PartialSelect, filter: Filter): Promise<T|null> {
    const collectionName = this.detectCollection(informationName);

    const cursor = await this.ds.findPartialDocs<T>(collectionName, this.normalizeLookup(select), filter, 0, 1);

    const result = await asyncIteratorToArray(asyncMap(cursor, ([,doc]) => doc));

    if(result.length) {
      return result[0];
    } else {
      return null;
    }
  }

  public async count(informationName: string, filter: Filter): Promise<number> {
    const collectionName = this.detectCollection(informationName);

    return this.ds.countDocs(collectionName, filter);
  }

  public async insertInSession(informationName: string, id: string, data: object, metadata?: object, version?: number, session?: Session): Promise<void> {
    return this.insert(informationName, id, data, metadata, version, session);
  }

  public async insert(informationName: string, id: string, data: object, metadata?: object, version?: number, session?: Session): Promise<void> {
    const collectionName = this.detectCollection(informationName);

    if(session) {
      session.insertDocument(collectionName, id, data, metadata, version);
      return;
    }
    return this.ds.addDoc(collectionName, id, data, metadata, version);
  }

  public async upsertInSession(session: Session, informationName: string, id: string, data: object, metadata?: object, version?: number): Promise<void> {
    return this.upsert(informationName, id, data, metadata, version, session);
  }

  public async upsert(informationName: string, id: string, data: object, metadata?: object, version?: number, session?: Session): Promise<void> {
    const collectionName = this.detectCollection(informationName);

    if(session) {
      session.upsertDocument(collectionName, id, data, metadata, version);
      return;
    }
    return this.ds.upsertDoc(collectionName, id, data, metadata, version);
  }

  public async updateInSession(session: Session, informationName: string, filter: Filter, data: object, metadata?: object, version?: number): Promise<void> {
    return this.update(informationName, filter, data, metadata, version, session)
  }

  public async update(informationName: string, filter: Filter, data: object, metadata?: object, version?: number, session?: Session): Promise<void> {
    const collectionName = this.detectCollection(informationName);

    if (session) {
      session.updateManyDocuments(collectionName, filter, data, metadata, version);
      return;
    }
    return this.ds.updateMany(collectionName, filter, data, metadata, version);
  }

  public async replaceInSession(session: Session,  informationName: string, filter: Filter, data: object, metadata?: object, version?: number): Promise<void> {
    return this.replace(informationName, filter, data, metadata, version, session);
  }

  public async replace(informationName: string, filter: Filter, data: object, metadata?: object, version?: number, session?: Session): Promise<void> {
    const collectionName = this.detectCollection(informationName);

    if(session) {
      session.replaceManyDocuments(collectionName, filter, data, metadata, version);
      return;
    }
    return this.ds.replaceMany(collectionName, filter, data, metadata, version);
  }

  public async deleteInSession(session: Session, informationName: string, filter: Filter): Promise<void> {
    return this.delete(informationName, filter, session);
  }

  public async delete(informationName: string, filter: Filter, session?: Session): Promise<void> {
    const collectionName = this.detectCollection(informationName);

    if(session) {
      session.deleteManyDocuments(collectionName, filter);
      return;
    }
    return this.ds.deleteMany(collectionName, filter);
  }

  public detectCollection(informationName: string): string {
    const runtimeInfo = this.detectVoRuntimeInfoWithCollection(informationName);

    const desc = runtimeInfo.desc;

    if(!isQueryableStateDescription(desc) && !isQueryableStateListDescription(desc) && !isQueryableValueObjectDescription(desc) && !isStoredQueryableListDescription(desc) ) {
      throw new Error(`The type: '${informationName}' is missing a 'collection' property in its type description. It cannot be stored in the read model database.`);
    }

    return desc.collection;
  }

  private detectVoRuntimeInfoWithCollection(informationName: string): ValueObjectRuntimeInfo {
    const runtimeInfo = this.types[informationName];

    if(!runtimeInfo) {
      throw new Error(`Can't find the type: '${informationName}' in the type registry. Did you forget to pass the corresponding information card on prooph board to Cody?`);
    }

    if(isStoredQueryableListDescription(runtimeInfo.desc)) {
      return runtimeInfo;
    }

    if(isQueryableStateListDescription(runtimeInfo.desc)) {
      return runtimeInfo;
    }

    if(isQueryableStateDescription(runtimeInfo.desc) || isQueryableValueObjectDescription(runtimeInfo.desc) || isQueryableNotStoredValueObjectDescription(runtimeInfo.desc)) {
      return runtimeInfo;
    }

    throw new Error(`Information "${informationName}" is neither a queryable list nor queryable information. Please check your prooph board metadata configuration of the information card`);
  }

  private normalizeLookup(select: PartialSelect): PartialSelect {
    const allAliases: string[] = select.filter(s => isLookup(s) && s.alias).map((s:any) => s.alias);

    return select.map(s => {
      if(isLookup(s)) {
        let usingVar = s.using;

        if(s.using) {
          if(!allAliases.includes(s.using)) {
            usingVar = this.detectCollection(s.using);
          }
        }

        return {
          ...s,
          using: usingVar,
          lookup: this.detectCollection(s.lookup)
        } as Lookup;
      }

      return s;
    })
  }
}
