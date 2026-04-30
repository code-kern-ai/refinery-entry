import { FetchType, jsonFetchWrapper } from "@/submodules/javascript-functions/basic-fetch";
import ory, { hydraOAuth2 } from "@/pkg/sdk";
import {
    consentSessionsToConnectedApplications,
    type HydraConnectedApplication,
} from "@/util/hydra-connected-applications.helper";

const BACKEND_BASE_URI = '/refinery-gateway';
export const organizationEndpoint = `${BACKEND_BASE_URI}/api/v1/organization`;

export type { HydraConnectedApplication };

/** Returns the Hydra subject (= Kratos identity id) for the current browser session. */
export async function getCurrentHydraSubject(): Promise<string> {
    const { data } = await ory.toSession();
    const subject = data.identity?.id;
    if (!subject) throw new Error("No active session");
    return subject;
}

/**
 * Lists Hydra OAuth2 consent sessions for the current user via `@ory/client` `OAuth2Api.listOAuth2ConsentSessions`,
 * collapsed to one entry per `client_id` (scopes union).
 */
export async function fetchHydraConnectedApplicationsForCurrentUser(): Promise<HydraConnectedApplication[]> {
    const subject = await getCurrentHydraSubject();
    const { data } = await hydraOAuth2.listOAuth2ConsentSessions({ subject });
    return consentSessionsToConnectedApplications(data);
}

/**
 * Revokes Hydra OAuth2 consent sessions for one client for the current user via
 * `OAuth2Api.revokeOAuth2ConsentSessions`.
 */
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