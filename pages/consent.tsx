import { OAuth2ConsentRequest, AcceptOAuth2ConsentRequestSession } from "@ory/client"
import type { NextPage } from "next"
import Head from "next/head"
import { useRouter } from "next/router"
import { useCallback, useEffect, useMemo, useState } from "react"
import { combineClassNames } from "@/submodules/javascript-functions/general"
import { KernLogo } from "@/pkg/ui/Icons"
import ory from "@/pkg/sdk"

const REMEMBER_FOR_SECONDS = 3600

const SCOPE_META: Record<string, { label: string; description: string }> = {
  openid: { label: "OpenID", description: "Verify your identity" },
  email: { label: "Email", description: "View your email address" },
  profile: { label: "Profile", description: "View your basic profile info" },
  offline_access: { label: "Offline access", description: "Stay signed in on your behalf" },
}

const LOADING_CONTAINER_STYLE = { textAlign: "center" as const }
const FORM_SCOPE_CONTAINER_STYLE = { marginTop: 20 }
const SUBTITLE_STYLE = { marginBottom: 4 }
const TEXT_DESCRIPTION_BOTTOM_STYLE = { marginBottom: 0 }

function getScopeMeta(scope: string) {
  return SCOPE_META[scope] ?? { label: scope, description: "Access to " + scope }
}

const Consent: NextPage = () => {
  const router = useRouter()
  const { consent_challenge: consentChallenge } = router.query

  const [consentRequest, setConsentRequest] = useState<OAuth2ConsentRequest>()
  const [selectedScopes, setSelectedScopes] = useState<string[]>([])
  const [remember, setRemember] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  const challenge = useMemo(
    () => (consentChallenge ? String(consentChallenge) : ""),
    [consentChallenge],
  )

  const buildSession = useCallback(async (grantScope: string[]): Promise<AcceptOAuth2ConsentRequestSession> => {
    const session: AcceptOAuth2ConsentRequestSession = {
      access_token: {},
      id_token: {},
    }
    try {
      const { data } = await ory.toSession()
      const identity = data.identity
      if (!identity) return session

      if (grantScope.includes("email")) {
        const address = identity.verifiable_addresses?.find(a => a.via === "email")
        if (address) {
          session.id_token!.email = address.value
          session.id_token!.email_verified = address.verified
        }
      }

      if (grantScope.includes("profile")) {
        if (identity.traits?.username) session.id_token!.preferred_username = identity.traits.username
        if (identity.traits?.website) session.id_token!.website = identity.traits.website
        if (typeof identity.traits?.name === "object") {
          const name = identity.traits.name as { first?: string; last?: string }
          if (name.first) session.id_token!.given_name = name.first
          if (name.last) session.id_token!.family_name = name.last
        } else if (typeof identity.traits?.name === "string") {
          session.id_token!.name = identity.traits.name
        }
        if (identity.updated_at) {
          session.id_token!.updated_at = parseInt((Date.parse(identity.updated_at) / 1000).toFixed(0), 10)
        }
      }
    } catch {
      // continue without enrichment
    }
    return session
  }, [])

  useEffect(() => {
    if (!router.isReady || !challenge) return

    fetch(`/refinery-authorizer/hydra/consent?challenge=${challenge}`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch consent request")
        return res.json()
      })
      .then(async (data: OAuth2ConsentRequest) => {
        const requestedScope = data.requested_scope || []

        if (data.skip) {
          const session = await buildSession(requestedScope)
          return fetch('/refinery-authorizer/hydra/consent/accept', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              challenge,
              grant_scope: requestedScope,
              grant_access_token_audience: data.requested_access_token_audience || [],
              remember,
              remember_for: REMEMBER_FOR_SECONDS,
              session,
            }),
          })
            .then(res => {
              if (!res.ok) throw new Error('Failed to accept consent')
              return res.json()
            })
            .then(({ redirect_to }) => {
              if (redirect_to && typeof redirect_to === "string") window.location.href = redirect_to
            })
        }

        setConsentRequest(data)
        setSelectedScopes(requestedScope)
        setIsLoading(false)
      })
      .catch((err: unknown) => {
        setErrorMessage(err instanceof Error ? err.message : "Unable to load the consent request.")
        setIsLoading(false)
      })
  }, [router.isReady, challenge, buildSession, remember])

  const handleScopeChange = useCallback((scope: string, checked: boolean) => {
    setSelectedScopes(prev =>
      checked ? [...prev, scope] : prev.filter(s => s !== scope)
    )
  }, [])

  const handleAccept = useCallback(async () => {
    if (!consentRequest || !challenge || isSubmitting) return
    setIsSubmitting(true)
    setErrorMessage("")
    try {
      const session = await buildSession(selectedScopes)
      const res = await fetch('/refinery-authorizer/hydra/consent/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challenge,
          grant_scope: selectedScopes,
          grant_access_token_audience: consentRequest.requested_access_token_audience || [],
          remember,
          remember_for: REMEMBER_FOR_SECONDS,
          session,
        }),
      })
      if (!res.ok) throw new Error('Failed to accept consent')
      const { redirect_to } = await res.json()
      if (redirect_to && typeof redirect_to === "string") window.location.href = redirect_to
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Unable to accept consent.")
    } finally {
      setIsSubmitting(false)
    }
  }, [buildSession, challenge, consentRequest, isSubmitting, remember, selectedScopes])

  const handleRememberChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setRemember(e.target.checked)
  }, [])

  const handleReject = useCallback(async () => {
    if (!challenge || isSubmitting) return
    setIsSubmitting(true)
    setErrorMessage("")
    try {
      const res = await fetch('/refinery-authorizer/hydra/consent/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challenge }),
      })
      if (!res.ok) throw new Error('Failed to reject consent')
      const { redirect_to } = await res.json()
      if (redirect_to && typeof redirect_to === "string") window.location.href = redirect_to
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Unable to reject consent.")
    } finally {
      setIsSubmitting(false)
    }
  }, [challenge, isSubmitting])

  const clientName =
    consentRequest?.client?.client_name ||
    consentRequest?.client?.client_id ||
    "Unknown Client"

  const clientInitial = clientName.charAt(0).toUpperCase()
  const clientLogoUri =
    (consentRequest?.client as { logo_uri?: string } | undefined)?.logo_uri ||
    (consentRequest?.client as { logo_url?: string } | undefined)?.logo_url ||
    ""


  return (
    <>
      <Head>
        <title>Consent</title>
        <meta name="description" content="OAuth2 consent flow" />
      </Head>
      <div className="app-container">
        <KernLogo />
        <div id="consent">
          <h2 className="title">Authorize access</h2>

          {!challenge && !isLoading && (
            <p className="message error">Expected a consent challenge but received none.</p>
          )}
          {errorMessage && <p className="message error">{errorMessage}</p>}

          {isLoading && challenge && !errorMessage && (
            <div className="ui-container" style={LOADING_CONTAINER_STYLE}>
              <p className="text-paragraph">Loading consent request…</p>
            </div>
          )}

          {consentRequest && (
            <form className="ui-container" onSubmit={e => e.preventDefault()}>
              <div className="consent-client-badge">
                <span
                  className={combineClassNames(
                    "client-icon",
                    clientLogoUri && "client-icon--logo",
                  )}
                >
                  {clientLogoUri ? (
                    <img
                      src={clientLogoUri}
                      alt={clientName}
                      className="client-logo"
                    />
                  ) : (
                    clientInitial
                  )}
                </span>
                <div className="client-info">
                  <span className="client-name">{clientName}</span>
                  <span className="client-label">wants to access your account</span>
                </div>
              </div>

              {consentRequest.requested_scope && consentRequest.requested_scope.length > 0 && (
                <div className="form-container" style={FORM_SCOPE_CONTAINER_STYLE}>
                  <p className="subtitle" style={SUBTITLE_STYLE}>Permissions</p>
                  <p className="text-description" style={TEXT_DESCRIPTION_BOTTOM_STYLE}>
                    Select which permissions to grant
                  </p>
                  <div className="scope-list">
                    {consentRequest.requested_scope.map(scope => {
                      const meta = getScopeMeta(scope)
                      const isChecked = selectedScopes.includes(scope)
                      const isDisabled = scope.toLowerCase().includes('offline') || scope.toLowerCase().includes('openid')
                      return (
                        <label
                          key={scope}
                          className={combineClassNames("scope-item", isChecked && "selected", isDisabled ? "cursor-not-allowed" : "cursor-pointer")}
                        >
                          <input
                            type="checkbox"
                            className="disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                            checked={isChecked}
                            onChange={e => handleScopeChange(scope, e.target.checked)}
                            disabled={isDisabled}
                          />
                          <div>
                            <div className="scope-label">{meta.label}</div>
                            <div className="scope-description">{meta.description}</div>
                          </div>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )}

              <label className="remember-row">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={handleRememberChange}
                />
                <span className="remember-text">Remember this decision</span>
              </label>

              <div className="consent-btn-group">
                <button
                  className="consent-btn-primary"
                  type="button"
                  onClick={handleAccept}
                  disabled={isSubmitting || selectedScopes.length === 0}
                >
                  {isSubmitting ? (
                    <><span className="consent-spinner" />Processing…</>
                  ) : (
                    "Allow access"
                  )}
                </button>
                <button
                  className="consent-btn-secondary"
                  type="button"
                  onClick={handleReject}
                  disabled={isSubmitting}
                >
                  Deny access
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
      <div className="img-container" />
    </>
  )
}

export default Consent
