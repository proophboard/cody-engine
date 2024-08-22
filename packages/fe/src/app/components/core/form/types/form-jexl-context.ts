import {User} from "@app/shared/types/core/user/user";
import {PageData} from "@app/shared/types/core/page-data/page-data";
import {Store} from "@frontend/app/providers/GlobalStore";

export interface FormJexlContext {
  routeParams: {[prop: string]: any};
  data: {[prop: string]: any};
  user: User;
  page: PageData;
  store: Store;
}
