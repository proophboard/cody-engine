import * as React from 'react';
import {PageDefinition} from "@frontend/app/pages/page-definitions";
import {Button, List, ListItem} from "@mui/material";
import {generatePath, NavLink} from "react-router-dom";
import {usePageMatch} from "@frontend/util/hook/use-page-match";
import {useEffect, useState} from "react";
import {useQueryClient} from "@tanstack/react-query";

interface OwnProps {
  page: PageDefinition
}

type SubMenuItemProps = OwnProps;

const SubMenuItem = (props: SubMenuItemProps) => {
  const {params} = usePageMatch();
  const [label, setLabel] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    return props.page.breadcrumb(params, queryClient, l => setLabel(l));
  }, [props.page, params]);

  return <ListItem sx={{
      display: 'flex',
      paddingTop: 0,
      paddingBottom: 0,
    }} key={props.page.route}>
      <Button
        sx={{
          color: theme => theme.palette.primary.main,
          padding: '10px 8px',
          justifyContent: 'flex-start',
          textTransform: 'none',
          letterSpacing: 0,
          width: '100%',
          fontWeight: theme => theme.typography.fontWeightMedium
        }}
        component={NavLink}
        to={generatePath(props.page.route, params)}
        children={label}
        onClick={() => {
          window.scrollTo({
            top: 0,
            behavior: "smooth"
          })
        }}
      />
    </ListItem>
};

export default SubMenuItem;
