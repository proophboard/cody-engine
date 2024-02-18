import {PageData, AddQueryResult} from "@app/shared/types/core/page-data/page-data";
import {useContext} from "react";
import {PageDataContext} from "@frontend/app/providers/PageData";

export const usePageData = (): [PageData, AddQueryResult] => {
  const ctx = useContext(PageDataContext);

  return [ctx.pageData, ctx.addQueryResult];
}
