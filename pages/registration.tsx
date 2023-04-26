import { RegistrationFlow, UpdateRegistrationFlowBody } from "@ory/client"
import { CardTitle } from "@ory/themes"
import { AxiosError } from "axios"
import type { NextPage } from "next"
import Head from "next/head"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import Link from "next/link"
import { KernLogo } from "@/pkg/ui/Icons"
import { firstName, isFreeTrial, lastName } from "@/util/constants"
import ory from "@/pkg/sdk"
import { handleFlowError } from "@/pkg/errors"
import { Flow } from "@/pkg"

// Renders the registration page
const Registration: NextPage = () => {
  const router = useRouter()

  // The "flow" represents a registration process and contains
  // information about the form we need to render (e.g. username + password)
  const [initialFlow, setInitialFlow]: any = useState<RegistrationFlow>()

  // Get ?flow=... from the URL
  const { flow: flowId, return_to: returnTo } = router.query

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
    if (initialFlow.ui.nodes[3].attributes.name === "traits.name.first") {
      initialFlow.ui.nodes[3].attributes.required = true
    }
    if (initialFlow.ui.nodes[4].attributes.name === "traits.name.last") {
      initialFlow.ui.nodes[4].attributes.required = true
    }
    setInitialFlow(initialFlow);
  }, [initialFlow])

  const onSubmit = async (values: UpdateRegistrationFlowBody) => {
    await router
      // On submission, add the flow ID to the URL but do not navigate. This prevents the user loosing
      // his data when she/he reloads the page.
      .push(`/registration?flow=${initialFlow?.id}`, undefined, { shallow: true })

    ory
      .updateRegistrationFlow({
        flow: String(initialFlow?.id),
        updateRegistrationFlowBody: values,
      })
      .then(async ({ data }) => {
        // If we ended up here, it means we are successfully signed up!
        //
        // You can do cool stuff here, like having access to the identity which just signed up:
        console.log("This is the user session: ", data, data.identity)

        // continue_with is a list of actions that the user might need to take before the registration is complete.
        // It could, for example, contain a link to the verification form.
        if (data.continue_with) {
          let item: any;
          for (item of data.continue_with) {
            switch (item.action) {
              case "show_verification_ui":
                await router.push("/verify?flow=" + item.flow.id)
                return
            }
          }
        }

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
          <h2 className="title">{isFreeTrial ? 'Start your 14-day free trial' : 'Sign up for a local account'}</h2>
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
