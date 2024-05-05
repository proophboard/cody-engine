import {QueryClient} from "@tanstack/react-query";

let queryClient: QueryClient | undefined = undefined;

if(typeof queryClient === "undefined") {
  queryClient = new QueryClient({});
}

export default queryClient;
