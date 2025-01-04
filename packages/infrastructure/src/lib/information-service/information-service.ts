import {Filter} from "@event-engine/infrastructure/DocumentStore/Filter";
import {Session} from "@event-engine/infrastructure/MultiModelStore/Session";
import {PartialSelect, SortOrder} from "@event-engine/infrastructure/DocumentStore";
import {TypeRegistry} from "@event-engine/infrastructure/TypeRegistry";

export const INFORMATION_SERVICE_NAME = 'CodyInformationService';

export interface InformationService {
  useSession: (session: Session) => void;
  useTypes: (types: TypeRegistry) => void;
  forgetSession: () => void;
  find: <T extends object>(informationName: string, filter: Filter, skip?: number, limit?: number, orderBy?: SortOrder) => Promise<Array<T>>;
  findById: <T extends object>(informationName: string, id: string) => Promise<T|null>;
  findOne: <T extends object>(informationName: string, filter: Filter) => Promise<T|null>;
  findPartial: <T extends object>(informationName: string, select: PartialSelect, filter: Filter, skip?: number, limit?: number, orderBy?: SortOrder) => Promise<Array<T>>;
  findPartialById: <T extends object>(informationName: string, id: string, select: PartialSelect) => Promise<T|null>;
  findOnePartial: <T extends object>(informationName: string, select: PartialSelect, filter: Filter) => Promise<T|null>;
  count: (informationName: string, filter: Filter) => Promise<number>;
  insert: (informationName: string, id: string, data: object, metadata?: object, version?: number) => Promise<void>;
  upsert: (informationName: string, id: string, data: object, metadata?: object, version?: number) => Promise<void>;
  update: (informationName: string, filter: Filter, data: object, metadata?: object, version?: number) => Promise<void>;
  replace: (informationName: string, filter: Filter, data: object, metadata?: object, version?: number) => Promise<void>;
  delete: (informationName: string, filter: Filter) => Promise<void>;
}
