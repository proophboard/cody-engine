import * as React from 'react';
import {TableActionConfig} from "@frontend/app/components/core/form/types/action";
import {IconButton, Popover} from "@mui/material";
import {GridMoreVertIcon} from "@mui/x-data-grid";
import ColumnAction from "@frontend/app/components/core/table/ColumnAction";

interface OwnProps {
  actions: TableActionConfig[];
  row: {[prop: string]: any};
  defaultService: string;
}

type ColumnActionsMenuProps = OwnProps;

const ColumnActionsMenu = (props: ColumnActionsMenuProps) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return <div>
    <IconButton
      aria-label="more"
      id="long-button"
      aria-controls={open ? 'long-menu' : undefined}
      aria-expanded={open ? 'true' : undefined}
      aria-haspopup="true"
      onClick={handleClick}
    >
      <GridMoreVertIcon />
    </IconButton>
    <Popover open={open}
             anchorEl={anchorEl}
             onClose={handleClose}
             anchorOrigin={{
               vertical: "bottom",
               horizontal: "right"
             }}
    >
      <div>
        {props.actions.map((action, index) => {
          const buttonStyle = action.button.style || {};
          action = {...action, button: {...action.button, variant: 'text', style: {...buttonStyle, width: '100%', display: 'block'}}}
          return <ColumnAction key={`column-action-menu-${index}`} action={action} row={props.row} defaultService={props.defaultService} onDialogClose={handleClose} />
        })}
      </div>
    </Popover>
  </div>
};

export default ColumnActionsMenu;
