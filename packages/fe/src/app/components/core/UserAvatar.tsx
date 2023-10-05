import * as React from 'react';
import {User} from "@app/shared/types/core/user/user";
import {Avatar, Badge, SxProps} from "@mui/material";
import {useState} from "react";

interface OwnProps {
  user: User;
  variant?: 'circular' | 'rounded' | 'square';
  sx?: SxProps
  badgeOverlap?: 'circular' | 'rectangular';
  showBadge?: boolean;
  color?: string;
}

type UserAvatarProps = OwnProps;

const randomColor = (): string => Math.floor(Math.random()*16777215).toString(16);

const userColors: {[userId: string]: string} = {};

export const clearAvatarColorCache = (userId: string) => {
  if(userColors[userId]) {
    delete userColors[userId];
  }
}

const UserAvatar = (props: UserAvatarProps) => {

  if(!userColors[props.user.userId]) {
    userColors[props.user.userId] = props.color || '#'+randomColor();
  }

  return <Badge color="primary" badgeContent=" " overlap={props.badgeOverlap} invisible={!props.showBadge} anchorOrigin={{vertical: 'bottom', horizontal: 'right'}}>
    <Avatar variant={props.variant}
            sx={{bgcolor: (props.user.avatar ? 'none' : userColors[props.user.userId]), ...props.sx}}
            src={props.user.avatar}
            alt={props.user.displayName}
    >{props.user.displayName.slice(0, 1)}</Avatar>
  </Badge>
};

export default UserAvatar;
