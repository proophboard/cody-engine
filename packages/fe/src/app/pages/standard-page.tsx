import {PageDefinition, Tab} from "@frontend/app/pages/page-definitions";
import Grid2 from "@mui/material/Unstable_Grid2";
import {generatePath, useParams} from "react-router-dom";
import CommandBar from "@frontend/app/layout/CommandBar";
import {loadCommandComponent} from "@frontend/util/components/load-command-components";
import {loadViewComponent} from "@frontend/util/components/load-view-components";
import {PageRegistry, pages} from "@frontend/app/pages/index";

interface Props {
  page: PageDefinition
}

const findTabGroup = (groupName: string, pages: PageRegistry, routeParams: Readonly<Record<string, string>>): Tab[] => {
  return Object.values(pages).filter(p => p.tab && p.tab.group === groupName).map(p => {
    return {
      ...p.tab!,
      route: generatePath(p.route, routeParams)
    }
  });
}

export const StandardPage = (props: Props) => {
  const routeParams = useParams();

  const cmdBtns = props.page.commands.map((commandName,index) => {
    const Command = loadCommandComponent(commandName);
    return <Command key={commandName} {...routeParams} />
  });

  let tabs;

  if(props.page.tab) {
    tabs = findTabGroup(props.page.tab.group, pages, routeParams as Readonly<Record<string, string>>);
  }

  const commandBar = cmdBtns.length || tabs ? <Grid2 xs={12}><CommandBar tabs={tabs}>{cmdBtns}</CommandBar></Grid2> : <></>;

  const components = props.page.components.map((valueObjectName, index) => {
    const ViewComponent = loadViewComponent(valueObjectName);

    return <Grid2 key={'comp' + index} xs={12}>{ViewComponent(routeParams)}</Grid2>
  });

  return <Grid2 container={true} spacing={3}>
    {commandBar}
    {components}
  </Grid2>
}
