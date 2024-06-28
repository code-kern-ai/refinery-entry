import { FetchType, jsonFetchWrapper } from "@/submodules/javascript-functions/basic-fetch";

const BACKEND_BASE_URI = '/refinery-gateway';
export const organizationEndpoint = `${BACKEND_BASE_URI}/api/v1/organization`;

export function getIsManaged(onResult: (result: any) => void) {
    const url = `/is_managed`;
    jsonFetchWrapper(url, FetchType.GET, onResult);
}

export function getIsDemo(onResult: (result: any) => void) {
    const url = `/is_demo`;
    jsonFetchWrapper(url, FetchType.GET, onResult);
}

export function getUserInfoExtended(onResult: (result: any) => void) {
    const finalUrl = `${organizationEndpoint}/get-user-info-extended`;
    jsonFetchWrapper(finalUrl, FetchType.GET, onResult);
}

export function getAllActiveAdminMessages(onResult: (result: any) => void) {
    const finalUrl = `${organizationEndpoint}/all-active-admin-messages`
    jsonFetchWrapper(finalUrl, FetchType.GET, onResult)
}