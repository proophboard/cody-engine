import {DeepReadonly} from "json-schema-to-ts/lib/types/type-utils/readonly";
import {FromSchema} from "json-schema-to-ts";
import {makeValueObject, ValueObjectRuntimeInfo} from "@event-engine/messaging/value-object";
import {Writable} from "json-schema-to-ts/lib/types/type-utils";
import definitions from "@app/shared/types/definitions";
import {references} from "@app/shared/types/references";
import {CarListSchema} from "./car-list.schema";
import {CarListDesc} from "./car-list.desc";

export type CarList = DeepReadonly<FromSchema<
  typeof CarListSchema,
  {references: references}
>>;

export const carList = makeValueObject<CarList>(
  CarListDesc.name,
  CarListSchema as Writable<typeof CarListSchema>,
  definitions,
  (data: any): CarList => {
    const ctx: any = {};
    ctx['data'] = data;



    return ctx['data'] as CarList;
  }
);

export const FleetManagementCarCarListVORuntimeInfo: ValueObjectRuntimeInfo = {
  desc: CarListDesc,
  factory: carList,
  schema: CarListSchema,
}
