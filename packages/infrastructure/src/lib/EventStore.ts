import {Event, EventMeta} from "@event-engine/messaging/event";
import {Payload} from "@event-engine/messaging/message";
import {AuthService} from "@server/infrastructure/auth-service/auth-service";

export enum MatchOperator {
    EQ = '===',
    GT = '>',
    GTE = '>=',
    LT = '<',
    LTE = '<=',
}

type Value = string | number | boolean;
type EVT_PROP = "uuid" | "payload" | "name" | "meta" | "createdAt";

/**
 * evtProp defaults to "meta"
 */
export interface MatchObject {op: MatchOperator, val: Value | Array<Value>, evtProp?: EVT_PROP}

export const META_KEY_EVENT_ID = '$eventId';
export const META_KEY_EVENT_NAME = '$eventName';
export const META_KEY_CREATED_AT = '$createdAt';

export interface EventMatcher {
    [metadataKey: string]: string | MatchObject;
}

export function checkMatchObject(key: string, matcher: string | MatchObject): MatchObject {
    if(Array.isArray(matcher) || typeof matcher !== "object") {
        let evtProp: EVT_PROP = "meta";

        if(key === META_KEY_EVENT_ID) {
            evtProp = "uuid";
        }

        if(key === META_KEY_EVENT_NAME) {
            evtProp = "name";
        }

        if(key === META_KEY_CREATED_AT) {
            evtProp = "createdAt"
        }

        return {op: MatchOperator.EQ, val: matcher, evtProp};
    }

    if(!matcher.evtProp) {
        matcher.evtProp = "meta";
    }

    return matcher;
}

export type AppendToListener = (streamName: string, events: Event[], isRepublishing?: boolean) => void;

export type StreamType = "write-model" | "public";

export interface EventStore {
    hasStream: (streamName: string) => Promise<boolean>;
    /**
     * @param streamName string Name of the stream
     * @param type StreamType Type of the stream, defaults to "write-model"
     */
    createStream: (streamName: string, type?: StreamType) => Promise<boolean>;
    deleteStream: (streamName: string) => Promise<boolean>;
    appendTo: (streamName: string, events: Event[], eventMatcher?: EventMatcher, expectedVersion?: number) => Promise<boolean>;
    load: <P extends Payload = any, M extends EventMeta = any>(streamName: string, eventMatcher?: EventMatcher, fromEventId?: string, limit?: number, reverse?: boolean) => Promise<AsyncIterable<Event<P,M>>>;
    delete: (streamName: string, eventMatcher: EventMatcher) => Promise<number>;
    republish: (streamName: string, authService: AuthService, eventMatcher?: EventMatcher, fromEventId?: string, limit?: number) => Promise<void>;
    attachAppendToListener: (listener: AppendToListener) => void;
    detachAppendToListener: (listener: AppendToListener) => void;
}
