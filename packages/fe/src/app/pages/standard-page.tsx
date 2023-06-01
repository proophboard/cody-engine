import {PageDefinition} from "@frontend/app/pages/page-definitions";
import Grid2 from "@mui/material/Unstable_Grid2";
import {useParams} from "react-router-dom";

interface Props {
  page: PageDefinition
}

export const StandardPage = (props: Props) => {
  const routeParams = useParams();

  const components = props.page.components.map((c, index) => <Grid2 key={'c'+index} xs={12}>{c(routeParams)}</Grid2>);

  return <Grid2 container={true} spacing={3}>
    {components}
  </Grid2>
}
