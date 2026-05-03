import { memo, useCallback } from "react"
import { useTranslation } from "react-i18next"

import { combineClassNames } from "@/submodules/javascript-functions/general"
import {
    oauth2ScopeLabel,
    HydraConnectedApplication,
} from "@/util/hydra-connected-applications.helper"

export enum ConnectedApplicationsLoadStateEnum {
    IDLE = "idle",
    LOADING = "loading",
    SUCCESS = "success",
    ERROR = "error"
}

export interface SettingsConnectedApplicationsProps {
    readonly applications: HydraConnectedApplication[];
    readonly loadState: ConnectedApplicationsLoadStateEnum;
    readonly loadError: string;
    readonly revokingClientId: string | null;
    readonly revokeNotice: { type: "success" | "error"; message: string } | null;
    readonly onRevoke: (clientId: string, clientName: string) => void;
    readonly onRetryLoad: () => void;
}

interface RowProps {
    readonly app: HydraConnectedApplication;
    readonly isRevoking: boolean;
    readonly onRevoke: (clientId: string, clientName: string) => void;
}

const SettingsConnectedApplicationRow = memo(function SettingsConnectedApplicationRow({
    app,
    isRevoking,
    onRevoke,
}: RowProps) {
    const { t } = useTranslation("settings")
    const clientName = app.clientName
    const clientInitial = clientName.charAt(0).toUpperCase()
    const handleRevokeClick = useCallback(() => {
        onRevoke(app.clientId, clientName)
    }, [app.clientId, clientName, onRevoke])

    return (
        <div className="settings-connected-app-card">
            <div className={combineClassNames("consent-client-badge", "settings-connected-app-badge")}>
                <span
                    className={combineClassNames(
                        "client-icon",
                        app.logoUri && "client-icon--logo",
                    )}
                >
                    {app.logoUri ? (
                        <img src={app.logoUri} alt={clientName} className="client-logo" />
                    ) : (
                        clientInitial
                    )}
                </span>
                <div className="client-info">
                    <span className="client-name">{clientName}</span>
                </div>
            </div>
            {app.grantedScope.length > 0 ? (
                <div className="settings-connected-app-scopes">
                    {app.grantedScope.map(scope => (
                        <span key={scope} className="settings-scope-chip">
                            {oauth2ScopeLabel(scope)}
                        </span>
                    ))}
                </div>
            ) : (
                <p className="settings-connected-app-scopes-empty">{t("hydraRevoke.noScopes")}</p>
            )}
            <div className="settings-connected-app-actions">
                <button
                    type="button"
                    className="link disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isRevoking}
                    onClick={handleRevokeClick}
                >
                    {isRevoking ? t("hydraRevoke.revoking") : t("hydraRevoke.revoke")}
                </button>
            </div>
        </div>
    )
})

function SettingsConnectedApplications(props: SettingsConnectedApplicationsProps) {
    const { t } = useTranslation("settings")
    const {
        applications,
        loadState,
        loadError,
        revokingClientId,
        revokeNotice,
        onRevoke,
        onRetryLoad,
    } = props

    const handleRetry = useCallback(() => {
        onRetryLoad()
    }, [onRetryLoad])

    const showLoading = loadState === ConnectedApplicationsLoadStateEnum.IDLE || loadState === ConnectedApplicationsLoadStateEnum.LOADING

    return (
        <div className="form-container">
            <h3 className="subtitle">{t("hydraRevoke.title")}</h3>
            <p className="text-paragraph">{t("hydraRevoke.description")}</p>

            {revokeNotice && (
                <p
                    className={combineClassNames(
                        "message",
                        revokeNotice.type === "success" ? "success" : "error",
                    )}
                >
                    {revokeNotice.message}
                </p>
            )}

            {showLoading && (
                <p className="text-paragraph settings-connected-apps-muted">{t("hydraRevoke.loading")}</p>
            )}

            {loadState === "error" && (
                <div className="settings-connected-apps-error-block">
                    <p className="message error">{loadError || t("hydraRevoke.loadError")}</p>
                    <button type="button" className="link" onClick={handleRetry}>
                        {t("hydraRevoke.retry")}
                    </button>
                </div>
            )}

            {loadState === "success" && applications.length === 0 && (
                <p className="text-paragraph settings-connected-apps-muted">{t("hydraRevoke.empty")}</p>
            )}

            {loadState === "success" && applications.length > 0 && (
                <div className="settings-connected-apps-list">
                    {applications.map(app => (
                        <SettingsConnectedApplicationRow
                            key={app.clientId}
                            app={app}
                            isRevoking={revokingClientId === app.clientId}
                            onRevoke={onRevoke}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

export default memo(SettingsConnectedApplications)
