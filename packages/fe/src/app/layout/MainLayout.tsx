import React, { useState, useContext } from 'react';
import { Box, CssBaseline, Button } from "@mui/material";
import TopBar from "@frontend/app/layout/TopBar";
import Sidebar from "@frontend/app/layout/Sidebar";
import { ColorModeContext } from "@frontend/app/providers/ToggleColorMode"; // Updated import to use new context

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = (props: MainLayoutProps) => {
  const [sideBarOpen, setSideBarOpen] = useState<boolean>(false);
  const { toggleTheme } = useContext(ColorModeContext);  // Use useContext to access the toggleTheme function

  const handleOpenSidebar = (sidebarOpenFromTopBar: boolean) => {
    setSideBarOpen(sidebarOpenFromTopBar);
  };

  return (
    <Box sx={{
      paddingTop: { xs: "56px", sm: "64px" },
      paddingLeft: { lg: "300px" },
      height: '100%',
      boxSizing: 'border-box',
      backgroundColor: (theme) => theme.palette.background.default,
      display: 'flex'
    }}>
      <CssBaseline />
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
        <Button onClick={toggleTheme}>Toggle Theme</Button>
      </Box>
    </Box>
  );
};

export default MainLayout;
