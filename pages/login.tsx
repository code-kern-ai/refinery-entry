import { LoginFlow, UpdateLoginFlowBody } from "@ory/client"
import { AxiosError } from "axios"
import type { NextPage } from "next"
import Head from "next/head"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"

import { Flow } from "../pkg"
import { handleGetFlowError, handleFlowError } from "../pkg/errors"
import { KernLogo } from "@/pkg/ui/Icons"

import ory from "@/pkg/sdk"

const Login: NextPage = () => {
  const [initialFlow, setInitialFlow] = useState<LoginFlow>();
  const [changedFlow, setChangedFlow] = useState<LoginFlow>();
  const [oidcFlow, setOidcFlow] = useState<LoginFlow>();
  const [selectedRole, setSelectedRole] = useState<string | undefined>('engineer');
  const [isAccLinkageRequested, setIsAccLinkageRequested] = useState(false);
  const [totpFlow, setTotpFlow] = useState<LoginFlow>();
  const [displayMailForm, setDisplayMailForm] = useState(false);
  // Get ?flow=... from the URL
  const router = useRouter()
  const {
    return_to: returnTo,
    flow: flowId,
    login_challenge: loginChallenge,
    // Refresh means we want to refresh the session. This is needed, for example, when we want to update the password
    // of a user.
    refresh,
    // AAL = Authorization Assurance Level. This implies that we want to upgrade the AAL, meaning that we want
    // to perform two-factor authentication/verification.
    aal,
  } = router.query

  useEffect(() => {
    // If the router is not ready yet, or we already have a flow, do nothing.
    if (!router.isReady || initialFlow) {
      return
    }
    // If there is a challenge, check for existing session first
    if (loginChallenge) {

      ory.toSession()
        .then(({ data }) => {
          // Active session exists — let the server accept the challenge
          // without forcing re-auth
          return fetch(`/refinery-authorizer/hydra/login/accept`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              challenge: String(loginChallenge),
              subject: data.identity.id,
            }),
          })
        })
        .then(res => res.json())
        .then(({ redirect_to }) => {
          const target = new URL(redirect_to, window.location.origin)
          if (target.pathname === window.location.pathname && target.search === window.location.search) {
            window.location.reload()
          } else {
            window.location.href = redirect_to
          }
        })
        .catch(() => {
          // No session — proceed with normal flow creation
          ory.createBrowserLoginFlow({
            refresh: Boolean(refresh),
            aal: aal ? String(aal) : undefined,
            returnTo: returnTo ? String(returnTo) : undefined,
            loginChallenge: String(loginChallenge),
          })
          .then(({ data }) => setInitialFlow(data))
          .catch(handleFlowError(router, 'login', setInitialFlow))
        })
      return
    }
    // If ?flow=.. was in the URL, we fetch it
    if (flowId) {
      ory
        .getLoginFlow({ id: String(flowId) })
        .then(({ data }) => {
          setInitialFlow(data)
        })
        .catch(handleGetFlowError(router, "login", setInitialFlow))
      return
    }
    // Otherwise we initialize it
    ory
      .createBrowserLoginFlow({
        refresh: Boolean(refresh),
        aal: aal ? String(aal) : undefined,
        returnTo: returnTo ? String(returnTo) : undefined,
        loginChallenge: loginChallenge ? String(loginChallenge) : undefined,
      })
      .then(({ data }) => {
        setInitialFlow(data)
      })
      .catch(handleFlowError(router, "login", setInitialFlow))
  }, [flowId, router, router.isReady, aal, refresh, returnTo, loginChallenge, initialFlow])

  useEffect(() => {
    if (!initialFlow) return;
    const linkageRequested = initialFlow.ui.messages?.some((message: any) => message.id === 4000007) && initialFlow.ui.messages?.some((message: any) => message.id === 1010016);
    if (linkageRequested) {
      initialFlow.ui.nodes = []
      initialFlow.ui.messages = [{ id: 400002, type: "error", text: "An account with the same identifier exists already and can not be linked by social-sign-in." }]
      setChangedFlow(initialFlow);
      setIsAccLinkageRequested(linkageRequested);
      return
    }

    const flowData: any = Object.assign({}, initialFlow);

    if (initialFlow.ui.nodes.some((node: any) => node.group === "totp")) {
      const totcData = JSON.parse(JSON.stringify(flowData));
      totcData.ui.nodes = totcData.ui.nodes.filter((node: any) => node.group == "totp" || node.group == "default");
      // prevent duplicate messages
      totcData.ui.messages = [];
      setTotpFlow(totcData);
    }

    if (flowData.ui.nodes.some((node: any) => node.group === "oidc")) {
      const oidcData = JSON.parse(JSON.stringify(flowData));
      oidcData.ui.nodes = oidcData.ui.nodes.filter((node: any) => node.group == "oidc");
      // prevent duplicate messages
      oidcData.ui.messages = [];
      setOidcFlow(oidcData);
    }
    setChangedFlow(flowData);
  }, [initialFlow, selectedRole])

  const onSubmit = (values: UpdateLoginFlowBody) =>
    ory
      .updateLoginFlow({
        flow: String(initialFlow?.id),
        updateLoginFlowBody: values,
      })
      // We logged in successfully! Let's bring the user home.
      .then(() => {
        if (initialFlow?.return_to) {
          window.location.href = initialFlow?.return_to
          return
        }
        router.push("/cognition")

      })
      .then(() => { })
      .catch(handleFlowError(router, "login", setInitialFlow))
      .catch((err: AxiosError) => {
        // If the previous handler did not catch the error it's most likely a form validation error
        if (err.response?.status === 400) {
          // Yup, it is!
          setInitialFlow(err.response?.data as LoginFlow | undefined)
          return
        }

        return Promise.reject(err)
      })


  const backToLoginQuery = new URLSearchParams({
    ...(returnTo ? { return_to: String(returnTo) } : {}),
    ...(loginChallenge ? { login_challenge: String(loginChallenge) } : {}),
  }).toString()
  const backToLoginHref = `/auth/login${backToLoginQuery ? `?${backToLoginQuery}` : ""}`

  const registrationQuery = new URLSearchParams({
    ...(returnTo ? { return_to: String(returnTo) } : {}),
    ...(loginChallenge ? { login_challenge: String(loginChallenge) } : {}),
  }).toString()
  const registrationHref = `/auth/registration${registrationQuery ? `?${registrationQuery}` : ""}`

  return (
    <>
      <Head>
        <title>kern</title>
        <meta name="description" content="NextJS + React + Vercel + Ory" />
      </Head>
      <div className="app-container">
        <KernLogo />
        <div id="login">
          <h2 className="title">Sign in to your account</h2>
          <p className="text-paragraph">Or
            <a className="link" href={registrationHref}> Register account </a> -
            no credit card required!
          </p>
          <div className="ui-container">
            <div>
              {displayMailForm && <Flow onSubmit={onSubmit} flow={changedFlow} only="password" />}
              <div className="button-wrapper">
                {displayMailForm ?
                  <button className="button" name="mail" value="Mail"
                    onClick={() => setDisplayMailForm(false)}>Go back</button> :
                  <button className="button" name="mail" value="Mail"
                    onClick={() => setDisplayMailForm(true)}>Sign in with Mail</button>}
              </div>
              {oidcFlow && !displayMailForm ?
                <>
                  <Flow onSubmit={onSubmit} flow={oidcFlow} only="oidc" />
                </> : null}
              {totpFlow && !displayMailForm ?
                <>
                  <Flow onSubmit={onSubmit} flow={totpFlow} only="totp" />
                </> : null}
            </div>
          </div>
          <div className="link-container">
            {
              !isAccLinkageRequested ?
                <>
                  {displayMailForm ? <a className="link" href="/auth/recovery">Forgot your password?</a> : null}
                </>
                : <a className="link" href={backToLoginHref}>Go back to login</a>
            }
          </div>
        </div>
      </div >
      <div className="img-container">
      </div>
    </>
  )
}

export default Login
