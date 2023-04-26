import { VerificationFlow, UpdateVerificationFlowBody } from "@ory/client"
import { CardTitle } from "@ory/themes"
import { AxiosError } from "axios"
import type { NextPage } from "next"
import Head from "next/head"
import Link from "next/link"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"

import { Flow, ActionCard, CenterLink, MarginCard } from "../pkg"
import ory from "../pkg/sdk"
import { KernLogo } from "@/pkg/ui/Icons"

const Verification: NextPage = () => {
  const [initialFlow, setInitialFlow] = useState<VerificationFlow>()
  const [changedFlow, setChangedFlow] = useState<VerificationFlow>()

  // Get ?flow=... from the URL
  const router = useRouter()
  const { flow: flowId, return_to: returnTo } = router.query

  useEffect(() => {
    // If the router is not ready yet, or we already have a flow, do nothing.
    if (!router.isReady || initialFlow) {
      return
    }

    // If ?flow=.. was in the URL, we fetch it
    if (flowId) {
      ory
        .getVerificationFlow({ id: String(flowId) })
        .then(({ data }) => {
          setInitialFlow(data)
        })
        .catch((err: AxiosError) => {
          switch (err.response?.status) {
            case 410:
            // Status code 410 means the request has expired - so let's load a fresh flow!
            case 403:
              // Status code 403 implies some other issue (e.g. CSRF) - let's reload!
              return router.push("/verify")
          }

          throw err
        })
      return
    }

    // Otherwise we initialize it
    ory
      .createBrowserVerificationFlow({
        returnTo: returnTo ? String(returnTo) : undefined,
      })
      .then(({ data }) => {
        setInitialFlow(data)
      })
      .catch((err: AxiosError) => {
        switch (err.response?.status) {
          case 400:
            // Status code 400 implies the user is already signed in
            return router.push("/")
        }

        throw err
      })
  }, [flowId, router, router.isReady, returnTo, initialFlow])

  useEffect(() => {
    if (!initialFlow) return
    initialFlow.ui.nodes[1].meta.label = { text: "Email address", id: 0, type: "info" }
    setChangedFlow(initialFlow)
  }, [initialFlow])

  const onSubmit = async (values: UpdateVerificationFlowBody) => {
    await router
      // On submission, add the flow ID to the URL but do not navigate. This prevents the user loosing
      // their data when they reload the page.
      .push(`/verify?flow=${initialFlow?.id}`, undefined, { shallow: true })

    ory
      .updateVerificationFlow({
        flow: String(initialFlow?.id),
        updateVerificationFlowBody: values,
      })
      .then(({ data }) => {
        // Form submission was successful, show the message to the user!
        setInitialFlow(data)
      })
      .catch((err: AxiosError) => {
        switch (err.response?.status) {
          case 400:
            // Status code 400 implies the form validation had an error
            setInitialFlow(err.response?.data)
            return
          case 410:
            const newFlowID = err.response.data.use_flow_id
            router
              // On submission, add the flow ID to the URL but do not navigate. This prevents the user loosing
              // their data when they reload the page.
              .push(`/verify?flow=${newFlowID}`, undefined, {
                shallow: true,
              })

            ory
              .getVerificationFlow({ id: newFlowID })
              .then(({ data }) => setInitialFlow(data))
            return
        }

        throw err
      })
  }

  return (
    <>
      <Head>
        <title>Verification</title>
        <meta name="description" content="NextJS + React + Vercel + Ory" />
      </Head>
      <div className="app-container">
        <KernLogo />
        <div id="verification">
          <h2 className="title">Verify your account</h2>
          <Flow onSubmit={onSubmit} flow={changedFlow} />
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

export default Verification
