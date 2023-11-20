import * as React from 'react';
import {PropsWithChildren, useEffect, useState} from "react";
import {getConfiguredPlayEventStore} from "@cody-play/infrastructure/multi-model-store/configured-event-store";

interface OwnProps {

}

type PendingChangesProps = OwnProps & PropsWithChildren;

// eslint-disable-next-line @typescript-eslint/no-empty-function
export const PendingChangesContext = React.createContext({pendingChanges: false, setPendingChanges: (pending: boolean) => {}});

const es = getConfiguredPlayEventStore();

const PendingChanges = (props: PendingChangesProps) => {
  const [pendingChanges, setPendingChanges] = useState(false);

  return <PendingChangesContext.Provider value={{pendingChanges, setPendingChanges}}>
    {props.children}
  </PendingChangesContext.Provider>
};

export default PendingChanges;
