import {Schema} from "./schema";
import {SchemaFromNodeDescriptionParser} from "./schema-from-node-description-parser";

export const getSchemaFromNodeDescription = (desc: string): Schema => {

  if(desc === '') {
    return new Schema({});
  }

  const parser = new SchemaFromNodeDescriptionParser(desc);

  return parser.parse();
}
