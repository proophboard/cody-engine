import * as React from 'react';
import {Box, Button, Collapse, IconButton, List, ListItem, useTheme} from "@mui/material";
import {useContext, useState} from "react";
import {ExpandLess, ExpandMore} from "@mui/icons-material";
import {makeButtonSx, makeIconBoxSx, makeListItemSx} from "@frontend/app/layout/Sidebar";
import {LiveEditModeContext} from "@cody-play/app/layout/PlayToggleLiveEditMode";
import {useVibeCodyFocusElement} from "@cody-play/hooks/use-vibe-cody";
import {usePlayPageMatch} from "@cody-play/hooks/use-play-page-match";
import {PlayPageDefinition} from "@cody-play/state/types";
import {FocusedSidebarItem} from "@cody-play/state/focused-element";
import {Target} from "mdi-material-ui";
import {PageDefinition} from "@frontend/app/pages/page-definitions";

interface OwnProps {
  name: string;
  label: string;
  Icon: JSX.Element;
  pages: JSX.Element[],
  pageDefinitions: PageDefinition[],
}

type SidebarNavGroupProps = OwnProps;

const isActive = (currentPage: PlayPageDefinition, pageDefinitions: PageDefinition[]): boolean => {
  for (const pageDefinition of pageDefinitions) {
    if(currentPage.name === pageDefinition.name) {
      return true;
    }
  }

  return false;
}

const SidebarNavGroup = (props: SidebarNavGroupProps) => {
  const theme = useTheme();
  const pageMatch = usePlayPageMatch();
  const [open, setOpen] = useState(isActive(pageMatch.handle.page, props.pageDefinitions));
  const { liveEditMode } = useContext(LiveEditModeContext);
  const [focusedEle, setFocusedEle] = useVibeCodyFocusElement();

  const handleClick = () => {
    setOpen(!open);
  }

  const isFocusedEle = focusedEle && focusedEle.type === "sidebarItemGroup" && focusedEle.id === props.name;

  return <div>
    <ListItem
      key={props.name}
      disableGutters={true}
      sx={makeListItemSx(theme)}
    >
      <Button
        sx={makeButtonSx(theme)}
        onClick={handleClick}
      >
        <Box component={"div"} sx={makeIconBoxSx(theme)}>
          {props.Icon}
        </Box>
        {props.label}
        {open? <ExpandLess /> : <ExpandMore />}
      </Button>
      {liveEditMode && <IconButton onClick={() => setFocusedEle({
        id: props.name,
        name: props.label,
        type: 'sidebarItemGroup'
      })} color={isFocusedEle ? 'info' : undefined}><Target /></IconButton>}
    </ListItem>
    <Collapse in={open} timeout="auto" unmountOnExit={true}>
      <List sx={{marginLeft: theme.spacing(2)}}>
        {props.pages}
      </List>
    </Collapse>
  </div>
};

export default SidebarNavGroup;
