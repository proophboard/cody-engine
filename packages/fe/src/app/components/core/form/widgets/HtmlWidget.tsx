import * as React from 'react';
import {WidgetProps} from "@rjsf/utils";
import StaticHtmlWidget from "@frontend/app/components/core/form/widgets/html/StaticHtmlWidget";
import DynamicHtmlWidget, {JSONSchemaWithId} from "@frontend/app/components/core/form/widgets/html/DynamicHtmlWidget";
import {useParams} from "react-router-dom";
import {useUser} from "@frontend/hooks/use-user";
import {usePageData} from "@frontend/hooks/use-page-data";
import {useGlobalStore} from "@frontend/hooks/use-global-store";
import jexl from "@app/shared/jexl/get-configured-jexl";

interface OwnProps {

}

type HtmlWidgetProps = OwnProps & WidgetProps;

export interface HtmlConfig {
  tag?: string;
  children?: HtmlConfig[];
  text?: string;
  [attr: string]: string | undefined | HtmlConfig[]
}

const HtmlWidget = (props: HtmlWidgetProps) => {
  const {
    id,
    required,
    readonly,
    disabled,
    type,
    label,
    hideLabel,
    hideError,
    value,
    onChange,
    onChangeOverride,
    onBlur,
    onFocus,
    autofocus,
    options,
    schema,
    uiSchema,
    rawErrors = [],
    errorSchema,
    formContext,
    registry,
    InputLabelProps
  } = props;

  const routeParams = useParams();
  const [user,] = useUser();
  const [pageData,] = usePageData();
  const [store,] = useGlobalStore();

  let isDynamicHtml = !!options.data;

  if(isDynamicHtml && options.if && typeof options.if === "string") {
    const jexlCtx = {
      routeParams,
      data: formContext?.data || {},
      user,
      page: pageData,
      store,
      value,
      result: undefined
    };

    isDynamicHtml = jexl.evalSync(options.if, jexlCtx);
  }

  if(isDynamicHtml) {
    return <DynamicHtmlWidget
      {...props}
      config={cleanOptions(options)}
      data={options.data as string}
      query={options.query as Record<string, string> || {}}
      rootSchema={registry.rootSchema as JSONSchemaWithId}
      formData={formContext?.data || {}}
      value={value}
      id={id}
      label={label}
      style={options.style}
      disabled={disabled || readonly}
      hideLabel={!!(options.hideLabel || hideLabel)}
      hidden={options.hidden as boolean}
    />
  }

  return <StaticHtmlWidget
    {...props}
    config={cleanOptions(options)}
    id={id}
    label={label}
    style={options.style}
    disabled={disabled || readonly}
    hideLabel={!!(options.hideLabel || hideLabel)}
    hidden={options.hidden as boolean}
  />

};

export default HtmlWidget;

const cleanOptions = (options: Record<string, any>): HtmlConfig => {
  const copy = {...options};

  delete copy.data;
  delete copy.query;
  delete copy.if;
  delete copy.hidden;
  delete copy.hideLabel;

  return copy;
}
