import MdiIcon from "@cody-play/app/components/core/MdiIcon";

export const makeMdiIcon = (name: string) => {
  return () => {
    return MdiIcon({icon: name});
  }
}
