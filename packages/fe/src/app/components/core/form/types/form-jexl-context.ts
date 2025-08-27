import {User} from "@app/shared/types/core/user/user";
import {PageData} from "@app/shared/types/core/page-data/page-data";
import {Store} from "@frontend/app/providers/GlobalStore";
import {FormModeType} from "@frontend/app/components/core/CommandForm";
import {Theme} from "@mui/material";

export interface FormJexlContext {
  routeParams: {[prop: string]: any};
  data: {[prop: string]: any};
  user: User;
  page: PageData;
  store: Store;
  mode?: FormModeType;
  theme?: Theme
}

export interface FormJexlContextV2 {
  routeParams: {[prop: string]: any};
  data: {[prop: string]: any};
  user: User;
  page: PageData;
  store: Store;
  form: {
    data: {[prop: string]: any};
    updateForm: (data: {[prop: string]: any}) => void;
  },
  mode: FormModeType;
}
