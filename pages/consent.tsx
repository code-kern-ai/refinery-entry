import { OAuth2ConsentRequest, AcceptOAuth2ConsentRequestSession } from "@ory/client"
import type { NextPage } from "next"
import Head from "next/head"
import { useRouter } from "next/router"
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react"
import { KernLogo } from "@/pkg/ui/Icons"
import ory from "@/pkg/sdk"

const REMEMBER_FOR_SECONDS = 3600

const Consent: NextPage = () => {
  const router = useRouter()
  const { consent_challenge: consentChallenge } = router.query

  const [consentRequest, setConsentRequest] = useState<OAuth2ConsentRequest>()
  const [selectedScopes, setSelectedScopes] = useState<string[]>([])
  const [remember, setRemember] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

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

    fetch(`/refinery-entry/api/consent/get?challenge=${challenge}`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch consent request")
        return res.json()
      })
      .then(async (data: OAuth2ConsentRequest) => {
        const requestedScope = data.requested_scope || []

        // skip=true means user already consented — accept immediately
        if (data.skip) {
          const session = await buildSession(requestedScope)
          return fetch('/refinery-entry/api/consent/accept', {
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
            .then(res => res.json())
            .then(({ redirect_to }) => { window.location.href = redirect_to })
        }

        setConsentRequest(data)
        setSelectedScopes(requestedScope)
      })
      .catch(err => setErrorMessage(err.message ?? "Unable to load the consent request."))
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
      const res = await fetch('/refinery-entry/api/consent/accept', {
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
      const { redirect_to } = await res.json()
      window.location.href = redirect_to
    } catch (err: any) {
      setErrorMessage(err.message ?? "Unable to accept consent.")
    } finally {
      setIsSubmitting(false)
    }
  }, [buildSession, challenge, consentRequest, isSubmitting, remember, selectedScopes])

  const handleReject = useCallback(async () => {
    if (!challenge || isSubmitting) return
    setIsSubmitting(true)
    setErrorMessage("")
    try {
      const res = await fetch('/refinery-entry/api/consent/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challenge }),
      })
      const { redirect_to } = await res.json()
      window.location.href = redirect_to
    } catch (err: any) {
      setErrorMessage(err.message ?? "Unable to reject consent.")
    } finally {
      setIsSubmitting(false)
    }
  }, [challenge, isSubmitting])

  const clientName =
    consentRequest?.client?.client_name ||
    consentRequest?.client?.client_id ||
    "Unknown Client"

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
          {!challenge && <p className="message error">Expected a consent challenge but received none.</p>}
          {errorMessage && <p className="message error">{errorMessage}</p>}
          {consentRequest && (
            <form className="ui-container">
              <p className="text-paragraph">
                <strong>{clientName}</strong> is requesting access to your account.
              </p>
              {consentRequest.requested_scope && consentRequest.requested_scope.length > 0 && (
                <div className="form-container mt-4">
                  <h3 className="subtitle">Permissions</h3>
                  {consentRequest.requested_scope.map(scope => (
                    <label key={scope} className="text-paragraph block mt-2">
                      <input
                        type="checkbox"
                        checked={selectedScopes.includes(scope)}
                        onChange={e => handleScopeChange(scope, e.target.checked)}
                      />{" "}
                      {scope}
                    </label>
                  ))}
                </div>
              )}
              <label className="text-paragraph block mt-4">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                />{" "}
                Remember this consent decision
              </label>
              <div className="button-wrapper mt-4">
                <button className="button" type="button" onClick={handleAccept} disabled={isSubmitting}>
                  Allow access
                </button>
                <button className="button" type="button" onClick={handleReject} disabled={isSubmitting}>
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