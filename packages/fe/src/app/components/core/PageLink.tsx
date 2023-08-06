import * as React from 'react';
import {isSubLevelPage, isTopLevelPage, PageDefinition} from "@frontend/app/pages/page-definitions";
import {generatePath, Link} from "react-router-dom";
import {PropsWithChildren} from "react";

interface OwnProps {
  page: PageDefinition,
  params?: Record<string, any>,
}

type PageLinkProps = OwnProps & PropsWithChildren;

const PageLink = (props: PageLinkProps) => {
  let path = '/';

  if(isTopLevelPage(props.page)) {
    path = props.page.route;
  }

  if(isSubLevelPage(props.page)) {
    try {
      path = generatePath(props.page.route, props.params);
    } catch (e) {
      console.error("[PageLink] Failed to generate path: ", e);
      return <>{props.children}</>
    }
  }

  return <Link to={path}>{props.children}</Link>
};

export default PageLink;
