import {JSONSchema7TypeName} from "json-schema";
import {Schema} from "./schema";
import {isShorthand} from "./shorthand";
import {names} from "@event-engine/messaging/helpers";

const removeOneNestingLevel = (lines: string[]): string[] => {
  const modifiedLines: string[] = [];

  lines.forEach(line => {
    if(line.charAt(0) !== "-") {
      line = line.slice(1);
    }

    if(line.charAt(0) !== "-") {
      line = line.slice(1);
    }

    modifiedLines.push(line);
  })

  return modifiedLines;
}

interface Line {
  isSchemaLine: boolean;
  isSubSchema: boolean;
  type: JSONSchema7TypeName;
  propName: string;
  optional: boolean;
  raw: string;
}

const INVALID_LINE: Line = {
  isSchemaLine: false,
  isSubSchema: false,
  type: "null",
  propName: '',
  optional: false,
  raw: ''
};

export class SchemaFromNodeDescriptionParser {
  private lines: string[];
  private currentLine = 0;
  private schema: Schema;

  constructor(desc: string) {
    this.lines = desc.split("\n");
    this.schema = new Schema({});
  }

  public parse(): Schema {
    debugger;
    let line = this.parseNextLine();

    while (line.isSchemaLine) {
      if(line.type === "object") {
        const subSchemaLines = this.parseAllSubSchemaLines();
        const subSchema = (new SchemaFromNodeDescriptionParser(removeOneNestingLevel(subSchemaLines).join("\n"))).parse();

        if(line.propName === "$items") {
          this.schema = new Schema({
            $items: subSchema.toShorthand()
          })
        } else {
          this.schema.setObjectProperty(line.propName, subSchema);
        }
      } else {
        this.schema.setObjectProperty(line.propName, new Schema(line.type), !line.optional);
      }

      line = this.parseNextLine();
    }

    return this.schema;
  }

  private parseAllSubSchemaLines(): string[] {
    let currentLine = this.currentLine;

    let line = this.parseNextLine();

    const subSchemaLines: string[] = [];

    while (line.isSubSchema) {
      subSchemaLines.push(line.raw);

      currentLine = this.currentLine;
      line = this.parseNextLine();
    }

    // Jump one position back
    this.currentLine = currentLine;

    return subSchemaLines;
  }

  private parseNextLine(): Line {
    const lineStr = this.getNextLine();

    if(!lineStr) {
      return INVALID_LINE;
    }

    const parts = lineStr.split(":");

    let prop = '';
    let type: string | undefined;
    let normalizedType: string | undefined;

    prop = parts[0];

    if(parts.length === 2) {
      type = parts[1].trim();
      normalizedType = type.toLowerCase();
    } else if (parts.length > 2) {
      type = parts.slice(1).join(":").trim();
      normalizedType = type.split(":").map((p,i) => i === 0 ? p.toLowerCase() : p).join(":");
    }

    if(normalizedType && normalizedType.startsWith('date')) {
      normalizedType = `string|format:${type}`;
    }

    if(normalizedType && normalizedType.startsWith('time')) {
      normalizedType = `string|format:${type}`;
    }

    const isSubSchema = prop.startsWith('  ');
    const normalizedPropName = prop.trim().replace(/^-/, '').trimStart();
    const propName = normalizedPropName === "$items" ? normalizedPropName : names(normalizedPropName).propertyName;
    const optional = normalizedPropName.endsWith('?');
    let schemaType: JSONSchema7TypeName = "string";

    if(typeof type === "string") {
      if(type.trim() === "") {
        schemaType = "object";
      } else if (normalizedType && isShorthand(normalizedType.trim())) {
        schemaType = normalizedType.trim() as JSONSchema7TypeName;
      } else if (type.includes(",") && !type.trim().startsWith('enum:')) {
        // that might be an enum list
        schemaType = `enum:${type.split(',').map(i => i.trim()).join(',')}` as JSONSchema7TypeName;
      } else {
        // Enforce a ref schema with default ns
        schemaType = `/App/${names(type).className}` as JSONSchema7TypeName;
      }
    }

    return {
      isSchemaLine: true,
      isSubSchema,
      propName,
      type: schemaType,
      optional,
      raw: lineStr,
    }
  }

  private getNextLine(): string | undefined {
    const line = this.lines[this.currentLine];
    this.currentLine++;
    return line;
  }
}
