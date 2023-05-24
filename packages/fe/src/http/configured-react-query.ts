import {QueryClient} from "@tanstack/react-query";
import {Logger} from "@frontend/util/Logger";

let queryClient: QueryClient | undefined = undefined;

if(typeof queryClient === "undefined") {
  queryClient = new QueryClient({logger: Logger});
}

export default queryClient;
