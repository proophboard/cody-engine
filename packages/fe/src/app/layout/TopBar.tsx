import * as React from 'react';
import {AppBar, Box, Toolbar, Typography} from "@mui/material";
import Breadcrumbs from "@frontend/app/layout/Breadcrumbs";

interface OwnProps {

}

type TopBarProps = OwnProps;

const TopBar = (props: TopBarProps) => {
  return (
    <AppBar position="fixed" color="default" sx={{
      boxShadow: "none",
      backgroundColor: (theme) => theme.topBar.background,
      height: "64px"
    }}>
      <Toolbar>
        <Box component={"div"} sx={{minWidth: {lg: "300px"}}}>
          <Typography variant={"h3"} sx={{color: (theme) => theme.palette.primary.main}}>Cody Engine</Typography>
        </Box>
        <Breadcrumbs />
        <Box component={"div"} sx={{flexGrow: 1}} />

      </Toolbar>
    </AppBar>
  )
};

export default TopBar;
