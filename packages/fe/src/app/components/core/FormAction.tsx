import * as React from 'react';
import {FormAction as FormActionType} from "@frontend/app/components/core/form/types/action";
import {FormJexlContext} from "@frontend/app/components/core/form/types/form-jexl-context";
import {TableRowJexlContext} from "@frontend/app/components/core/table/table-row-jexl-context";

interface OwnProps {
  action: FormActionType;
  defaultService: string;
  jexlCtx: FormJexlContext | TableRowJexlContext;
}

type FormActionProps = OwnProps;

const FormAction = (props: FormActionProps) => {
  return <>Form Action</>;
};

export default FormAction;
