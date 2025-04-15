import React, {useState} from 'react';
import {Box, CssBaseline, useTheme} from "@mui/material";
import TopBar from "@frontend/app/layout/TopBar";
import Sidebar from "@frontend/app/layout/Sidebar";
import jexl from "@app/shared/jexl/get-configured-jexl";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = (props: MainLayoutProps) => {
  const theme = useTheme();
  const [sideBarOpen, setSideBarOpen] = useState<boolean>(false);

  const handleOpenSidebar = (sidebarOpenFromTopBar: boolean) => {
    setSideBarOpen(sidebarOpenFromTopBar);
  }

  jexl.addFunction("mediaQuery", (direction: "up" | "down", key: "xs" | "sm" | "md" | "lg" | "xl") => {
    const breakPointHelper = direction === "up" ? theme.breakpoints.up : theme.breakpoints.down;
    return window.matchMedia(breakPointHelper(key).replace('@media ', '')).matches;
  });

  return (
    <Box sx={{
      paddingTop: {
        xs: "56px",
        sm: "64px"
      },
      paddingLeft: {
        lg: "300px"
      },
      height: '100%',
      boxSizing: 'border-box',
      backgroundColor: (theme) => theme.palette.background.default,
      display: 'flex'
    }}>
      <CssBaseline/>
      <TopBar sidebarOpen={sideBarOpen} onOpenSidebar={handleOpenSidebar}/>
      <Sidebar open={sideBarOpen} onClose={() => setSideBarOpen(false)}/>
      <Box component={"main"} sx={{
        padding: "32px",
        minHeight: '100%',
        boxSizing: 'border-box',
        width: '100%',
        backgroundColor: (theme) => theme.palette.background.default
      }}>
        {props.children}
      </Box>
    </Box>
  );
};

export default MainLayout;
