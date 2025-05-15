export enum EDropzoneId {
  TABLE_BOTTOM_ACTIONS_LEFT = 'table-bottom-actions-dropzone-left',
  TABLE_BOTTOM_ACTIONS_CENTER = 'table-bottom-actions-dropzone-center',
  TABLE_BOTTOM_ACTIONS_RIGHT = 'table-bottom-actions-dropzone-right',
  TABLE_TOP_ACTIONS_RIGHT = 'table-top-actions-dropzone-right',
  PAGE_TOP_ACTIONS_RIGHT = 'page-top-actions-dropzone-right',
}

export const MAP_POSITION_TO_DROPZONE_ID: Record<string, string> = {
  [EDropzoneId.TABLE_BOTTOM_ACTIONS_LEFT]: 'bottom-left',
  [EDropzoneId.TABLE_BOTTOM_ACTIONS_CENTER]: 'bottom-center',
  [EDropzoneId.TABLE_BOTTOM_ACTIONS_RIGHT]: 'bottom-right',
  [EDropzoneId.TABLE_TOP_ACTIONS_RIGHT]: 'top-right',
  [EDropzoneId.PAGE_TOP_ACTIONS_RIGHT]: 'top-right',
};

export type TDropzonePosition =
  | 'table-top'
  | 'table-bottom'
  | 'page-top'
  | 'page-bottom';

export const MAP_DROPZONE_POSITION_TO_DROPZONE_ID: Record<
  string,
  TDropzonePosition
> = {
  [EDropzoneId.TABLE_BOTTOM_ACTIONS_LEFT]: 'table-bottom',
  [EDropzoneId.TABLE_BOTTOM_ACTIONS_CENTER]: 'table-bottom',
  [EDropzoneId.TABLE_BOTTOM_ACTIONS_RIGHT]: 'table-bottom',
  [EDropzoneId.TABLE_TOP_ACTIONS_RIGHT]: 'table-top',
  [EDropzoneId.PAGE_TOP_ACTIONS_RIGHT]: 'page-top',
};
