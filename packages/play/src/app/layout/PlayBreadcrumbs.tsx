import * as React from 'react';
import {Box, Breadcrumbs as MaterialBreadcrumbs, SxProps, useTheme} from "@mui/material";
import PlayBreadcrumb from "@cody-play/app/layout/PlayBreadcrumb";
import {usePlayMatchingPages} from "@cody-play/hooks/use-play-matching-pages";
import {usePlayPageMatch} from "@cody-play/hooks/use-play-page-match";
import {useContext} from "react";
import {configStore} from "@cody-play/state/config-store";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface OwnProps {

}

type BreadcrumbsProps = OwnProps;

const PlayBreadcrumbs = (props: BreadcrumbsProps) => {
  const {handle: {page}} = usePlayPageMatch();
  const {config} = useContext(configStore);
  const theme = useTheme();

  const matchingPages = usePlayMatchingPages();
  const color = config.layout === 'task-based-ui' ? theme.palette.primary.main : theme.palette.primary.contrastText

  const links = matchingPages.map((matchedPage, index) => {
    return  <PlayBreadcrumb key={matchedPage.route} page={matchedPage} isLast={index === matchingPages.length - 1} color={color} />
  });

  return <Box component={"div"}
              sx={(theme) => {
                const sx: SxProps & {width?: string} ={
                [theme.breakpoints.down("md")]: {
                  display: "none"
                }};

                if(config.layout === 'task-based-ui') {
                  sx['width'] = "100%"
                }

                return sx;
              }}
              >
    <MaterialBreadcrumbs aria-label="breadcrumb" sx={{"& .MuiBreadcrumbs-separator": {color}}}>
      {links}
    </MaterialBreadcrumbs>
  </Box>
};

export default PlayBreadcrumbs;
