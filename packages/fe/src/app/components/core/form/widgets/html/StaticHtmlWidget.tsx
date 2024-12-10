import * as React from 'react';
import {HtmlConfig} from "@frontend/app/components/core/form/widgets/HtmlWidget";
import {useNavigate} from "react-router-dom";
import {useEffect, useRef} from "react";
import {WidgetProps} from "@rjsf/utils";

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

  const innerHtml = convertConfigToHtml(props.config);
  const style = props.style || {};

  useEffect(() => {
    if(divRef.current) {
      divRef.current.innerHTML = innerHtml;
      console.log(divRef.current, innerHtml);
      divRef.current.querySelectorAll('a').forEach((a: HTMLAnchorElement) => {
        if(a.href && a.href.includes(window.location.hostname)) {
          a.onclick = (e) => {
            e.preventDefault();
            const url = new URL(a.href);
            navigate(url.pathname);
          }
        }
      })
    }
  }, [divRef.current, innerHtml]);

  if(props.hidden) {
    return <></>;
  }

  return (
    <div ref={divRef} style={style}/>
  );
};

export default StaticHtmlWidget;

const SkipAttributes = ['tag', 'children', 'text', 'query', 'if', 'ui:style']

const convertConfigToHtml = (config: HtmlConfig): string => {
  let innerHtml = '';

  if(config.children) {
    config.children.forEach(child => {
      innerHtml += convertConfigToHtml(child);
    })
  }

  if(config.text) {
    innerHtml = config.text;
  }

  const tag = config.tag || 'div';

  const attributesStrArr = [];

  for (const attribute in config) {
    if(attribute.includes(":expr")) {
      continue;
    }

    if(SkipAttributes.includes(attribute)) {
      continue;
    }

    attributesStrArr.push(`${attribute}="${config[attribute]}"`)
  }

  return `<${tag} ${attributesStrArr.join(' ')}>${innerHtml}</${tag}>`;
}
