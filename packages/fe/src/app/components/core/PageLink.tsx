import * as React from 'react';
import {isSubLevelPage, isTopLevelPage, PageDefinition} from "@frontend/app/pages/page-definitions";
import {generatePath, Link} from "react-router-dom";
import {PropsWithChildren} from "react";
import {PageLinkTableColumn} from "@cody-engine/cody/hooks/utils/value-object/types";
import {PlayPageDefinition, PlayPageRegistry} from "@cody-play/state/types";
import {names} from "@event-engine/messaging/helpers";
import {PageRegistry} from "@frontend/app/pages";

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

export const getPageDefinition = (linkedPage: string, defaultService: string, pages: PageRegistry): PageDefinition => {
  const parts = linkedPage.split(".");
  let service: string, pageName: string;

  if(parts.length === 2) {
    [service, pageName] = parts;
  } else {
    service = defaultService;
    pageName = linkedPage;
  }

  const pageFullName = names(service).className + '.' + names(pageName).className;

  const page = pages[pageFullName];

  if(!page) {
    throw new Error(`Cannot find page "${pageFullName}". Did you forget to pass it to Cody?`);
  }

  return page;
}

const PageLink = (props: PageLinkProps) => {
  return <Link to={generatePageLink(props.page, props.params)}>{props.children}</Link>
};

export default PageLink;
