import * as React from 'react';
import {isSubLevelPage, isTopLevelPage, PageDefinition} from "@frontend/app/pages/page-definitions";
import {generatePath, Link} from "react-router-dom";
import {PropsWithChildren} from "react";

interface OwnProps {
  page: PageDefinition,
  params?: Record<string, any>,
}

type PageLinkProps = OwnProps & PropsWithChildren;

export const generatePageLink = (page: PageDefinition, params?: Record<any, any>) => {
  if(isTopLevelPage(page)) {
    return page.route;
  }

  if(isSubLevelPage(page)) {
    try {
      return generatePath(page.route, params);
    } catch (e) {
      console.error("[PageLink] Failed to generate path: ", e);
      return "";
    }
  }

  return '/';
}

const PageLink = (props: PageLinkProps) => {
  return <Link to={generatePageLink(props.page, props.params)}>{props.children}</Link>
};

export default PageLink;
