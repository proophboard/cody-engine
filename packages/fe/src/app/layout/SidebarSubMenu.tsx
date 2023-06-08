import * as React from 'react';
import {useEffect, useState} from "react";
import {usePageMatch} from "@frontend/util/hook/use-page-match";
import {
  listenOnSideBarAnchorsRendered,
  stopListeningOnSideBarAnchorsRendered
} from "@frontend/util/sidebar/trigger-sidebar-anchors-rendered";
import {Button, List, ListItem, SxProps, useTheme} from "@mui/material";
import SubMenuItem from "@frontend/app/layout/SubMenuItem";
import {NavLink} from "react-router-dom";
import {useMatchingPages} from "@frontend/util/hook/use-matching-pages";

interface OwnProps {
}

type SidebarSubMenuProps = OwnProps;

const HEADER_OFFSET = 128;

interface Anchor {
  label: string;
  hash: string;
  active: boolean;
  htmlEl: Element
}

const isScrolledToBottom = () => {
  return document.body.scrollHeight ==
    document.documentElement.scrollTop +
    window.innerHeight;
}

const detectActiveAnchor = (anchors: Anchor[]): Anchor | null => {
  if(anchors.length === 0) {
    return null;
  }

  let lastAnchor: Anchor = anchors[0];

  anchors.forEach(anchor => {
    if(anchor.htmlEl.getBoundingClientRect().top <= HEADER_OFFSET + 10) {
      lastAnchor = anchor;
    }
  })
  // Page is scrollable and bottom is reached. Let's highlight the anchor that's closest to the top, but fully visible
  if(anchors.indexOf(lastAnchor) < anchors.length - 1 && document.documentElement.scrollTop > 0 && isScrolledToBottom()) {
    [...anchors].reverse().forEach(anchor => {
      if(anchor.htmlEl.getBoundingClientRect().top > HEADER_OFFSET + 10) {
        lastAnchor = anchor;
      }
    });
  }

  return lastAnchor;
}

const scrollToElement = (ele: Element) => {
  const elementPosition = ele.getBoundingClientRect().top + window.scrollY;
  const offsetPosition = elementPosition - HEADER_OFFSET;

  window.scrollTo({
    top: offsetPosition,
    behavior: "smooth"
  });
}

let scrollListenerRef: unknown;

const SidebarSubMenu = (props: SidebarSubMenuProps) => {
  const {handle: {page}, params, pathname} = usePageMatch();
  const theme = useTheme();

  const [anchors, setAnchors] = useState<Anchor[]>([]);
  const matchingPages = useMatchingPages();

  useEffect(() => {

    setAnchors([]);

    const scrollListener = (anchors: Anchor[]) => {
      const newActiveAnchor = detectActiveAnchor(anchors);

      let currentlyActiveAnchor: Anchor|undefined = undefined;

      anchors.forEach(anchor => {
        if(anchor.active) {
          currentlyActiveAnchor = anchor;
        }

        anchor.active = false
      });

      if(newActiveAnchor) {
        newActiveAnchor.active = true;
      }

      if(newActiveAnchor !== currentlyActiveAnchor) {
        setAnchors([...anchors]);
      }
    }

    const anchorsRenderedListener = () => {
      const cachedHtmlAnchors = document.getElementsByClassName('sidebar-anchor');
      const tempAnchors: Anchor[] = [];

      for(let i = 0; i < cachedHtmlAnchors.length; i++) {
        const htmlAnchor = cachedHtmlAnchors.item(i);

        if(htmlAnchor) {
          tempAnchors.push({
            label: htmlAnchor.innerHTML,
            hash: '#' + htmlAnchor.id,
            active: false,
            htmlEl: htmlAnchor
          })
        }
      }
      setAnchors(tempAnchors);

      document.removeEventListener('scroll', scrollListenerRef as () => void);

      scrollListenerRef = () => {
        scrollListener(tempAnchors);
      }


      document.addEventListener('scroll', scrollListenerRef as () => void);

      scrollListener(tempAnchors);
    }

    stopListeningOnSideBarAnchorsRendered(anchorsRenderedListener);
    listenOnSideBarAnchorsRendered(anchorsRenderedListener);
    anchorsRenderedListener();

    return () => {
      if(scrollListenerRef) {
        document.removeEventListener('scroll', scrollListenerRef as () => void);
      }

      stopListeningOnSideBarAnchorsRendered(anchorsRenderedListener);
    }
  }, [page, params]);

  const renderNextLevel = (nextLevel: number) => {
    if (nextLevel < matchingPages.length) {
      const nextPage = matchingPages[nextLevel];

      return <List disablePadding={true} key={`sidebar-next-level-${nextPage.route}`} sx={{
        width: "100%",
        flex: 1,
        paddingLeft: theme => theme.spacing(1)
      }}>
        <SubMenuItem key={`sub-menu-item-${nextPage.route}`} page={nextPage}/>
        {renderNextLevel(nextLevel + 1)}
      </List>
    }

    if (!anchors.length) {
      return <></>
    }

    return <List sx={{
      width: "100%",
      flex: 1,
      paddingLeft: theme => theme.spacing(1)
    }}>{anchors.map(anchor => {
      const anchorStyle: SxProps = {
        display: 'flex',
        paddingTop: 0,
        paddingBottom: 0,
        paddingLeft: theme.spacing(1),
        marginLeft: theme.spacing(2),
        width: 'calc(100% - '+theme.spacing(2)+'px)',
        borderLeft: '2px solid ' + (anchor.active? theme.palette.primary.main :  theme.palette.grey.A100),
      }

      return <ListItem id={anchor.hash} key={anchor.hash} sx={anchorStyle} >
        <Button sx={{
            color: anchor.active? theme.palette.primary.main : 'currentColor',
            padding: '10px 8px',
            justifyContent: 'flex-start',
            textTransform: 'none',
            letterSpacing: 0,
            width: '100%',
            fontWeight: theme.typography.fontWeightMedium
          }}
          component={NavLink}
          to={anchor.hash}
          children={anchor.label}
          onClick={() => {
            scrollToElement(anchor.htmlEl)
          }}
        />
      </ListItem>
    })}</List>
  }

  if(!matchingPages.length && !anchors.length) {
    return <></>
  }

  return renderNextLevel(1);
};

export default SidebarSubMenu;
