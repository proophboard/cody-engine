import {DeepReadonly} from "json-schema-to-ts/lib/types/type-utils/readonly";
import {FromSchema} from "json-schema-to-ts";
import {makeValueObject, ValueObjectRuntimeInfo} from "@event-engine/messaging/value-object";
import {Writable} from "json-schema-to-ts/lib/types/type-utils";
import definitions from "@app/shared/types/definitions";
import { references } from '@app/shared/types/references';
import {ImageListSchema} from "@app/shared/types/core/image/image-list.schema";
import {ImageListDesc} from "@app/shared/types/core/image/image-list.desc";
import {ImageListUiSchema} from "@app/shared/types/core/image/image-list.ui-schema";

export type ImageList = DeepReadonly<
  FromSchema<typeof ImageListSchema, { references: references }>
  >;

export const imageList = makeValueObject<ImageList>(
  ImageListDesc.name,
  ImageListSchema as Writable<typeof ImageListSchema>,
  definitions,
  (data: any) => {
    return data as ImageList;
  }
)

export const CoreImageImageListVORuntimeInfo: ValueObjectRuntimeInfo = {
  desc: ImageListDesc,
  factory: imageList,
  schema: ImageListSchema,
  uiSchema: ImageListUiSchema,
}
