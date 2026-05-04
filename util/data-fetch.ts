import { FetchType, jsonFetchWrapper } from "@/submodules/javascript-functions/basic-fetch";
import ory, { hydraOAuth2 } from "@/pkg/sdk";
import {
    consentSessionsToConnectedApplications,
    HydraConnectedApplication,
} from "@/util/hydra-connected-applications.helper";

const BACKEND_BASE_URI = '/refinery-gateway';
export const organizationEndpoint = `${BACKEND_BASE_URI}/api/v1/organization`;

export type { HydraConnectedApplication };


export async function getCurrentHydraSubject(): Promise<string> {
    const { data } = await ory.toSession();
    const subject = data.identity?.id;
    if (!subject) throw new Error("No active session");
    return subject;
}

export async function fetchHydraConnectedApplicationsForCurrentUser(): Promise<HydraConnectedApplication[]> {
    const subject = await getCurrentHydraSubject();
    const { data } = await hydraOAuth2.listOAuth2ConsentSessions({ subject });
    return consentSessionsToConnectedApplications(data);
}

export async function revokeHydraOAuth2GrantsForClient(clientId: string): Promise<void> {
    const subject = await getCurrentHydraSubject();
    await hydraOAuth2.revokeOAuth2ConsentSessions({ subject, client: clientId });
}


export function getUserInfoExtended(onResult: (result: any) => void) {
    const finalUrl = `${organizationEndpoint}/get-user-info-extended`;
    jsonFetchWrapper(finalUrl, FetchType.GET, onResult);
}

export function getAllActiveAdminMessages(onResult: (result: any) => void) {
    const finalUrl = `${organizationEndpoint}/all-active-admin-messages`
    jsonFetchWrapper(finalUrl, FetchType.GET, onResult)
}