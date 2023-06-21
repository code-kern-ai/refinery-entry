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
import { MiscInfo } from "@/services/basic-fetch/misc"
import { prepareFirstLastNameAsRequired } from "@/util/helper-functions"

// Renders the registration page
const Registration: NextPage = () => {
  const router = useRouter()

  // The "flow" represents a registration process and contains
  // information about the form we need to render (e.g. username + password)
  const [initialFlow, setInitialFlow]: any = useState<RegistrationFlow>()

  // Get ?flow=... from the URL
  const { flow: flowId, return_to: returnTo } = router.query;

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
      })
      .then(({ data }) => {
        setInitialFlow(data)
      })
      .catch(handleFlowError(router, "registration", setInitialFlow))
  }, [flowId, router, router.isReady, returnTo, initialFlow])

  useEffect(() => {
    if (!initialFlow) return;
    if (initialFlow.ui.nodes[1].meta.label) {
      initialFlow.ui.nodes[1].meta.label.text = "Email address"
    }
    initialFlow.ui.nodes = prepareFirstLastNameAsRequired(3, 4, initialFlow);
    setInitialFlow(initialFlow);
  }, [initialFlow])

  const onSubmit = async (values: UpdateRegistrationFlowBody) => {
    ory
      .updateRegistrationFlow({
        flow: String(initialFlow?.id),
        updateRegistrationFlowBody: values,
      })
      .then(async ({ data }) => {
        // If continue_with did not contain anything, we can just return to the home page.
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

  return (
    <>
      <Head>
        <title>Registration</title>
        <meta name="description" content="NextJS + React + Vercel + Ory" />
      </Head>
      <div className="app-container">
        <KernLogo />
        <div id="signup">
          <h2 className="title">{MiscInfo.isManaged ? 'Start your 14-day free trial' : 'Sign up for a local account'}</h2>
          <Flow onSubmit={onSubmit} flow={initialFlow} />
          <div className="link-container">
            <a className="link" data-testid="forgot-password" href="/auth/login">Go back to login</a>
          </div>
        </div>
      </div>
      <div className="img-container">
      </div>
    </>
  )
}

export default Registration
