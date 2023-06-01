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
  let path: string = '/';

  if(isTopLevelPage(props.page)) {
    path = props.page.route;
  }

  if(isSubLevelPage(props.page)) {
    path = generatePath(props.page.route, props.params);
  }

  return <Link to={path}>{props.children}</Link>
};

export default PageLink;
