import {PageData, AddQueryResultOrData} from "@app/shared/types/core/page-data/page-data";
import {useContext} from "react";
import {PageDataContext} from "@frontend/app/providers/PageData";

export const usePageData = (): [PageData, AddQueryResultOrData] => {
  const ctx = useContext(PageDataContext);

  return [ctx.pageData, ctx.addQueryResult];
}
