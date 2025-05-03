import * as React from 'react';
import {Box, Breadcrumbs as MaterialBreadcrumbs, SxProps, useTheme} from "@mui/material";
import Breadcrumb from "@frontend/app/layout/Breadcrumb";
import {usePageMatch} from "@frontend/util/hook/use-page-match";
import {useMatchingPages} from "@frontend/util/hook/use-matching-pages";
import {BreadcrumbFn, PageDefinition} from "@frontend/app/pages/page-definitions";
import {environment} from "@frontend/environments/environment";

interface OwnProps {

}

type BreadcrumbsProps = OwnProps;

const Breadcrumbs = (props: BreadcrumbsProps) => {
  const {handle: {page}} = usePageMatch();
  const theme = useTheme();

  const color = environment.layout === 'task-based-ui' ? theme.palette.secondary.main : theme.palette.primary.contrastText

  const matchingPages = useMatchingPages();

  const matchingPagesWithBreadcrumb = matchingPages.filter(p => p.breadcrumb || p['breadcrumb:t']);

  const links = matchingPagesWithBreadcrumb.map((matchedPage, index) => {
    return <Breadcrumb key={matchedPage.route} page={matchedPage as PageDefinition & {breadcrumb: BreadcrumbFn}} isLast={index === matchingPages.length - 1} color={color} />
  });

  return <Box component={"div"}
              sx={(theme) => {
                const sx: SxProps & {width?: string} = {
                  [theme.breakpoints.down("md")]: {
                    display: "none"
                  }
                }

                if(environment.layout === 'task-based-ui') {
                  sx['width'] = "100%"
                }

                return sx;
              }}
              >
    <MaterialBreadcrumbs aria-label="breadcrumb" sx={{"& .MuiBreadcrumbs-separator": {color} }}>
      {links}
    </MaterialBreadcrumbs>
  </Box>
};

export default Breadcrumbs;
