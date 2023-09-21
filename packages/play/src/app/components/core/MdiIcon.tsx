import * as React from 'react';
import {names} from "@event-engine/messaging/helpers";
import * as icons from 'mdi-material-ui';
import {SvgIcon} from "@mui/material";
import {QuestionMark} from "@mui/icons-material";

interface OwnProps {
 icon: string;
}

type MdiIconProps = OwnProps;

const MdiIcon = (props: MdiIconProps) => {
  const normalizedName = names(props.icon).className;

  if((icons as {[name: string]: typeof SvgIcon})[normalizedName]) {
    const Icon = (icons as {[name: string]: typeof SvgIcon})[normalizedName];

    return <Icon />
  } else {
    return <QuestionMark />
  }
};

export default MdiIcon;
