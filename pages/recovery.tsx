import { RecoveryFlow, UpdateRecoveryFlowBody } from "@ory/client"
import { AxiosError } from "axios"
import type { NextPage } from "next"
import Head from "next/head"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"

import { Flow } from "../pkg"
import { handleFlowError } from "../pkg/errors"
import ory from "../pkg/sdk"
import { KernLogo } from "@/pkg/ui/Icons"

const Recovery: NextPage = () => {
  const [initialFlow, setInitialFlow]: any = useState<RecoveryFlow>()
  const [changedFlow, setChangedFlow] = useState<RecoveryFlow>()

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
        .getRecoveryFlow({ id: String(flowId) })
        .then(({ data }) => {
          setInitialFlow(data)
        })
        .catch(handleFlowError(router, "recovery", setInitialFlow))
      return
    }

    // Otherwise we initialize it
    ory
      .createBrowserRecoveryFlow()
      .then(({ data }) => {
        setInitialFlow(data)
      })
      .catch(handleFlowError(router, "recovery", setInitialFlow))
      .catch((err: AxiosError) => {
        // If the previous handler did not catch the error it's most likely a form validation error
        if (err.response?.status === 400) {
          // Yup, it is!
          setInitialFlow(err.response?.data)
          return
        }

        return Promise.reject(err)
      })
  }, [flowId, router, router.isReady, returnTo, initialFlow])

  useEffect(() => {
    if (!initialFlow) return
    initialFlow.ui.nodes[1].meta.label = { text: "Email address", id: 0, type: "info" }
    if (initialFlow.ui.nodes[2].meta.label) {
      initialFlow.ui.nodes[2].meta.label.text = "Send reset code to mail"
    }
    setChangedFlow(initialFlow)
  }, [initialFlow])

  const onSubmit = (values: UpdateRecoveryFlowBody) =>
    router
      // On submission, add the flow ID to the URL but do not navigate. This prevents the user loosing
      // his data when she/he reloads the page.
      .push(`/recovery?flow=${initialFlow?.id}`, undefined, { shallow: true })
      .then(() =>
        ory
          .updateRecoveryFlow({
            flow: String(initialFlow?.id),
            updateRecoveryFlowBody: values,
          })
          .then(({ data }) => {
            // Form submission was successful, show the message to the user!
            setInitialFlow(data)
          })
          .catch(handleFlowError(router, "recovery", setInitialFlow))
          .catch((err: AxiosError) => {
            switch (err.response?.status) {
              case 400:
                // Status code 400 implies the form validation had an error
                setInitialFlow(err.response?.data)
                return
            }

            throw err
          }),
      )

  return (
    <>
      <Head>
        <title>Recovery</title>
        <meta name="description" content="NextJS + React + Vercel + Ory" />
      </Head>
      <div className="app-container">
        <KernLogo />
        <div id="verification">
          <h2 className="title">Recover your account</h2>
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

export default Recovery
