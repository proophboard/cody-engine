export enum EDropzoneId {
  TABLE_TOP_ACTIONS_RIGHT = 'table-top-actions-dropzone-right',
  TABLE_BOTTOM_ACTIONS_LEFT = 'table-bottom-actions-dropzone-left',
  TABLE_BOTTOM_ACTIONS_CENTER = 'table-bottom-actions-dropzone-center',
  TABLE_BOTTOM_ACTIONS_RIGHT = 'table-bottom-actions-dropzone-right',
  VIEW_TOP_ACTIONS_RIGHT = 'view-top-actions-dropzone-right',
  VIEW_BOTTOM_ACTIONS_LEFT = 'view-bottom-actions-dropzone-left',
  VIEW_BOTTOM_ACTIONS_CENTER = 'view-bottom-actions-dropzone-center',
  VIEW_BOTTOM_ACTIONS_RIGHT = 'view-bottom-actions-dropzone-right',
  COMMAND_TOP_ACTIONS_RIGHT = 'command-top-actions-dropzone-right',
  COMMAND_BOTTOM_ACTIONS_LEFT = 'command-bottom-actions-dropzone-left',
  COMMAND_BOTTOM_ACTIONS_CENTER = 'command-bottom-actions-dropzone-center',
  COMMAND_BOTTOM_ACTIONS_RIGHT = 'command-bottom-actions-dropzone-right',
  PAGE_TOP_ACTIONS_RIGHT = 'page-top-actions-dropzone-right',
  PAGE_BOTTOM_ACTIONS_LEFT = 'page-bottom-actions-dropzone-left',
  PAGE_BOTTOM_ACTIONS_CENTER = 'page-bottom-actions-dropzone-center',
  PAGE_BOTTOM_ACTIONS_RIGHT = 'page-bottom-actions-dropzone-right',
}

export const MAP_POSITION_TO_DROPZONE_ID: Record<string, string> = {
  [EDropzoneId.TABLE_TOP_ACTIONS_RIGHT]: 'top-right',
  [EDropzoneId.TABLE_BOTTOM_ACTIONS_LEFT]: 'bottom-left',
  [EDropzoneId.TABLE_BOTTOM_ACTIONS_CENTER]: 'bottom-center',
  [EDropzoneId.TABLE_BOTTOM_ACTIONS_RIGHT]: 'bottom-right',
  [EDropzoneId.VIEW_TOP_ACTIONS_RIGHT]: 'top-right',
  [EDropzoneId.VIEW_BOTTOM_ACTIONS_LEFT]: 'bottom-left',
  [EDropzoneId.VIEW_BOTTOM_ACTIONS_CENTER]: 'bottom-center',
  [EDropzoneId.VIEW_BOTTOM_ACTIONS_RIGHT]: 'bottom-right',
  [EDropzoneId.COMMAND_TOP_ACTIONS_RIGHT]: 'top-right',
  [EDropzoneId.COMMAND_BOTTOM_ACTIONS_LEFT]: 'bottom-left',
  [EDropzoneId.COMMAND_BOTTOM_ACTIONS_CENTER]: 'bottom-center',
  [EDropzoneId.COMMAND_BOTTOM_ACTIONS_RIGHT]: 'bottom-right',
  [EDropzoneId.PAGE_TOP_ACTIONS_RIGHT]: 'top-right',
  [EDropzoneId.PAGE_BOTTOM_ACTIONS_LEFT]: 'bottom-left',
  [EDropzoneId.PAGE_BOTTOM_ACTIONS_CENTER]: 'bottom-center',
  [EDropzoneId.PAGE_BOTTOM_ACTIONS_RIGHT]: 'bottom-right',
};

export type TDropzonePosition =
  | 'view-top'
  | 'view-bottom'
  | 'command-top'
  | 'command-bottom'
  | 'page-top'
  | 'page-bottom';

export const MAP_DROPZONE_POSITION_TO_DROPZONE_ID: Record<
  string,
  TDropzonePosition
> = {
  [EDropzoneId.TABLE_TOP_ACTIONS_RIGHT]: 'view-top',
  [EDropzoneId.TABLE_BOTTOM_ACTIONS_LEFT]: 'view-bottom',
  [EDropzoneId.TABLE_BOTTOM_ACTIONS_CENTER]: 'view-bottom',
  [EDropzoneId.TABLE_BOTTOM_ACTIONS_RIGHT]: 'view-bottom',
  [EDropzoneId.VIEW_TOP_ACTIONS_RIGHT]: 'view-top',
  [EDropzoneId.VIEW_BOTTOM_ACTIONS_LEFT]: 'view-bottom',
  [EDropzoneId.VIEW_BOTTOM_ACTIONS_CENTER]: 'view-bottom',
  [EDropzoneId.VIEW_BOTTOM_ACTIONS_RIGHT]: 'view-bottom',
  [EDropzoneId.COMMAND_TOP_ACTIONS_RIGHT]: 'command-top',
  [EDropzoneId.COMMAND_BOTTOM_ACTIONS_LEFT]: 'command-bottom',
  [EDropzoneId.COMMAND_BOTTOM_ACTIONS_CENTER]: 'command-bottom',
  [EDropzoneId.COMMAND_BOTTOM_ACTIONS_RIGHT]: 'command-bottom',
  [EDropzoneId.PAGE_TOP_ACTIONS_RIGHT]: 'page-top',
  [EDropzoneId.PAGE_BOTTOM_ACTIONS_LEFT]: 'page-bottom',
  [EDropzoneId.PAGE_BOTTOM_ACTIONS_CENTER]: 'page-bottom',
  [EDropzoneId.PAGE_BOTTOM_ACTIONS_RIGHT]: 'page-bottom',
};
