import * as React from 'react';
import {HtmlConfig} from "@frontend/app/components/core/form/widgets/HtmlWidget";
import {useNavigate} from "react-router-dom";
import {useEffect, useRef} from "react";
import {WidgetProps} from "@rjsf/utils";
import {createRoot} from "react-dom/client";
import MdiIcon from "@cody-play/app/components/core/MdiIcon";
import {jsx} from "@emotion/react";
import JSX = jsx.JSX;
import {v4} from "uuid";
import {Stack, Typography} from "@mui/material";

interface OwnProps {
  config: HtmlConfig;
  id: string;
  label?: string;
  hideLabel?: boolean;
  hidden?: boolean;
  disabled?: boolean;
  style?: React.StyleHTMLAttributes<unknown>;
}

type StaticHtmlWidgetProps = OwnProps & WidgetProps;

const StaticHtmlWidget = (props: StaticHtmlWidgetProps) => {
  const navigate = useNavigate();
  const divRef = useRef<HTMLDivElement>(null);

  const style = props.style || {};

  useEffect(() => {
    if(divRef.current) {

      divRef.current.innerHTML = '';

      createRoot(divRef.current).render(convertToJSX(props.config));

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
  }, [divRef.current, JSON.stringify(props.config)]);

  if(props.hidden) {
    return <></>;
  }

  return (
    <div ref={divRef} style={style}/>
  );
};

export default StaticHtmlWidget;

const SkipAttributes = ['tag', 'children', 'text', 'query', 'if', 'ui:style'];

const convertToJSX = (config: HtmlConfig): JSX.Element => {
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

  const children = getChildrenOrText(config);

  if(Tag === "icon") {
    return <MdiIcon icon={attributes.icon || 'square'} {...attributes} />;
  }

  if(Tag === "stack") {
    return <Stack {...attributes}>{children}</Stack>
  }

  if(Tag === "typography") {
    return <Typography {...attributes}>{children}</Typography>
  }



  if(children) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return <Tag {...attributes}>{children}</Tag>
  } else {
    return <Tag {...attributes} />
  }
}

const getChildrenOrText = (config: HtmlConfig): Array<JSX.Element> | string | undefined => {
  if(config.children) {
    const children: Array<JSX.Element> = [];

    config.children.forEach(child => {
      children!.push(convertToJSX({...child, key: v4()}));
    })

    return children;
  } else if (config.text) {
    return config.text;
  }
}
