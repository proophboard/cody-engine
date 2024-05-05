import * as React from 'react';
import {useLocation} from "react-router-dom";
import {useEffect} from "react";

interface OwnProps {

}

type ScrollToTopProps = OwnProps;

const ScrollToTop = (props: ScrollToTopProps) => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

export default ScrollToTop;
