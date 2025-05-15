export enum EDropzoneId {
  TABLE_TOP_ACTIONS_RIGHT = 'table-top-actions-dropzone-right',
  TABLE_BOTTOM_ACTIONS_LEFT = 'table-bottom-actions-dropzone-left',
  TABLE_BOTTOM_ACTIONS_CENTER = 'table-bottom-actions-dropzone-center',
  TABLE_BOTTOM_ACTIONS_RIGHT = 'table-bottom-actions-dropzone-right',
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
  [EDropzoneId.PAGE_TOP_ACTIONS_RIGHT]: 'top-right',
  [EDropzoneId.PAGE_BOTTOM_ACTIONS_LEFT]: 'bottom-left',
  [EDropzoneId.PAGE_BOTTOM_ACTIONS_CENTER]: 'bottom-center',
  [EDropzoneId.PAGE_BOTTOM_ACTIONS_RIGHT]: 'bottom-right',
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
  [EDropzoneId.TABLE_TOP_ACTIONS_RIGHT]: 'table-top',
  [EDropzoneId.TABLE_BOTTOM_ACTIONS_LEFT]: 'table-bottom',
  [EDropzoneId.TABLE_BOTTOM_ACTIONS_CENTER]: 'table-bottom',
  [EDropzoneId.TABLE_BOTTOM_ACTIONS_RIGHT]: 'table-bottom',
  [EDropzoneId.PAGE_TOP_ACTIONS_RIGHT]: 'page-top',
  [EDropzoneId.PAGE_BOTTOM_ACTIONS_LEFT]: 'page-bottom',
  [EDropzoneId.PAGE_BOTTOM_ACTIONS_CENTER]: 'page-bottom',
  [EDropzoneId.PAGE_BOTTOM_ACTIONS_RIGHT]: 'page-bottom',
};
