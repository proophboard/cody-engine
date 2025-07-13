import {Instruction, InstructionProvider} from "@cody-play/app/components/core/vibe-cody/VibeCodyDrawer";
import {AddAPageWithName} from "@cody-play/infrastructure/vibe-cody/page-instructions/add-a-page-with-name";
import {
  AddATableWithDefaults
} from "@cody-play/infrastructure/vibe-cody/information-instructions/add-a-table-with-defaults";
import {AddColumnsToTable} from "@cody-play/infrastructure/vibe-cody/information-instructions/add-columns-to-table";
import {
  AddTableItemProvider
} from "@cody-play/infrastructure/vibe-cody/command-instructions/add-table-item";
import {ChangeButtonLabel} from "@cody-play/infrastructure/vibe-cody/button-instructions/change-button-label";
import {
  ChangeButtonVariantProvider
} from "@cody-play/infrastructure/vibe-cody/button-instructions/change-button-variant";
import {FocusOnButtonProvider} from "@cody-play/infrastructure/vibe-cody/button-instructions/focus-on-button";
import {ChangeButtonColorProvider} from "@cody-play/infrastructure/vibe-cody/button-instructions/change-button-color";
import {ChangeButtonIconProvider} from "@cody-play/infrastructure/vibe-cody/button-instructions/change-button-icon";
import {IconOnlyButton} from "@cody-play/infrastructure/vibe-cody/button-instructions/icon-only-button";
import {ChangeThemeProvider} from "@cody-play/infrastructure/vibe-cody/theme-instructions/change-theme";
import {
  RenameTableRowDataTypeProvider
} from "@cody-play/infrastructure/vibe-cody/information-instructions/rename-table-row-data-type";
import {BatchDeleteRows} from "@cody-play/infrastructure/vibe-cody/command-instructions/batch-delete-rows";
import {EditTableItem} from "@cody-play/infrastructure/vibe-cody/command-instructions/edit-table-item";
import {
  ChangeSidebarItemLabel
} from "@cody-play/infrastructure/vibe-cody/sidebar-instructions/change-sidebar-item-label";
import {
  ChangeSidebarItemIconProvider
} from "@cody-play/infrastructure/vibe-cody/sidebar-instructions/change-sidebar-item-icon";
import {MoveSidebarItemProvider} from "@cody-play/infrastructure/vibe-cody/sidebar-instructions/move-sidebar-item";
import {
  MoveSidebarItemIntoNewGroup
} from "@cody-play/infrastructure/vibe-cody/sidebar-instructions/move-sidebar-item-into-new-group";
import {
  MoveSidebarItemOutOfGroup
} from "@cody-play/infrastructure/vibe-cody/sidebar-instructions/move-sidebar-item-out-of-group";
import {
  MoveSidebarItemIntoExistingGroupProvider
} from "@cody-play/infrastructure/vibe-cody/sidebar-instructions/move-sidebar-item-into-existing-group";
import {
  ChangeSidebarGroupIconProvider
} from "@cody-play/infrastructure/vibe-cody/sidebar-instructions/change-sidebar-group-icon";
import {
  ChangeSidebarGroupLabel
} from "@cody-play/infrastructure/vibe-cody/sidebar-instructions/change-sidebar-group-label";
import {
  MoveSidebarGroupItemProvider
} from "@cody-play/infrastructure/vibe-cody/sidebar-instructions/move-sidebar-group-item";
import {ChangeAppName} from "@cody-play/infrastructure/vibe-cody/app-instructions/change-app-name";
import {RemoveColumnProvider} from "@cody-play/infrastructure/vibe-cody/information-instructions/remove-column";
import {FocusOnSidebarItemProvider} from "@cody-play/infrastructure/vibe-cody/sidebar-instructions/focus-sidebar-item";
import {ChangePageTitleProvider} from "@cody-play/infrastructure/vibe-cody/page-instructions/change-page-title";
import {FocusOnPageTitleProvider} from "@cody-play/infrastructure/vibe-cody/page-instructions/focus-on-page-title";
import {ChangeViewTitleProvider} from "@cody-play/infrastructure/vibe-cody/information-instructions/change-view-title";
import {
  FocusOnViewTitleProvider
} from "@cody-play/infrastructure/vibe-cody/information-instructions/focus-on-view-title";
import {AddPageWithTable} from "@cody-play/infrastructure/vibe-cody/page-instructions/add-a-page-with-table";
import {OpenRowOnDetailsPage} from "@cody-play/infrastructure/vibe-cody/page-instructions/open-row-on-details-page";
import {AddANewTab} from "@cody-play/infrastructure/vibe-cody/page-instructions/add-a-new-tab";
import {UndoLastAction} from "@cody-play/infrastructure/vibe-cody/app-instructions/undo-last-action";
import {ProvideTypeSuggestions} from "@cody-play/infrastructure/vibe-cody/information-instructions/suggest-types";

type InstructionOrProvider = Instruction | InstructionProvider;

export const instructions: InstructionOrProvider[] = [
  /* App Settings */
  ChangeAppName,
  /* View Instructions */
  ChangeViewTitleProvider,
  FocusOnViewTitleProvider,
  /* Table Instructions */
  AddATableWithDefaults,
  AddColumnsToTable,
  AddTableItemProvider,
  BatchDeleteRows,
  EditTableItem,
  RenameTableRowDataTypeProvider,
  RemoveColumnProvider,
  /* Information Instructions */
  ProvideTypeSuggestions,
  /* Page Instructions */
  AddAPageWithName,
  AddPageWithTable,
  ChangePageTitleProvider,
  FocusOnPageTitleProvider,
  OpenRowOnDetailsPage,
  AddANewTab,
  /* Button Instructions */
  FocusOnButtonProvider,
  ChangeButtonLabel,
  ChangeButtonVariantProvider,
  ChangeButtonColorProvider,
  ChangeButtonIconProvider,
  IconOnlyButton,
  /* Sidebar Instructions */
  ChangeSidebarItemLabel,
  ChangeSidebarItemIconProvider,
  MoveSidebarItemProvider,
  MoveSidebarItemIntoNewGroup,
  MoveSidebarItemOutOfGroup,
  MoveSidebarItemIntoExistingGroupProvider,
  ChangeSidebarGroupIconProvider,
  ChangeSidebarGroupLabel,
  MoveSidebarGroupItemProvider,
  FocusOnSidebarItemProvider,
  /* Theme */
  ChangeThemeProvider,
  /* Undo */
  UndoLastAction,
]
