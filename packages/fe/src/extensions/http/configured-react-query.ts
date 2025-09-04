import {QueryClient} from "@tanstack/react-query";

let queryClient: QueryClient | undefined = undefined;

if(typeof queryClient === "undefined") {
  queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Attention: if you enable this option, command dialogs close on window focus
        refetchOnWindowFocus: false,
        // Refetch queries always on mount ignoring the stale time by default
        refetchOnMount: "always"
      }
    }
  });
}

export default queryClient;
