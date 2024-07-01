import {Payload} from "@event-engine/messaging/message";
import {AxiosResponse} from "axios";

export type CommandMutationFunction = (commandPayload: Payload) =>  Promise<AxiosResponse>;
