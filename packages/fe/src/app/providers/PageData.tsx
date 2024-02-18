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

const PageDataProvider = (props: PageDataProviderProps) => {
  const [pageData, setPageData] = useState(EmptyPageData);

  const addQueryResult: AddQueryResult = (name: string, result: UseQueryResult) => {
    if(!pageData[name]) {
      const newPageData = {...pageData};
      newPageData[name] = result;
      setPageData(newPageData);
    }
  }

  const reset = () => {
    setPageData(EmptyPageData);
  }

  return <PageDataContext.Provider value={{pageData, addQueryResult, reset}}>
    {props.children}
  </PageDataContext.Provider>
}

export default PageDataProvider;
