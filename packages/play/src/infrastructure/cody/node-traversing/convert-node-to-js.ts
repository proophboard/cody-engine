import {Node, RawNodeRecordProps} from "@proophboard/cody-types";

export const convertNodeToJs = (node: Node, isNested?: boolean): RawNodeRecordProps => {
  let metadata = node.getMetadata();

  return {
    id: node.getId(),
    name: node.getName(),
    description: node.getDescription(),
    type: node.getType(),
    link: node.getLink(),
    tags: node.getTags().toJS(),
    layer: node.isLayer(),
    defaultLayer: node.isDefaultLayer(),
    parent: node.getParent()? isNested ? null : convertNodeToJs(node.getParent() as Node, true) : null,
    childrenList: node.getChildren().filter(c => !isNested).map(c => convertNodeToJs(c, true)).toJSON(),
    sourcesList: node.getSources().filter(s => !isNested).map(s => convertNodeToJs(s, true)).toJSON(),
    targetsList: node.getTargets().filter(t => !isNested).map(t => convertNodeToJs(t, true)).toJSON(),
    geometry: {
      x: node.getGeometry().x,
      y: node.getGeometry().y
    },
    metadata,
  };
}
