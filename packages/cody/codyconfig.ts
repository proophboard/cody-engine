import {Map} from "immutable";
import {onCommand} from "./src/lib/hooks/on-command";
import {onEvent} from "./src/lib/hooks/on-event";
import {onAggregate} from "./src/lib/hooks/on-aggregate";
import {onDocument} from "./src/lib/hooks/on-document";
import {onUi} from "./src/lib/hooks/on-ui";
import {onPolicy} from "./src/lib/hooks/on-policy";
import {onRole} from "./src/lib/hooks/on-role";
import {FsTree} from "nx/src/generators/tree";

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
    tree: new FsTree(__dirname + '/../..', true)
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
