import {useMatches} from "react-router-dom";
import {PlayPageDefinition} from "@cody-play/state/types";

interface UsePageResult {
  id: string,
  handle: {page: PlayPageDefinition},
  data: unknown,
  params: Record<string, string>,
  pathname: string
}

export const usePlayPageMatch = (): UsePageResult => {
  const matches = useMatches();

  const lastMatch = matches[matches.length - 1];
  return lastMatch as UsePageResult;
}
