import {JSONSchema7} from "json-schema";

export const PlayshotSchema = {
  type: "object",
  required: ['playConfig', 'playData', 'playshotId', 'boardId'],
  properties: {
    playshotId: {
      type: "string",
      format: "uuid"
    },
    boardId: {
      type: "string",
      format: "uuid"
    },
    playConfig: {
      type: "object",
      required: ['boardId'],
      properties: {
        boardId: {
          type: "string"
        }
      }
    },
    playData: {
      type: "object",
      required: ['streams', 'documents', 'sequences'],
      properties: {
        streams: {
          type: "object"
        },
        documents: {
          type: "object"
        },
        sequences: {
          type: "object"
        }
      }
    },
  }
} as JSONSchema7;
