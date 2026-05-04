import { OAuth2ConsentSession } from "@ory/client";

export interface HydraConnectedApplication {
    readonly clientId: string;
    readonly clientName: string;
    readonly logoUri: string | null;
    readonly grantedScope: string[];
}

const SCOPE_LABELS: Record<string, string> = {
    openid: "OpenID",
    email: "Email",
    profile: "Profile",
    offline_access: "Offline access",
};

export function oauth2ScopeLabel(scope: string): string {
    return SCOPE_LABELS[scope] ?? scope;
}

function nonEmptyString(v: unknown): string | undefined {
    return typeof v === "string" && v.length > 0 ? v : undefined;
}

function dedupeScopes(scopes: (string | undefined)[]): string[] {
    return [...new Set(scopes.filter((s): s is string => typeof s === "string" && s.length > 0))];
}

function fromConsentSession(session: OAuth2ConsentSession): HydraConnectedApplication | null {
    const client = session.consent_request?.client;
    const clientId = nonEmptyString(client?.client_id);
    if (!clientId) return null;
    return {
        clientId,
        clientName: nonEmptyString(client?.client_name) ?? clientId,
        logoUri: nonEmptyString(client?.logo_uri) ?? null,
        grantedScope: dedupeScopes(session.grant_scope ?? []),
    };
}

export function consentSessionsToConnectedApplications(
    sessions: OAuth2ConsentSession[],
): HydraConnectedApplication[] {
    const byClientId = new Map<string, HydraConnectedApplication>();
    for (const session of sessions) {
        const app = fromConsentSession(session);
        if (!app) continue;
        const existing = byClientId.get(app.clientId);
        if (existing) {
            byClientId.set(app.clientId, {
                clientId: app.clientId,
                clientName: existing.clientName || app.clientName,
                logoUri: existing.logoUri ?? app.logoUri,
                grantedScope: dedupeScopes([...existing.grantedScope, ...app.grantedScope]),
            });
        } else {
            byClientId.set(app.clientId, app);
        }
    }
    return [...byClientId.values()];
}
