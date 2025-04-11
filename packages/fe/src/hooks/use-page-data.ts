import {PageData, AddQueryResultOrData} from "@app/shared/types/core/page-data/page-data";
import {useContext} from "react";
import {PageDataContext} from "@frontend/app/providers/PageData";
import {AddPageFormReference} from "@app/shared/types/core/page-form/page-form";

export const usePageData = (): [PageData, AddQueryResultOrData, AddPageFormReference] => {
  const ctx = useContext(PageDataContext);

  return [ctx.pageData, ctx.addQueryResult, ctx.addPageForm];
}
