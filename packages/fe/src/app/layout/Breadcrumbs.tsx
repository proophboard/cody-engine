import * as React from 'react';
import {Box, Breadcrumbs as MaterialBreadcrumbs} from "@mui/material";
import {useMatches} from "react-router-dom";
import {PageDefinition} from "@frontend/app/pages/page-definitions";
import {pages} from "@frontend/app/pages";
import Breadcrumb from "@frontend/app/layout/Breadcrumb";

interface OwnProps {

}

type BreadcrumbsProps = OwnProps;

const Breadcrumbs = (props: BreadcrumbsProps) => {
  const matches = useMatches();

  const lastMatch = matches[matches.length - 1];
  const {handle: {page}} = lastMatch as {handle: {page: PageDefinition}, params: Record<string, string>, pathname: string};

  const matchingPages = Object.values(pages).filter(p => page.route.includes(p.route))

  const links = matchingPages.map((matchedPage, index) => {
    return <Breadcrumb key={matchedPage.route} page={matchedPage} isLast={index === matchingPages.length - 1} />
  });

  return <Box component={"div"}
              sx={(theme) => ({
                [theme.breakpoints.down("md")]: {
                  display: "none"
                }
              })}
              >
    <MaterialBreadcrumbs aria-label="breadcrumb" sx={{"& .MuiBreadcrumbs-separator": {color: (theme) => theme.palette.primary.contrastText} }}>
      {links}
    </MaterialBreadcrumbs>
  </Box>
};

export default Breadcrumbs;
