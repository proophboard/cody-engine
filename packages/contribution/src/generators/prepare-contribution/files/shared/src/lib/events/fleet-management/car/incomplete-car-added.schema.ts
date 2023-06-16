export const IncompleteCarAddedSchema = {
  "type": "object",
  "properties": {
    "vehicleId": {
      "type": "string"
    },
    "brand": {
      "type": "string"
    },
    "model": {
      "type": "string"
    },
    "productionYear": {
      "type": "integer",
      "minimum": 1900
    }
  },
  "required": [
    "vehicleId",
    "brand",
    "model"
  ],
  "additionalProperties": false,
  "$id": "/definitions/fleet-management/car/incomplete-car-added"
} as const;
