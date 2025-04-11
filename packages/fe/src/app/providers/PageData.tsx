import {AddQueryResultOrData, PageData} from "@app/shared/types/core/page-data/page-data";
import React, {PropsWithChildren, useState} from "react";
import {UseQueryResult} from "@tanstack/react-query";
import {AddPageFormReference, PageFormReference, PageFormRegistry} from "@app/shared/types/core/page-form/page-form";

const EmptyPageData: PageData = {};

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface OwnProps {

}

type PageDataProviderProps = OwnProps & PropsWithChildren;


export const PageDataContext = React.createContext({
  pageData: EmptyPageData,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  addQueryResult: (name: string, result: UseQueryResult | unknown) => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  addPageForm: (name: string, form: PageFormReference) => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  reset: () => {}
});

let currentPageData: PageData = {};

const PageDataProvider = (props: PageDataProviderProps) => {
  const [pageData, setPageData] = useState(EmptyPageData);

  const addQueryResult: AddQueryResultOrData = (name: string, result: UseQueryResult | unknown) => {
    const newPageData = {...currentPageData};
    newPageData[name] = result;
    currentPageData[name] = result;
    setPageData(newPageData);
  }

  const addPageForm: AddPageFormReference = (name: string, form: PageFormReference) => {
    const newPageData = {...currentPageData};
    newPageData[name] = form;
    currentPageData[name] = form;
    setPageData(newPageData);
  }

  const reset = () => {
    setPageData(EmptyPageData);
    currentPageData = {};
  }

  return <PageDataContext.Provider value={{pageData, addQueryResult, addPageForm, reset}}>
    {props.children}
  </PageDataContext.Provider>
}

export default PageDataProvider;
