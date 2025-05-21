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
    let line = this.parseNextLine();

    while (line.isSchemaLine) {
      if(line.type === "object") {
        const subSchemaLines = this.parseAllSubSchemaLines();
        const subSchema = (new SchemaFromNodeDescriptionParser(removeOneNestingLevel(subSchemaLines).join("\n"))).parse();
        this.schema.setObjectProperty(line.propName, subSchema);
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

    if(lineStr.trimStart().charAt(0) !== "-") {
      return INVALID_LINE;
    }

    const parts = lineStr.split(":");

    let prop = '';
    let type: string | undefined;

    prop = parts[0];

    if(parts.length === 2) {
      type = parts[1].trim().toLowerCase();
    } else if (parts.length > 2) {
      type = parts.slice(1).join(":").trim().toLowerCase();
    }

    if(type && type.startsWith('date')) {
      type = `string|format:${type}`;
    }

    const isSubSchema = prop.charAt(0) !== "-";
    const normalizedPropName = prop.trim().replace(/^-/, '').trimStart();
    const propName = names(normalizedPropName).propertyName;
    const optional = normalizedPropName.endsWith('?');
    let schemaType: JSONSchema7TypeName = propName.toLowerCase().match(/id$/) ? "string|format:uuid" as JSONSchema7TypeName : "string";

    if(typeof type === "string") {
      if(type.trim() === "") {
        schemaType = "object";
      } else if (isShorthand(type.trim())) {
        schemaType = type.trim() as JSONSchema7TypeName;
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
