import * as React from 'react';
import {Box, Button, Collapse, List, ListItem, useTheme} from "@mui/material";
import {useState} from "react";
import {ExpandLess, ExpandMore} from "@mui/icons-material";
import {makeButtonSx, makeIconBoxSx, makeListItemSx} from "@frontend/app/layout/Sidebar";

interface OwnProps {
  name: string;
  label: string;
  Icon: JSX.Element;
  pages: JSX.Element[]
}

type SidebarNavGroupProps = OwnProps;

const SidebarNavGroup = (props: SidebarNavGroupProps) => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  const handleClick = () => {
    setOpen(!open);
  }

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
    </ListItem>
    <Collapse in={open} timeout="auto" unmountOnExit={true}>
      <List sx={{marginLeft: theme.spacing(2)}}>
        {props.pages}
      </List>
    </Collapse>
  </div>
};

export default SidebarNavGroup;
