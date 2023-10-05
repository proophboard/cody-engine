import * as React from 'react';
import {Box, Breadcrumbs as MaterialBreadcrumbs} from "@mui/material";
import PlayBreadcrumb from "@cody-play/app/layout/PlayBreadcrumb";
import {usePlayMatchingPages} from "@cody-play/hooks/use-play-matching-pages";
import {usePlayPageMatch} from "@cody-play/hooks/use-play-page-match";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface OwnProps {

}

type BreadcrumbsProps = OwnProps;

const PlayBreadcrumbs = (props: BreadcrumbsProps) => {
  const {handle: {page}} = usePlayPageMatch();

  const matchingPages = usePlayMatchingPages();

  const links = matchingPages.map((matchedPage, index) => {
    return <PlayBreadcrumb key={matchedPage.route} page={matchedPage} isLast={index === matchingPages.length - 1} />
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

export default PlayBreadcrumbs;
