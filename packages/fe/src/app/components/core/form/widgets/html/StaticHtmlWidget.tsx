import * as React from 'react';
import {HtmlConfig} from "@frontend/app/components/core/form/widgets/HtmlWidget";
import {useNavigate} from "react-router-dom";
import {useEffect, useRef} from "react";
import {WidgetProps} from "@rjsf/utils";
import {createRoot, Root} from "react-dom/client";
import MdiIcon from "@cody-play/app/components/core/MdiIcon";
import {jsx} from "@emotion/react";
import JSX = jsx.JSX;
import {v4} from "uuid";
import {Button, FormControlLabel, Stack, Switch, Typography, useTheme} from "@mui/material";
import {ThemeProvider} from "@mui/material/styles";
import {FormJexlContextV2} from "@frontend/app/components/core/form/types/form-jexl-context";

interface OwnProps {
  config: HtmlConfig;
  id: string;
  label?: string;
  hideLabel?: boolean;
  hidden?: boolean;
  disabled?: boolean;
  required?: boolean;
  style?: React.StyleHTMLAttributes<unknown>;
  jexlCtx: FormJexlContextV2
}

type StaticHtmlWidgetProps = OwnProps & WidgetProps;

const StaticHtmlWidget = (props: StaticHtmlWidgetProps) => {
  const navigate = useNavigate();
  const divRef = useRef<HTMLDivElement>(null);
  const reactRootRef = useRef<Root>(null);
  const theme = useTheme();

  const style = props.style || {};

  useEffect(() => {
    if(divRef.current) {

      if(!reactRootRef.current) {
        // @ts-ignore
        reactRootRef.current = createRoot(divRef.current);
      }

      reactRootRef.current.render(<ThemeProvider  theme={theme}>{convertToJSX(props.config, props)}</ThemeProvider>);

      window.setTimeout(() => {
        if(divRef.current) {
          divRef.current.querySelectorAll('a').forEach((a: HTMLAnchorElement) => {
            if (a.href && a.href.includes(window.location.hostname)) {
              a.onclick = (e) => {
                e.preventDefault();
                const url = new URL(a.href);
                navigate(url.pathname);
              }
            }
          })
        }
      }, 100);

    }
  }, [JSON.stringify(props.config)]);

  if(props.hidden) {
    return <></>;
  }

  return (
    <div ref={divRef} style={style}/>
  );
};

export default StaticHtmlWidget;

const SkipAttributes = ['tag', 'children', 'text', 'query', 'if', 'ui:style'];

const convertToJSX = (config: HtmlConfig, props: StaticHtmlWidgetProps): JSX.Element => {
  const Tag = config.tag || 'div';

  const attributes: Record<string, any> = {};

  for (const attribute in config) {
    if(attribute.includes(":expr")) {
      continue;
    }

    if(SkipAttributes.includes(attribute)) {
      continue;
    }

    attributes[attribute] = config[attribute];
  }

  const children = getChildrenOrText(config, props);

  if(Tag === "button") {
    if(typeof attributes.onClick !== "undefined") {
      const val = attributes.onClick;
      attributes.onClick = () => {
        props.onChange(val);
      }
    }

    return <Button {...attributes}>{children}</Button>
  }

  if(Tag === "icon") {
    return <MdiIcon icon={attributes.icon || 'square'} {...attributes} />;
  }

  if(Tag === "stack") {
    return <Stack {...attributes}>{children}</Stack>
  }

  if(Tag === "typography") {
    return <Typography {...attributes}>{children}</Typography>
  }

  if(Tag === "switch") {
    if(props.label && !props.hideLabel) {
      return <FormControlLabel control={<Switch {...attributes} onChange={e => props.onChange(!!e.target.checked)} />}
                               label={props.label} disabled={props.disabled}
                               required={props.required}
      />
    }
  }

  if(children) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return <Tag {...attributes}>{children}</Tag>
  } else {
    return <Tag {...attributes} />
  }
}

const getChildrenOrText = (config: HtmlConfig, props: StaticHtmlWidgetProps): Array<JSX.Element> | string | undefined => {
  if(config.children) {
    const children: Array<JSX.Element> = [];

    config.children.forEach(child => {
      children!.push(convertToJSX({...child, key: v4()}, props));
    })

    return children;
  } else if (config.text) {
    return config.text;
  }
}
