export const ImageListSchema = {
  type: "array",
  items: {
    $ref: "/definitions/core/image/image"
  },
  $id: "/definitions/core/image/image-list",
  title: "Images"
} as const;
