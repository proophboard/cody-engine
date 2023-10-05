import * as React from 'react';
import {PropsWithChildren, useContext, useEffect} from "react";
import {configStore} from "@cody-play/state/config-store";
import {CodyMessageServer} from "@cody-play/infrastructure/cody/cody-message-server";


type CodyMessageServerProps = PropsWithChildren;

let codyMessageServer: CodyMessageServer | undefined;

const CodyMessageServerInjection = (props: CodyMessageServerProps) => {
  const {config, dispatch} = useContext(configStore);

  useEffect(() => {
    if(!codyMessageServer) {
      codyMessageServer = new CodyMessageServer(config, dispatch);
    } else {
      codyMessageServer.updateConfig(config);
    }
  }, [config]);

  return <>{props.children}</>
};

export default CodyMessageServerInjection;
