import * as React from 'react';
import {useUser} from "@frontend/hooks/use-user";
import {usePageData} from "@frontend/hooks/use-page-data";
import {useParams} from "react-router-dom";
import {useGlobalStore} from "@frontend/hooks/use-global-store";
import ActionButton from "@frontend/app/components/core/ActionButton";
import {TableRowJexlContext} from "@frontend/app/components/core/table/table-row-jexl-context";
import {normalizeUiSchema} from "@frontend/util/schema/normalize-ui-schema";
import {Action, TableActionConfig} from "@frontend/app/components/core/form/types/action";

interface OwnProps {
  action: TableActionConfig;
  row: {[prop: string]: any};
  defaultService: string;
  onDialogClose?: () => void;
}

type ColumnActionProps = OwnProps;

const ColumnAction = (props: ColumnActionProps) => {
  const [user,] = useUser();
  const [pageData,] = usePageData();
  const routeParams = useParams();
  const [globalStore] = useGlobalStore();
  const jexlCtx: TableRowJexlContext = {
    user,
    page: pageData,
    row: props.row,
    routeParams,
    store: globalStore,
  }

  const action = normalizeUiSchema(props.action, jexlCtx) as Action;

  return <ActionButton
    action={{...action, position: "bottom-center"}}
    defaultService={props.defaultService}
    jexlCtx={jexlCtx}
    onDialogClose={props.onDialogClose}
  />
};

export default ColumnAction;
