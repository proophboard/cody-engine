import {Filter} from "@event-engine/infrastructure/DocumentStore/Filter";
import {Session} from "@event-engine/infrastructure/MultiModelStore/Session";
import {SortOrder} from "@event-engine/infrastructure/DocumentStore";

export const INFORMATION_SERVICE_NAME = 'CodyInformationService';

export interface InformationService {
  useSession: (session: Session) => void;
  forgetSession: () => void;
  find: <T extends object>(informationName: string, filter: Filter, skip?: number, limit?: number, orderBy?: SortOrder) => Promise<Array<T>>;
  count: (informationName: string, filter: Filter) => Promise<number>;
  insert: (informationName: string, id: string, data: object, metadata?: object, version?: number) => Promise<void>;
  upsert: (informationName: string, id: string, data: object, metadata?: object, version?: number) => Promise<void>;
  update: (informationName: string, filter: Filter, data: object, metadata?: object, version?: number) => Promise<void>;
  replace: (informationName: string, filter: Filter, data: object, metadata?: object, version?: number) => Promise<void>;
  delete: (informationName: string, filter: Filter) => Promise<void>;
}
