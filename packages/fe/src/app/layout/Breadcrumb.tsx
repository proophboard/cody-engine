import * as React from 'react';
import {PageDefinition} from "@frontend/app/pages/page-definitions";
import {useEffect, useState} from "react";
import {Typography, useTheme} from "@mui/material";
import {useQueryClient} from "@tanstack/react-query";
import {generatePath, Link, useParams} from "react-router-dom";

interface OwnProps {
  page: PageDefinition;
  isLast: boolean;
}

type BreadcrumbProps = OwnProps;

const Breadcrumb = (props: BreadcrumbProps) => {
  const theme = useTheme();
  const [label, setLabel] = useState('');
  const queryClient = useQueryClient();
  const params = useParams();

  useEffect(() => props.page.breadcrumb(params as Record<string, string>, queryClient, l => setLabel(l)), []);


  if(props.isLast) {
    return <Typography
      key={props.page.route}
      sx={{color: theme.palette.primary.contrastText}}
      aria-current="page">{label}</Typography>
  } else {
    return <Link to={generatePath(props.page.route, params)}
                 key={props.page.route}
                 style={{color: theme.palette.primary.contrastText, textDecoration: 'none'}}
    >{label}</Link>
  }
};

export default Breadcrumb;
