import * as React from 'react';
import {PropsWithChildren, useContext, useEffect} from "react";
import {CodyPlayConfig, configStore} from "@cody-play/state/config-store";
import {CodyMessageServer} from "@cody-play/infrastructure/cody/cody-message-server";
import {InMemoryDocumentStore} from "@event-engine/infrastructure/DocumentStore/InMemoryDocumentStore";
import {InMemoryEventStore} from "@event-engine/infrastructure/EventStore/InMemoryEventStore";
import {getConfiguredPlayEventStore} from "@cody-play/infrastructure/multi-model-store/configured-event-store";
import {getConfiguredPlayDocumentStore} from "@cody-play/infrastructure/multi-model-store/configured-document-store";


type CodyMessageServerProps = PropsWithChildren;

let codyMessageServer: CodyMessageServer | undefined;

const es = getConfiguredPlayEventStore();
const ds = getConfiguredPlayDocumentStore();

export const savePlayshot = async (name: string, boardId: string): Promise<boolean> => {
  if(!codyMessageServer || !codyMessageServer.isConnected()) {
    return false;
  }

  return codyMessageServer.savePlayshot(name, boardId);
}

const CodyMessageServerInjection = (props: CodyMessageServerProps) => {
  const {config, dispatch} = useContext(configStore);

  useEffect(() => {
    if(!codyMessageServer) {
      codyMessageServer = new CodyMessageServer(config, dispatch, es, ds);
    } else {
      codyMessageServer.updateConfig(config);
    }
  }, [config]);

  return <>{props.children}</>
};

export default CodyMessageServerInjection;
