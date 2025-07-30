import {Instruction} from "@cody-play/app/components/core/vibe-cody/VibeCodyDrawer";
import {AccountGroupOutline} from "mdi-material-ui";
import {cloneConfig, getEditedContextFromConfig} from "@cody-play/state/config-store";
import {CodyResponseType, NodeType} from "@proophboard/cody-types";
import {JSONSchema7} from "json-schema";
import {ShorthandObject} from "@cody-play/infrastructure/vibe-cody/utils/schema/shorthand";
import {PlayValueObjectMetadataRaw} from "@cody-play/infrastructure/cody/vo/play-vo-metadata";
import {PropMapping} from "@app/shared/rule-engine/configuration";
import {
  playMakeNodeRecordWithDefaults
} from "@cody-play/infrastructure/cody/node-traversing/play-make-node-record-with-defaults";
import {onNode} from "@cody-play/infrastructure/cody/hooks/on-node";
import {playIsCodyError} from "@cody-play/infrastructure/cody/error-handling/with-error-check";

const TEXT = 'Use personas as users in the app';

export const UsePersonasAsUsers: Instruction = {
  text: TEXT,
  icon: <AccountGroupOutline />,
  noInputNeeded: true,
  isActive: context => !context.focusedElement && context.page.pathname === '/welcome',
  match: input => input.startsWith(TEXT),
  execute: async (input, ctx, dispatch, config) => {
    const userSchema: ShorthandObject = {
      userId: "string|format:uuid",
      displayName: "string",
      email: "string|format:email",
      "avatar?": "string",
      roles: {
        $items: "string"
      },
      "attributes?": {}
    }

    const usersSchema: ShorthandObject = {
      $items: "/App/User"
    }

    const userMetadata: PlayValueObjectMetadataRaw = {
      identifier: "userId",
      hasIdentifier: true,
      ns: "App",
      schema: userSchema,
      uiSchema: {
      },
      querySchema: {
        userId: "string|format:uuid"
      },
      queryDependencies: {
        "AuthService": {
          "type": "service"
        }
      },
      resolve: {
        rules: [
          {
            rule: "always",
            then: {
              call: {
                service: "AuthService",
                method: "get",
                async: true,
                arguments: "$> query.userId",
                result: {
                  variable: "information"
                }
              }
            }
          }
        ]
      },
      collection: false
    }

    const node = playMakeNodeRecordWithDefaults(
      {
        name: "User",
        type: NodeType.document,
        metadata: JSON.stringify(userMetadata),
      },
      config
    )

    const res = await onNode(node, dispatch, getEditedContextFromConfig(config), config);

    if(playIsCodyError(res)) {
      return res;
    }

    const usersMetadata: PlayValueObjectMetadataRaw = {
      identifier: "userId",
      hasIdentifier: true,
      ns: "App",
      schema: usersSchema,
      uiSchema: {
        "ui:table": {
          "columns": [
            {
              "field": "displayName",
              "headerName": "Name"
            },
            "email",
            "roles"
          ]
        }
      },
      querySchema: {
      },
      queryDependencies: {
        "AuthService": {
          "type": "service"
        }
      },
      resolve: {
        rules: [
          {
            rule: "always",
            then: {
              call: {
                service: "AuthService",
                method: "findBy",
                async: true,
                arguments: "$> {filter: {}}",
                result: {
                  variable: "information"
                }
              }
            }
          }
        ]
      },
      collection: false
    }

    const usersNode = playMakeNodeRecordWithDefaults(
      {
        name: "Users",
        type: NodeType.document,
        metadata: JSON.stringify(usersMetadata),
      },
      config
    )

    const usersRes = await onNode(usersNode, dispatch, getEditedContextFromConfig(config), config);

    if(playIsCodyError(usersRes)) {
      return usersRes;
    }

    return {
      cody: `I've added a set of functions and data types that gives you access to all registered users in the application.`,
      details: `In the prototype environment, registered users are the personas who you can manage on the welcome page.\n\nWhen converting the prototype into production software, please keep in mind that you might need to restrict access to personal user information depending on the type of software you're developing. Please review all user related application logic carefully!`,
      type: CodyResponseType.Warning
    }
  }
}
