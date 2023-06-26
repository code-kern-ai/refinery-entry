import { FetchType, jsonFetchWrapperChecksDemo } from "@/services/basic-fetch/util";

export function getIsManaged(onResult: (result: any) => void) {
    const url = `/is_managed`;
    jsonFetchWrapperChecksDemo(url, FetchType.GET, onResult);
}

export function getIsDemo(onResult: (result: any) => void) {
    const url = `/is_demo`;
    jsonFetchWrapperChecksDemo(url, FetchType.GET, onResult);
}