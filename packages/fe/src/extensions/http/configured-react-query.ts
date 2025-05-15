import {QueryClient} from "@tanstack/react-query";

let queryClient: QueryClient | undefined = undefined;

if(typeof queryClient === "undefined") {
  queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Attention: if you enable this option, command dialogs close on window focus
        refetchOnWindowFocus: false
      }
    }
  });
}

export default queryClient;
