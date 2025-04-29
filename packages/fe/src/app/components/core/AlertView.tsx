import * as React from 'react';
import {useUser} from "@frontend/hooks/use-user";
import {usePageData} from "@frontend/hooks/use-page-data";
import {useTypes} from "@frontend/hooks/use-types";
import {useParams} from "react-router-dom";
import {useGlobalStore} from "@frontend/hooks/use-global-store";
import {useTranslation} from "react-i18next";
import {useEnv} from "@frontend/hooks/use-env";
import {FormJexlContext} from "@frontend/app/components/core/form/types/form-jexl-context";
import {ValueObjectRuntimeInfo} from "@event-engine/messaging/value-object";
import {resolveUiSchema} from "@event-engine/messaging/resolve-refs";
import {translateUiSchema} from "@frontend/util/schema/translate-ui-schema";
import {UiSchema} from "@rjsf/utils";
import {merge} from "lodash/fp";
import {ActionConfig} from "@frontend/app/components/core/form/types/action";

export type UiAlertConfig = {
  'ui:title'?: string;
  'ui:title:expr'?: string;
  'ui:description'?: string;
  'ui:description:expr'?: string;
  'ui:alert'?: {
    severity?: 'success' | 'info' | 'warning' | 'error';
    'severity:expr'?: string;
    icon?: string;
    'icon:expr'?: string;
    action?: ActionConfig;
    variant?: 'filled' | 'outlined';
    'variant:expr'?: string;
    color?: string;
    'color:expr'?: string;
  }
}

interface OwnProps {
  state?: any;
  description: ValueObjectRuntimeInfo;
  hidden?: boolean;
  severity?: 'success' | 'info' | 'warning' | 'error';
  icon?: React.ReactNode;
  action?: React.ReactNode;
  title?: string;
  text?: string;
  variant?: 'filled' | 'outlined';
  color?: string;
}

type AlertViewProps = OwnProps;

const AlertView = (props: AlertViewProps) => {
  const [user,] = useUser();
  const [pageData,] = usePageData();
  const [types] = useTypes();
  const routeParams = useParams();
  const [globalStore] = useGlobalStore();
  const {t} = useTranslation();
  const env = useEnv();
  const jexlCtx: FormJexlContext = {
    user,
    page: pageData,
    data: props.state || {},
    routeParams,
    store: globalStore,
  }

  const resolvedUiSchema = resolveUiSchema(
    props.description.schema as any,
    types,
    (s, k) => translateUiSchema(s, k, t)
  );

  const mainUiSchema = props.description.uiSchema
    ? translateUiSchema(props.description.uiSchema, `${props.description.desc.name}.uiSchema`, t)
    : undefined;
  const mergedUiSchema: UiSchema = merge(resolvedUiSchema, mainUiSchema) as UiSchema;


};

export default AlertView;
