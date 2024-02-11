import {Filter} from "@event-engine/infrastructure/DocumentStore/Filter";
import {Session} from "@event-engine/infrastructure/MultiModelStore/Session";

export const INFORMATION_SERVICE_NAME = 'CodyInformationService';

export interface InformationService {
  useSession: (session: Session) => void;
  forgetSession: () => void;
  insert: (informationName: string, id: string, data: object, metadata?: object, version?: number) => Promise<void>;
  upsert: (informationName: string, id: string, data: object, metadata?: object, version?: number) => Promise<void>;
  update: (informationName: string, filter: Filter, data: object, metadata?: object, version?: number) => Promise<void>;
  replace: (informationName: string, filter: Filter, data: object, metadata?: object, version?: number) => Promise<void>;
  delete: (informationName: string, filter: Filter) => Promise<void>;
}
