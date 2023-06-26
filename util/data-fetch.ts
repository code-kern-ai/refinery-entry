import { FetchType, jsonFetchWrapper } from "@/services/basic-fetch/util";

export function getIsManaged(onResult: (result: any) => void) {
    const url = `/is_managed`;
    jsonFetchWrapper(url, FetchType.GET, onResult);
}

export function getIsDemo(onResult: (result: any) => void) {
    const url = `/is_demo`;
    jsonFetchWrapper(url, FetchType.GET, onResult);
}