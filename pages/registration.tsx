import { RegistrationFlow, UpdateRegistrationFlowBody } from "@ory/client"
import { AxiosError } from "axios"
import type { NextPage } from "next"
import Head from "next/head"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import { KernLogo } from "@/pkg/ui/Icons"
import ory from "@/pkg/sdk"
import { handleFlowError } from "@/pkg/errors"
import { Flow } from "@/pkg"
import { prepareNodes } from "@/util/helper-functions"

// Renders the registration page
const Registration: NextPage = () => {
  const router = useRouter()

  // The "flow" represents a registration process and contains
  // information about the form we need to render (e.g. username + password)
  const [initialFlow, setInitialFlow]: any = useState<RegistrationFlow>();
  const [changedFlow, setChangedFlow]: any = useState<RegistrationFlow>();
  const [oidcFlow, setOidcFlow]: any = useState<RegistrationFlow>();


  // Get ?flow=... from the URL
  const {
    flow: flowId,
    return_to: returnTo,
    login_challenge: loginChallenge,
  } = router.query;

  // In this effect we either initiate a new registration flow, or we fetch an existing registration flow.
  useEffect(() => {
    // If the router is not ready yet, or we already have a flow, do nothing.
    if (!router.isReady || initialFlow) {
      return
    }

    // If ?flow=.. was in the URL, we fetch it
    if (flowId) {
      ory
        .getRegistrationFlow({ id: String(flowId) })
        .then(({ data }) => {
          // We received the flow - let's use its data and render the form!
          setInitialFlow(data)
        })
        .catch(handleFlowError(router, "registration", setInitialFlow))
      return
    }

    // Otherwise we initialize it
    ory
      .createBrowserRegistrationFlow({
        returnTo: returnTo ? String(returnTo) : undefined,
        loginChallenge: loginChallenge ? String(loginChallenge) : undefined,
      })
      .then(({ data }) => {
        setInitialFlow(data)
      })
      .catch(handleFlowError(router, "registration", setInitialFlow))
  }, [flowId, router, router.isReady, returnTo, loginChallenge, initialFlow])

  useEffect(() => {
    if (!initialFlow) return;

    initialFlow.ui.nodes = prepareNodes(initialFlow);

    if (initialFlow.ui.nodes.some((node: any) => node.group === "oidc")) {
      const oidcData = JSON.parse(JSON.stringify(initialFlow));
      oidcData.ui.nodes = oidcData.ui.nodes.filter((node: any) => node.group == "oidc");
      // prevent duplicate messages
      oidcData.ui.messages = [];
      setOidcFlow(oidcData);
    }

    setChangedFlow(initialFlow);
  }, [initialFlow])

  const onSubmit = async (values: UpdateRegistrationFlowBody) => {

    await router
      // On submission, add the flow ID to the URL but do not navigate. This prevents the user loosing
      // his data when she/he reloads the page.
      .push(`/registration?flow=${initialFlow?.id}`, undefined, { shallow: true })
    ory
      .updateRegistrationFlow({
        flow: String(initialFlow?.id),
        updateRegistrationFlowBody: values
      })
      .then(async ({ data }) => {
        await router.push(initialFlow?.return_to || "/")
      })
      .catch(handleFlowError(router, "registration", setInitialFlow))
      .catch((err: AxiosError) => {
        // If the previous handler did not catch the error it's most likely a form validation error
        if (err.response?.status === 400) {
          // Yup, it is!
          setInitialFlow(err.response?.data)
          return
        }

        return Promise.reject(err)
      })
  }

  const backToLoginQuery = new URLSearchParams({
    ...(returnTo ? { return_to: String(returnTo) } : {}),
    ...(loginChallenge ? { login_challenge: String(loginChallenge) } : {}),
  }).toString()
  const backToLoginHref = `/auth/login${backToLoginQuery ? `?${backToLoginQuery}` : ""}`


  return (
    <>
      <Head>
        <title>Registration</title>
        <meta name="description" content="NextJS + React + Vercel + Ory" />
      </Head>
      <div className="app-container">
        <KernLogo />
        <div id="signup">
          <h2 className="title">Register account</h2>
          <div>
            <Flow onSubmit={onSubmit} flow={changedFlow} only="password" />
            {oidcFlow ?
              <>
                <div className="divider-outer"><span className="divider">Or</span></div>
                <Flow onSubmit={onSubmit} flow={oidcFlow} only="oidc" />
              </> : null}
          </div>

          <div className="link-container">
            <a className="link" data-testid="forgot-password" href={backToLoginHref}>Go back to login</a>
          </div>
        </div>
      </div>
      <div className="img-container">
      </div>
    </>
  )
}

export default Registration
