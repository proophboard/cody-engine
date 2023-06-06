import {PageDefinition} from "@frontend/app/pages/page-definitions";
import Grid2 from "@mui/material/Unstable_Grid2";
import {useParams} from "react-router-dom";
import CommandBar from "@frontend/app/layout/CommandBar";

interface Props {
  page: PageDefinition
}

export const StandardPage = (props: Props) => {
  const routeParams = useParams();

  const cmdBtns = props.page.commands.map((Command,index) => <Command key={'cmd'+index} />);

  const commandBar = cmdBtns.length ? <Grid2 xs={12}><CommandBar>{cmdBtns}</CommandBar></Grid2> : <></>;

  const components = props.page.components.map((c, index) => <Grid2 key={'comp'+index} xs={12}>{c(routeParams)}</Grid2>);

  return <Grid2 container={true} spacing={3}>
    {commandBar}
    {components}
  </Grid2>
}
