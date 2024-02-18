import * as React from 'react';
import {PropsWithChildren, useEffect, useState} from "react";
import {Card, CardActions, CardHeader, Divider, useTheme} from "@mui/material";

export interface Tab {
  label: string;
  route: string;
  active: boolean;
}

interface OwnProps {
  tabs?: Tab[];
}

type CommandBarProps = OwnProps & PropsWithChildren;

// const renderTabs = (tabs: Tab[]) {
//   const tabComponents = tabs.map(tab =>  )
// }

const CommandBar = (props: CommandBarProps) => {
  const [fixed, setFixed] = useState<boolean>(false);
  const theme = useTheme();

  useEffect(() => {
    const listener = () => {
      const scrollTop = window.scrollY;

      if(scrollTop >= 80) {
        setFixed(true);
      } else {
        setFixed(false);
      }
    }

    window.addEventListener('scroll', listener);

    listener();

    return () => {
      window.removeEventListener('scroll', listener);
    }
  });

  const cardActions = <CardActions sx={{
    overflow: "auto",
    whiteSpace: "nowrap",
    '& button': {
      minWidth: "160px"
    }
  }}>
    {props.children}
  </CardActions>;

  return <>
    <Card sx={fixed? {
      position: 'fixed',
      zIndex: 1000,
      top: '60px',
      width: 'auto',
      right: '20px',
      [theme.breakpoints.down('lg')]: {
        left: '20px'
      },
      [theme.breakpoints.up('lg')]: {
        left: '320px'
      }
    } : {
      width: 'auto',
    }}>
      {!fixed && <CardHeader title="Actions"/>}
      {!fixed && <Divider/>}
      {cardActions}
    </Card>
    {fixed && /* Mirror card to keep same space in the DOM */ <Card>
      <CardHeader title="Actions"/>
      <Divider/>
      {cardActions}
    </Card>}
  </>
};

export default CommandBar;
