import { MiscInfo } from "./misc";

export enum FetchType {
    GET = "GET",
    POST = "POST",
    PUT = "PUT",
    DELETE = "DELETE",
}

export function jsonFetchWrapper(url: string, fetchType: FetchType, onResult?: (result: any) => void, body?: BodyInit, headers?: any, onError?: (response: any) => void) {
    if (!canRequestInDemoAccess(fetchType)) {
        console.log("Cannot request in demo access")
        alertUser();
        return;
    }
    if (!headers) headers = {};
    headers["Content-Type"] = "application/json";

    let hasError = false;
    let myFetch = fetch(url, {
        method: fetchType,
        headers: headers,
        body: body,
    }).then(response => {
        if (!response.ok) {
            if (onError) onError(response);
            else throw new Error("Error in request at " + url);
            hasError = true;
        }
        else return response.json();
    });

    if (onResult && !hasError) myFetch.then(result => onResult(result));


}


function canRequestInDemoAccess(fetchType: FetchType): boolean {
    if (!MiscInfo.isDemo) return true;
    if (fetchType == FetchType.GET) return true;
    return false;
}

function alertUser() {
    alert("This function isn't part of the demo application.\nIf you want to test this function, don't hesitate to check out our hosted version!");
}