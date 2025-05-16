import React, {useState} from 'react';
import {Box, CssBaseline, useTheme} from "@mui/material";
import TopBar from "@cody-play/app/layout/TopBar";
import Sidebar from "@cody-play/app/layout/Sidebar";
import jexl from "@app/shared/jexl/get-configured-jexl";
import {useVibeCodyDrawerOpen} from "@cody-play/hooks/use-vibe-cody-drawer-open";
import {VIBE_CODY_DRAWER_WIDTH} from "@cody-play/app/components/core/vibe-cody/VibeCodyDrawer";

interface MainLayoutProps {
    children: React.ReactNode;
}

const MainLayout = (props: MainLayoutProps) => {
    const theme = useTheme();
    const [vibeCodyOpen] = useVibeCodyDrawerOpen();

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
            paddingBottom: {
              xs: "50px"
            },
            height: '100%',
            width: `calc(100% - ${vibeCodyOpen? VIBE_CODY_DRAWER_WIDTH : 0}px)`,
            boxSizing: 'border-box',
            backgroundColor: (theme) => theme.palette.background.default,
            display: 'flex',
        }}>
            <CssBaseline />
            <TopBar sidebarOpen={sideBarOpen} onOpenSidebar={handleOpenSidebar} />
            <Sidebar open={sideBarOpen} onClose={() => setSideBarOpen(false)} />
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
