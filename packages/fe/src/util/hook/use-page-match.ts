import {useMatches} from "react-router-dom";
import {PageDefinition} from "@frontend/app/pages/page-definitions";

interface UsePageResult {
  id: string,
  handle: {page: PageDefinition},
  data: unknown,
  params: Record<string, string>,
  pathname: string
}

export const usePageMatch = (): UsePageResult => {
  const matches = useMatches();

  const lastMatch = matches[matches.length - 1];
  return lastMatch as UsePageResult;
}
