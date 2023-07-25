import {DeepReadonly} from "json-schema-to-ts/lib/types/type-utils/readonly";
import {FromSchema} from "json-schema-to-ts";
import {ImageSchema} from "@app/shared/types/core/image/image.schema";
import { references } from '@app/shared/types/references';
import {makeValueObject, ValueObjectRuntimeInfo} from "@event-engine/messaging/value-object";
import {ImageDesc} from "@app/shared/types/core/image/image.desc";
import {Writable} from "json-schema-to-ts/lib/types/type-utils";
import definitions from "@app/shared/types/definitions";
import {ImageUiSchema} from "@app/shared/types/core/image/image.ui-schema";

export type Image = DeepReadonly<
  FromSchema<typeof ImageSchema, { references: references }>
>;

export const image = makeValueObject<Image>(
  ImageDesc.name,
  ImageSchema as Writable<typeof ImageSchema>,
  definitions,
  (data: any) => {
    return data as Image;
  }
)

export const CoreImageImageVORuntimeInfo: ValueObjectRuntimeInfo = {
  desc: ImageDesc,
  factory: image,
  schema: ImageSchema,
  uiSchema: ImageUiSchema,
}
