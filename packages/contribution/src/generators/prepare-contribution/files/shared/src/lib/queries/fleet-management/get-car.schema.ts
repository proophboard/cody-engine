export const GetCarSchema = {
  "type": "object",
  "properties": {
    "vehicleId": {
      "type": "string"
    }
  },
  "required": [
    "vehicleId"
  ],
  "additionalProperties": false
} as const;
