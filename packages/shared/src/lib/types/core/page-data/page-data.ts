import {UseQueryResult} from "@tanstack/react-query";

export type PageData = Record<string, UseQueryResult>;

export type AddQueryResult = (name: string, result: UseQueryResult) => void;
