import * as React from 'react';
import {Box, Breadcrumbs as MaterialBreadcrumbs} from "@mui/material";
import Breadcrumb from "@frontend/app/layout/Breadcrumb";
import {usePageMatch} from "@frontend/util/hook/use-page-match";
import {useMatchingPages} from "@frontend/util/hook/use-matching-pages";
import {BreadcrumbFn, PageDefinition} from "@frontend/app/pages/page-definitions";

interface OwnProps {

}

type BreadcrumbsProps = OwnProps;

const Breadcrumbs = (props: BreadcrumbsProps) => {
  const {handle: {page}} = usePageMatch();

  const matchingPages = useMatchingPages();

  const matchingPagesWithBreadcrumb = matchingPages.filter(p => !!p.breadcrumb);

  const links = matchingPagesWithBreadcrumb.map((matchedPage, index) => {
    return <Breadcrumb key={matchedPage.route} page={matchedPage as PageDefinition & {breadcrumb: BreadcrumbFn}} isLast={index === matchingPages.length - 1} />
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
