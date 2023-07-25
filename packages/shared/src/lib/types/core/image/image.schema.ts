export const ImageSchema = {
  type: "object",
  properties: {
    src: {
      type: "string",
      format: "uri"
    },
    alt: {
      type: "string"
    },
    mimeType: {
      type: "string"
    }
  },
  required: ["src", "alt", "mimeType"],
  additionalProperties: false,
  $id: "/definitions/core/image/image",
  title: "Image"
} as const;
