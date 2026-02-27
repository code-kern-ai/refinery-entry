import { VerificationFlow, UpdateVerificationFlowBody } from "@ory/client"
import type { NextPage } from "next"
import Head from "next/head"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"

import { Flow } from "../pkg"
import { handleFlowError } from "../pkg/errors"
import ory from "../pkg/sdk"
import { KernLogo } from "@/pkg/ui/Icons"

const Verification: NextPage = () => {
  const router = useRouter()
  const { flow: flowId, state: flowState } = router.query

  const [flow, setFlow] = useState<VerificationFlow | null>(null)

  useEffect(() => {
    if (!router.isReady) return
    if (!flowId) {
      router.replace("/error")
      return
    }
    ory
      .getVerificationFlow({ id: String(flowId) })
      .then(({ data }) => {
        if (flowState === "success") {
          const returnTo = (data as VerificationFlow & { return_to?: string }).return_to
          window.location.href = returnTo || "/cognition"
          return
        }
        data.ui.nodes.forEach((node) => {
          const attrs = node.attributes as { name?: string; value?: string }
          if (attrs.name === "code") {
            node.meta.label = { text: "Enter the code from your email", id: 0, type: "info" }
            attrs.value = ""
          }
        })
        setFlow(data)
      })
      .catch((err) => handleFlowError(router, "verification", setFlow)(err))
  }, [router.isReady, flowId, flowState])

  const onSubmit = (values: UpdateVerificationFlowBody) =>
    router
      .push(`${router.pathname}?flow=${flow?.id}`, undefined, {
        shallow: true,
      })
      .then(() =>
        ory
          .updateVerificationFlow({
            flow: String(flow?.id),
            updateVerificationFlowBody: values,
          })
          .then(({ data }) => {
            const returnTo = (data as VerificationFlow & { return_to?: string }).return_to
            window.location.href = returnTo || "/cognition"
          })
          .catch((err: any) => {
            if (err.response?.data?.error?.id === "browser_location_change_required") {
              window.location.href = "/cognition"
              return
            }
            return handleFlowError(router, "verification", setFlow)(err)
          })
          .catch((err: any) => {
            if (err.response?.status === 400) {
              setFlow(err.response?.data)
              return
            }
            throw err
          })
      )

  if (!flow) return null

  return (
    <>
      <Head>
        <title>Verify</title>
      </Head>

      <div className="app-container">
        <KernLogo />
        <div id="verification">
          <h2 className="title">
            Verify your account
          </h2>

          <Flow onSubmit={onSubmit} flow={flow} />
        </div>
      </div>
      <div className="img-container">
      </div>
    </>
  )
}

export default Verification