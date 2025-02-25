import {Map} from "immutable";
import {onCommand} from "./src/lib/hooks/on-command";
import {onEvent} from "./src/lib/hooks/on-event";
import {onAggregate} from "./src/lib/hooks/on-aggregate";
import {onDocument} from "./src/lib/hooks/on-document";
import {onUi} from "./src/lib/hooks/on-ui";
import {onPolicy} from "./src/lib/hooks/on-policy";
import {onRole} from "./src/lib/hooks/on-role";
import {CodyIgnoreAwareTree} from "@cody-engine/cody/hooks/utils/fs-tree";

module.exports = {
  context: {
    /*
     * The context object is passed to each hook as second argument
     * use it to pass configuration to your hooks like a src directory, credentials, ...
     */
    // This Cody server implements the optional Sync flow and stores all synced nodes in this context property
    syncedNodes: Map({}),
    projectRoot: __dirname + '/../..',
    beSrc: 'packages/be/src',
    feSrc: 'packages/fe/src',
    sharedSrc: 'packages/shared/src/lib',
    boardId: '',
    boardName: '',
    userId: '',
    tree: () => new CodyIgnoreAwareTree(__dirname + '/../..', true),
    /**
     * Default service is used if no service is set on prooph board for a given node
     * Make sure to align this setting with frontend config, see packages/fe/src/environments/*
     */
    service: 'App',
    /**
     * You have fain-grained control of the parts that Cody generates
     */
    codeGeneration: {
      be: {
        // Cody generates command handler logic based on rules defined on prooph board
        businessLogic: true,
        // Cody generates aggregate event apply logic based on rules defined on prooph board
        eventApplyLogic: true,
        // Cody generates process and projection policy logic based on rules defined on prooph board
        policyLogic: true,
        // Cody generates query resolve logic based on rules defined on prooph board
        resolverLogic: true,
      },
      fe: {
        // Cody generates react hooks for commands and queries
        reactHooks: true,
        // Cody generates react components for command dialogs and information views
        reactComponents: true,
        // Cody generates page configs
        pages: true,
      }
    }
  },
  hooks: {
    /**
     * Uncomment and implement a hook to activate it
     */
    onAggregate,
    // onBoundedContext,
    onCommand,
    onDocument,
    onEvent,
    // onFeature: onFeatureHook,
    // onFreeText: onFreeTextHook,
    // onExternalSystem: onExternalSystemHook,
    // onIcon: onIconHook,
    // onImage: onImageHook,
    // onHotSpot: onHotSpotHook,
    // onLayer: onLayerHook,
    onPolicy: onPolicy,
    onRole: onRole,
    onUi: onUi,
  }
}
