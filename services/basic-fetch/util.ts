import { jsonFetchWrapper } from "@/submodules/javascript-functions/basic-fetch";
import { MiscInfo } from "./misc";

export enum FetchType {
    GET = "GET",
    POST = "POST",
    PUT = "PUT",
    DELETE = "DELETE",
}

export function jsonFetchWrapperChecksDemo(url: string, fetchType: FetchType, onResult?: (result: any) => void, body?: BodyInit, headers?: any, onError?: (response: any) => void) {
    if (!canRequestInDemoAccess(fetchType)) {
        console.log("Cannot request in demo access")
        alertUser();
        return;
    }
    jsonFetchWrapper(url, fetchType, onResult, body, headers, onError);
}


function canRequestInDemoAccess(fetchType: FetchType): boolean {
    if (!MiscInfo.isDemo) return true;
    if (fetchType == FetchType.GET) return true;
    return false;
}

function alertUser() {
    alert("This function isn't part of the demo application.\nIf you want to test this function, don't hesitate to check out our hosted version!");
}