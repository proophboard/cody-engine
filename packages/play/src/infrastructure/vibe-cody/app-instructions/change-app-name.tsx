import {Instruction} from "@cody-play/app/components/core/vibe-cody/VibeCodyDrawer";
import {FormatText} from "mdi-material-ui";
import {getEditedContextFromConfig} from "@cody-play/state/config-store";

const TEXT = `Change app name to: `;

export const ChangeAppName: Instruction = {
  text: TEXT,
  icon: <FormatText />,
  isActive: context => context.focusedElement?.type === "appName",
  match: input => input.startsWith(TEXT),
  execute: async (input, ctx, dispatch, config) => {
    const appName = input.replace(TEXT, '').trim();

    dispatch({
      type: "RENAME_APP",
      name: appName,
      ctx: getEditedContextFromConfig(config)
    })

    ctx.setFocusedElement({
      id: appName,
      name: appName,
      type: 'appName'
    })

    return {
      cody: `Name is changed`
    }
  }
}
