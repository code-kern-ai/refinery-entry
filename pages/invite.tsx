import { RecoveryFlow, UpdateRecoveryFlowBody } from "@ory/client"
import type { NextPage } from "next"
import Head from "next/head"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"

import { Flow } from "../pkg"
import { handleFlowError } from "../pkg/errors"
import ory from "../pkg/sdk"
import { KernLogo } from "@/pkg/ui/Icons"

const InvitePage: NextPage = () => {
  const router = useRouter()
  const { flow: flowId } = router.query

  const [flow, setFlow] = useState<RecoveryFlow | null>(null)

  useEffect(() => {
    if (!router.isReady || !flowId) return
    ory
      .getRecoveryFlow({ id: String(flowId) })
      .then(({ data }) => {
        data.ui.nodes.forEach((node) => {
          const attrs = node.attributes as { name?: string }
          if (attrs.name === "code") {
            node.meta.label = { text: "Enter the code from your email", id: 0, type: "info" }
          }
          if (attrs.name === "email") {
            node.meta.label = { text: "Your email address", id: 0, type: "info" }
          }
        })
        setFlow(data)
      })
      .catch((err) => handleFlowError(router, "recovery", setFlow)(err))
  }, [router.isReady, flowId])

  const onSubmit = (values: UpdateRecoveryFlowBody) => {
    if (!flow?.id) return
    return router
      .push(`/invite?flow=${flow?.id}`, undefined, { shallow: true })
      .then(() =>
        ory
          .updateRecoveryFlow({
            flow: String(flow?.id),
            updateRecoveryFlowBody: values,
          })
          .then(({ data }) => {
            setFlow(data)
          })
          .catch(handleFlowError(router, "recovery", setFlow))
          .catch((err: any) => {
            if (err.response?.status === 400) {
              setFlow(err.response?.data)
              return
            }
            throw err
          })
      )
  }

  if (!flow) return null

  return (
    <>
      <Head>
        <title>Accept Invitation</title>
      </Head>

      <div className="app-container">
        <KernLogo />
        <div id="invite">
          <h2 className="title">Accept Your Invitation</h2>

          <Flow onSubmit={onSubmit} flow={flow} />
        </div>
      </div>
      <div className="img-container">
      </div>
    </>
  )
}

export default InvitePage