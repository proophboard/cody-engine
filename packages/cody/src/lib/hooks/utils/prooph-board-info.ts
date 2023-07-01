import {ProophBoardDescription} from "@event-engine/descriptions/descriptions";
import {CodyResponse, CodyResponseType, Node, NodeType} from "@proophboard/cody-types";
import {Context} from "../context";
import {FsTree} from "nx/src/generators/tree";
import {names} from "@event-engine/messaging/helpers";
import {getSingleSource, isCodyError, nodeNameToPascalCase} from "@proophboard/cody-utils";
import {detectService} from "./detect-service";
import {getVoMetadata} from "./value-object/get-vo-metadata";
import {now} from "./time";
import {isNewFile, requireUncached} from "./fs-tree";
import {namespaceToFilePath} from "./value-object/namespace";

export const loadDescription = <D extends ProophBoardDescription>(node: Node, ctx: Context, tree: FsTree): D | CodyResponse => {
  const {sharedSrc, feSrc, beSrc} = ctx;

  const service = detectService(node, ctx);
  if(isCodyError(service)) {
    return service;
  }

  const serviceFilename = names(service).fileName;
  let nodeTypeFilename: string;
  let ns = '/';
  let descFile = names(nodeNameToPascalCase(node)).fileName + '.desc.ts';
  let src = sharedSrc;
  let importNs = '@app/shared';

  switch (node.getType()) {
    case NodeType.aggregate:
      nodeTypeFilename = 'aggregates';
      break;
    case NodeType.command:
      nodeTypeFilename = 'commands';
      break;
    case NodeType.event:
      const evtAggregate = getSingleSource(node, NodeType.aggregate);
      if(isCodyError(evtAggregate)) {
        return evtAggregate;
      }

      nodeTypeFilename = 'events';
      ns = `/${names(evtAggregate.getName()).fileName}/`;
      break;
    case NodeType.document:
      const voMeta = getVoMetadata(node, ctx);
      if(isCodyError(voMeta)) {
        return voMeta;
      }

      ns = namespaceToFilePath(voMeta.ns);
      nodeTypeFilename = 'types';
      break;
    case NodeType.ui:
      nodeTypeFilename = 'app/pages';
      descFile = names(nodeNameToPascalCase(node)).fileName + '.ts';
      src = feSrc;
      importNs = '@frontend';
      break;
    case NodeType.policy:
      nodeTypeFilename = 'policies';
      src = beSrc;
      importNs = '@server';
      break;
    default:
      return {
        cody: `I cannot update prooph board info for card type: "${node.getType()}".`,
        type: CodyResponseType.Error,
        details: "Please contact the prooph board team to let them fix the error!"
      }
  }

  const fullPath = `${nodeTypeFilename}/${serviceFilename}${ns}${descFile}`;

  if(!isNewFile(`${src}/${fullPath}`, tree)) {
    const desc = requireUncached(`${importNs}/${fullPath.slice(0,-3)}`);

    for (const descKey in desc) {
      if(desc.hasOwnProperty(descKey)) {
        const pbDesc = desc[descKey];

        if(pbDesc.hasOwnProperty('_pbBoardId')) {
          return pbDesc;
        }
      }
    }

    return {
      cody: `I was not able to load prooph board description file: ${fullPath}.`,
      type: CodyResponseType.Error,
      details: 'The file seems to exist, but it does not export a description with _pb* info included. Usually such a file is added and updated automatically by me. Did it get deleted somehow?'
    }
  }

  return {
    cody: `I was not able to load prooph board description file: ${sharedSrc}/${fullPath}.`,
    type: CodyResponseType.Error,
    details: 'The file does not exist'
  }
}

export const updateProophBoardInfo = (node: Node, ctx: Context, tree: FsTree): ProophBoardDescription | CodyResponse => {

  let pbDesc = loadDescription(node, ctx, tree);

  if(!isCodyError(pbDesc)) {
    pbDesc._pbBoardId = ctx.boardId;
    pbDesc._pbCardId = node.getId();
    pbDesc._pbVersion += 1;
    pbDesc._pbLink = node.getLink();
    pbDesc._pbLastUpdatedBy = ctx.userId;
    pbDesc._pbLastUpdatedAt = now();

    return pbDesc;
  }

  return {
    _pbBoardId: ctx.boardId,
    _pbCardId: node.getId(),
    _pbLink: node.getLink(),
    _pbVersion: 1,
    _pbCreatedAt: now(),
    _pbCreatedBy: ctx.userId,
    _pbLastUpdatedAt: now(),
    _pbLastUpdatedBy: ctx.userId,
  }
}
