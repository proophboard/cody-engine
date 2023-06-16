export const CarAddedToFleetSchema = {
  "type": "object",
  "properties": {
    "vehicleId": {
      "type": "string"
    }
  },
  "required": [
    "vehicleId"
  ],
  "additionalProperties": false,
  "$id": "/definitions/fleet-management/car/car-added-to-fleet"
} as const;
