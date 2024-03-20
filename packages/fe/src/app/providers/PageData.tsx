import {AddQueryResult, PageData} from "@app/shared/types/core/page-data/page-data";
import React, {PropsWithChildren, useState} from "react";
import {UseQueryResult} from "@tanstack/react-query";

const EmptyPageData: PageData = {};

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface OwnProps {

}

type PageDataProviderProps = OwnProps & PropsWithChildren;


export const PageDataContext = React.createContext({
  pageData: EmptyPageData,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  addQueryResult: (name: string, result: UseQueryResult) => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  reset: () => {}
});

let currentPageData: PageData = {};

const PageDataProvider = (props: PageDataProviderProps) => {
  const [pageData, setPageData] = useState(EmptyPageData);

  const addQueryResult: AddQueryResult = (name: string, result: UseQueryResult) => {
    const newPageData = {...currentPageData};
    newPageData[name] = result;
    currentPageData[name] = result;
    setPageData(newPageData);
  }

  const reset = () => {
    setPageData(EmptyPageData);
    currentPageData = {};
  }

  return <PageDataContext.Provider value={{pageData, addQueryResult, reset}}>
    {props.children}
  </PageDataContext.Provider>
}

export default PageDataProvider;
