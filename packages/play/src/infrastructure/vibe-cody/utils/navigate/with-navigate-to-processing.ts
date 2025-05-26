import {InstructionExecutionCallback} from "@cody-play/app/components/core/vibe-cody/VibeCodyDrawer";

export const withNavigateToProcessing = (cb: InstructionExecutionCallback): InstructionExecutionCallback => {
  return (input, ctx, dispatch, config, navigateTo) => {
    return new Promise(async (resolve, reject) => {
      navigateTo('/cody-play-internal/vibe-cody-processing');

      setTimeout(async () => {

        const res = await cb(input, ctx, dispatch, config, navigateTo);

        navigateTo(ctx.page.pathname);
        resolve(res);
      }, 500)
    })
  }
}
