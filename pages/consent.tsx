import { AcceptOAuth2ConsentRequestSession, OAuth2ConsentRequest } from "@ory/client"
import { AxiosError } from "axios"
import type { NextPage } from "next"
import Head from "next/head"
import { useRouter } from "next/router"
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react"

import { KernLogo } from "@/pkg/ui/Icons"
import hydra from "@/pkg/sdk/hydra"
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

  const buildSession = useCallback(async (grantScope: string[]) => {
    const session: AcceptOAuth2ConsentRequestSession = {
      access_token: {},
      id_token: {},
    }

    try {
      const { data } = await ory.toSession()
      const identity = data.identity

      if (!identity) {
        return session
      }

      if (grantScope.includes("email")) {
        const addresses = identity.verifiable_addresses || []
        const address = addresses.find((item) => item.via === "email")
        if (address) {
          session.id_token.email = address.value
          session.id_token.email_verified = address.verified
        }
      }

      if (grantScope.includes("profile")) {
        if (identity.traits?.username) {
          session.id_token.preferred_username = identity.traits.username as string
        }
        if (identity.traits?.website) {
          session.id_token.website = identity.traits.website as string
        }
        if (typeof identity.traits?.name === "object") {
          const name = identity.traits.name as { first?: string; last?: string }
          if (name.first) {
            session.id_token.given_name = name.first
          }
          if (name.last) {
            session.id_token.family_name = name.last
          }
        } else if (typeof identity.traits?.name === "string") {
          session.id_token.name = identity.traits.name
        }
        if (identity.updated_at) {
          session.id_token.updated_at = parseInt(
            (Date.parse(identity.updated_at) / 1000).toFixed(0),
            10,
          )
        }
      }
    } catch (error) {
      // Continue consent even if we can't enrich token claims.
    }

    return session
  }, [])

  const acceptConsent = useCallback(
    async (request: OAuth2ConsentRequest, grantScope: string[]) => {
      const { data } = await hydra.acceptOAuth2ConsentRequest({
        consentChallenge: challenge,
        acceptOAuth2ConsentRequest: {
          grant_scope: grantScope,
          grant_access_token_audience:
            request.requested_access_token_audience || [],
          remember,
          remember_for: REMEMBER_FOR_SECONDS,
          session: await buildSession(grantScope),
        },
      })
      window.location.href = String(data.redirect_to)
    },
    [buildSession, challenge, remember],
  )

  useEffect(() => {
    if (!router.isReady || !challenge) {
      return
    }

    hydra
      .getOAuth2ConsentRequest({ consentChallenge: challenge })
      .then(async ({ data }) => {
        const requestedScope = data.requested_scope || []

        if (data.skip) {
          await acceptConsent(data, requestedScope)
          return
        }

        setConsentRequest(data)
        setSelectedScopes(requestedScope)
      })
      .catch((err: AxiosError) => {
        setErrorMessage(
          (err.response?.data as any)?.error_description ||
          "Unable to load the consent request.",
        )
      })
  }, [acceptConsent, challenge, router.isReady])

  const handleScopeChange = useCallback((scope: string, checked: boolean) => {
    setSelectedScopes((currentScopes) =>
      checked
        ? [...currentScopes, scope]
        : currentScopes.filter((currentScope) => currentScope !== scope),
    )
  }, [])

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      if (!consentRequest || !challenge || isSubmitting) {
        return
      }

      const formData = new FormData(event.currentTarget)
      const action = String(formData.get("consent_action"))
      setIsSubmitting(true)
      setErrorMessage("")

      try {
        if (action === "accept") {
          await acceptConsent(consentRequest, selectedScopes)
          return
        }

        const { data } = await hydra.rejectOAuth2ConsentRequest({
          consentChallenge: challenge,
          rejectOAuth2Request: {
            error: "access_denied",
            error_description: "The resource owner denied the request",
          },
        })
        window.location.href = String(data.redirect_to)
      } catch (err) {
        const error = err as AxiosError
        setErrorMessage(
          (error.response?.data as any)?.error_description ||
          "Unable to submit the consent response.",
        )
      } finally {
        setIsSubmitting(false)
      }
    },
    [acceptConsent, challenge, consentRequest, isSubmitting, selectedScopes],
  )

  const clientName =
    consentRequest?.client?.client_name ||
    consentRequest?.client?.client_id ||
    "Unknown Client"
  const requestedScopes = consentRequest?.requested_scope || []

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
          {!challenge && (
            <p className="message error">Expected a consent challenge but received none.</p>
          )}
          {errorMessage && <p className="message error">{errorMessage}</p>}
          {consentRequest && (
            <form className="ui-container" onSubmit={handleSubmit}>
              <p className="text-paragraph">
                <strong>{clientName}</strong> is requesting access to your account.
              </p>
              {requestedScopes.length > 0 && (
                <div className="form-container mt-4">
                  <h3 className="subtitle">Permissions</h3>
                  {requestedScopes.map((scope) => (
                    <label key={scope} className="text-paragraph block mt-2">
                      <input
                        type="checkbox"
                        checked={selectedScopes.includes(scope)}
                        onChange={(event) =>
                          handleScopeChange(scope, event.target.checked)
                        }
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
                  onChange={(event) => setRemember(event.target.checked)}
                />{" "}
                Remember this consent decision
              </label>
              <div className="button-wrapper mt-4">
                <button
                  className="button"
                  name="consent_action"
                  type="submit"
                  value="accept"
                  disabled={isSubmitting}
                >
                  Allow access
                </button>
                <button
                  className="button"
                  name="consent_action"
                  type="submit"
                  value="reject"
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
