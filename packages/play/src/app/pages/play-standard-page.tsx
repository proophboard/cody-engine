import Grid2 from "@mui/material/Unstable_Grid2";
import {generatePath, useParams} from "react-router-dom";
import CommandBar from "@frontend/app/layout/CommandBar";
import React, {useContext, useEffect} from "react";
import {configStore} from "@cody-play/state/config-store";
import PlayCommand from "@cody-play/app/components/core/PlayCommand";
import {PlayInformationRegistry, PlayPageRegistry} from "@cody-play/state/types";
import {isQueryableListDescription, isQueryableStateListDescription} from "@event-engine/descriptions/descriptions";
import PlayTableView from "@cody-play/app/components/core/PlayTableView";
import PlayStateView from "@cody-play/app/components/core/PlayStateView";
import {PageDataContext} from "@frontend/app/providers/PageData";
import {usePageMatch} from "@frontend/util/hook/use-page-match";
import {Tab} from "@frontend/app/pages/page-definitions";
import { Alert } from "@mui/material";

interface Props {
  page: string
}

const findTabGroup = (groupName: string, pages: PlayPageRegistry, routeParams: Readonly<Record<string, string>>): Tab[] => {
  return Object.values(pages).filter(p => p.tab && p.tab.group === groupName).map(p => {
    return {
      ...p.tab!,
      route: generatePath(p.route, routeParams)
    }
  });
}


export const PlayStandardPage = (props: Props) => {
  const routeParams = useParams();
  const pageMatch = usePageMatch();
  const {config} = useContext(configStore);
  const {reset} = useContext(PageDataContext);

  useEffect(() => {
    return () => {
      reset();
    }
  }, []);

  const page = config.pages[props.page];

  const cmdBtns = page.commands.map((commandName,index) => {
    const cmd = config.commands[commandName as string];

    if(!cmd) {
      return <Alert severity="error">{`Command "${commandName}" not found! You have to pass the command to Cody on prooph board.`}</Alert>
    }


    return <PlayCommand key={commandName} command={config.commands[commandName as string]} />
  });

  let tabs;

  if(page.tab) {
    tabs = findTabGroup(page.tab.group, config.pages, routeParams as Readonly<Record<string, string>>);
  }

  const commandBar = cmdBtns.length || tabs ? <Grid2 xs={12}><CommandBar tabs={tabs}>{cmdBtns}</CommandBar></Grid2> : <></>;

  const components = page.components.map((valueObjectName, index) => {
    if(!config.views[valueObjectName]) {
      throw new Error(`View Component for Information: "${valueObjectName}" is not registered. Did you forget to pass the corresponding Information card to Cody?`);
    }

    const ViewComponent = getViewComponent(config.views[valueObjectName], config.types);

    return <Grid2 key={'comp' + index} xs={12}>{ViewComponent(routeParams)}</Grid2>
  });

  return <Grid2 container={true} spacing={3}>
    {commandBar}
    {components}
  </Grid2>
}

const getViewComponent = (component: React.FunctionComponent | { information: string }, types: PlayInformationRegistry): React.FunctionComponent => {
  if(typeof component === "object" && component.information) {
    const information = types[component.information];

    if(!information) {
      throw new Error(`Cannot find view information "${component.information}". Did you forget to run Cody for information card?`)
    }

    if(isQueryableStateListDescription(information.desc) || isQueryableListDescription(information.desc)) {
      return (params: any) => {
        return PlayTableView(params, information);
      };
    } else {
      return (params: any) => {
        return PlayStateView(params, information);
      }
    }
  }

  return component as React.FunctionComponent;
}
