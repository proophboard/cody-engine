import {PageDefinition} from "@frontend/app/pages/page-definitions";
import Grid2 from "@mui/material/Unstable_Grid2";
import {useParams} from "react-router-dom";
import CommandBar from "@frontend/app/layout/CommandBar";
import {commands as commandComponents} from "@frontend/app/components/commands";
import {views as viewComponents} from "@frontend/app/components/views";

interface Props {
  page: PageDefinition
}

export const StandardPage = (props: Props) => {
  const routeParams = useParams();

  const cmdBtns = props.page.commands.map((commandName,index) => {
    if(!commandComponents[commandName]) {
      throw new Error(`No command component registered for command: "${commandName}". Please check the registry file: packages/fe/src/app/components/commands.ts!`);
    }

    const Command = commandComponents[commandName];
    return <Command key={commandName}/>
  });

  const commandBar = cmdBtns.length ? <Grid2 xs={12}><CommandBar>{cmdBtns}</CommandBar></Grid2> : <></>;

  const components = props.page.components.map((valueObjectName, index) => {
    if(!viewComponents[valueObjectName]) {
      throw new Error(`No view component registered for value object: "${valueObjectName}". Please check the registry file: packages/fe/src/app/components/views.ts!`);
    }

    const ViewComponent = viewComponents[valueObjectName];

    return <Grid2 key={'comp' + index} xs={12}>{ViewComponent(routeParams)}</Grid2>
  });

  return <Grid2 container={true} spacing={3}>
    {commandBar}
    {components}
  </Grid2>
}
