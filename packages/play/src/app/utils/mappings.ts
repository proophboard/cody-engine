import {FormModeType} from "@frontend/app/components/core/CommandForm";
import {ActionContainerInfoType} from "@frontend/app/components/core/form/types/action";
import {EDropzoneId} from "@cody-play/app/types/enums/EDropzoneId";

export const mapFormModeTypeToContainerInfoType = (mode: FormModeType): ActionContainerInfoType => {
  switch (mode) {
    case "pageView":
    case "dialogView":
    case "pageForm":
    case "dialogForm":
      return "view";
    case "commandDialogForm":
      return "command";
    default:
      return "mixed";
  }
}

export const mapFormModeTypeToDropzoneIdTopRight = (mode: FormModeType): EDropzoneId => {
  switch (mode) {
    case "commandDialogForm":
      return EDropzoneId.COMMAND_TOP_ACTIONS_RIGHT;
    default:
      return EDropzoneId.VIEW_TOP_ACTIONS_RIGHT;
  }
}
