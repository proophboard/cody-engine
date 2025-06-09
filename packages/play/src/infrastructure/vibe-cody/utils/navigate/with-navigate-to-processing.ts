import {InstructionExecutionCallback} from "@cody-play/app/components/core/vibe-cody/VibeCodyDrawer";

export const VIBE_CODY_PROCESSING = '/cody-play-internal/vibe-cody-processing';

export const withNavigateToProcessing = (cb: InstructionExecutionCallback, stayOnProcessingPage?: boolean): InstructionExecutionCallback => {
  return (input, ctx, dispatch, config, navigateTo) => {
    return new Promise(async (resolve, reject) => {
      navigateTo(VIBE_CODY_PROCESSING);

      setTimeout(async () => {

        const res = await cb(input, ctx, dispatch, config, navigateTo);

        if(!stayOnProcessingPage) {
          navigateTo(ctx.page.pathname);
        }
        resolve(res);
      }, 500)
    })
  }
}
