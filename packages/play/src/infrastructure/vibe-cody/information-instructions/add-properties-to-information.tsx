import {Instruction} from "@cody-play/app/components/core/vibe-cody/VibeCodyDrawer";
import {CodeJson} from "mdi-material-ui";
import {FocusedElement} from "@cody-play/state/focused-element";
import {withNavigateToProcessing} from "@cody-play/infrastructure/vibe-cody/utils/navigate/with-navigate-to-processing";
import {CodyResponse, CodyResponseType} from "@proophboard/cody-types";
import {Schema} from "@cody-play/infrastructure/vibe-cody/utils/schema/schema";
import {cloneDeepJSON} from "@frontend/util/clone-deep-json";
import {JSONSchema7} from "json-schema";
import {
  playDefinitionIdFromFQCN,
  playServiceFromFQCN
} from "@cody-play/infrastructure/cody/schema/play-definition-id";
import {names} from "@event-engine/messaging/helpers";
import {namespaceNames, valueObjectNamespaceFromFQCN} from "@cody-engine/cody/hooks/utils/value-object/namespace";
import {isMultilineText} from "@cody-play/infrastructure/vibe-cody/utils/text/is-multiline-text";
import {
  getSchemaFromNodeDescription
} from "@cody-play/infrastructure/vibe-cody/utils/schema/get-schema-from-node-description";
import {camelCaseToTitle} from "@cody-play/infrastructure/utils/string";
import {CodyResponseException} from "@cody-play/infrastructure/cody/error-handling/with-error-check";
import {getEditedContextFromConfig} from "@cody-play/state/config-store";
import {withId} from "@cody-play/infrastructure/vibe-cody/utils/json-schema/with-id";
import {resetRjsfValidator} from "@frontend/util/rjsf-validator";
import {normalizePropSchema} from "@cody-play/infrastructure/vibe-cody/information-instructions/add-columns-to-table";

const TEXT = 'Add the following properties to the information: ';

const isActive = (focused?: FocusedElement): boolean => {
  if(!focused) {
    return false;
  }

  return focused.type === "stateView" || focused.type === "formView";
}

export const AddPropertiesToInformation: Instruction = {
  text: TEXT,
  icon: <CodeJson />,
  isActive: (context, config) => !context.selectedInstruction && isActive(context.focusedElement),
  match: input => input.startsWith(TEXT),
  allowSubSuggestions: true,
  execute: withNavigateToProcessing(async (input, ctx, dispatch, config): Promise<CodyResponse> => {
    const information = config.types[ctx.focusedElement!.id];

    const voSchema = new Schema(cloneDeepJSON(information.schema) as JSONSchema7, true);
    let uiSchema = cloneDeepJSON(information.uiSchema || {});

    const serviceNames = names(playServiceFromFQCN(information.desc.name));
    const ns = namespaceNames(valueObjectNamespaceFromFQCN(information.desc.name));

    if(isMultilineText(input)) {
      try {
        const schema = getSchemaFromNodeDescription(
          input.replace(TEXT, '')
            .split(`\n`)
            .filter(line => line.trim() !== '')
            .join(`\n`)
        );


        schema.getObjectProperties().forEach(prop => {
          if(!voSchema.getObjectPropertySchema(prop)) {
            const propSchema = schema.getObjectPropertySchema(prop, new Schema({type: "string", title: camelCaseToTitle(prop)}));
            normalizePropSchema(prop, propSchema, schema.isRequired(prop), information.desc.name, voSchema, uiSchema, config, serviceNames, ns);
          }
        })
      } catch (e) {
        if (e instanceof CodyResponseException) {
          return e.codyResponse;
        } else {
          console.error(e);
          return {
            cody: `Failed to parse the data structure`,
            details: (e as any).toString()
          }
        }
      }
    } else {
      const propertyNames = input.replace(TEXT, '')
        .replaceAll(` and `, ',')
        .replaceAll(';', ',')
        .replaceAll(`- `, '')
        .split(",")
        .map(c => names(c.trim()));

      propertyNames.forEach(p => {
        if(!voSchema.getObjectPropertySchema(p.propertyName)) {
          voSchema.setObjectProperty(p.propertyName, new Schema(`string|title:${camelCaseToTitle(p.propertyName)}`));
        }
      })
    }

    const editedCtx = getEditedContextFromConfig(config);

    // Update Table VO
    dispatch({
      ctx: editedCtx,
      type: "ADD_TYPE",
      name: information.desc.name,
      information: {
        desc: information.desc,
        schema: withId(voSchema.toJsonSchema(`/${serviceNames.fileName}/${ns.fileName}`), information.desc.name),
        uiSchema,
        factory: information.factory,
      },
      definition: {
        definitionId: playDefinitionIdFromFQCN(information.desc.name),
        schema: withId(voSchema.toJsonSchema(`/${serviceNames.fileName}/${ns.fileName}`), information.desc.name),
      }
    });

    // Reset resolved refs cache to avoid validation failures due to changed schema
    resetRjsfValidator();

    return {
      cody: `Alright, I've added the properties.`
    }
  })
}
