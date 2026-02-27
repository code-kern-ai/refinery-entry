import { RecoveryFlow, UpdateRecoveryFlowBody } from "@ory/client"
import type { NextPage } from "next"
import Head from "next/head"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"

import { Flow } from "../pkg"
import { handleFlowError } from "../pkg/errors"
import ory from "../pkg/sdk"
import { KernLogo } from "@/pkg/ui/Icons"

const Recovery: NextPage = () => {
  const router = useRouter()
  const { flow: flowId, return_to: returnTo } = router.query

  const [flow, setFlow] = useState<RecoveryFlow>()

  useEffect(() => {
    if (!router.isReady) return

    const fetchFlow = async () => {
      try {
        let data: RecoveryFlow
        if (flowId) {
          const res = await ory.getRecoveryFlow({ id: String(flowId) })
          data = res.data
        } else {
          const res = await ory.createBrowserRecoveryFlow({
            returnTo: returnTo ? String(returnTo) : undefined,
          })
          data = res.data
        }

        data.ui.nodes.forEach((node) => {
          const attrs = node.attributes as { name?: string; value?: string; disabled?: boolean; type?: string; required?: boolean }
          if (attrs.name === "code") {
            node.meta.label = {
              text: "Enter your recovery code",
              id: 0,
              type: "info",
            }
            attrs.required = false
          }
          if (attrs.name === "email") {
            node.meta.label = { text: "Your email address", id: 0, type: "info" }
          }
          if (attrs.type === "button" || (attrs.name === "method" && attrs.value === "link")) {
            attrs.disabled = false
          }
        })

        setFlow(data)
      } catch (err: any) {
        handleFlowError(router, "recovery", setFlow)(err)
      }
    }

    fetchFlow()
  }, [router.isReady, flowId, returnTo])

  const onSubmit = (values: UpdateRecoveryFlowBody) =>
    router
      .push(`${router.pathname}?flow=${flow?.id}`, undefined, {
        shallow: true,
      })
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

  if (!flow) return null

  return (
    <>
      <Head>
        <title>Recovery</title>
      </Head>

      <div className="app-container">
        <KernLogo />
        <div id="recovery">
          <h2 className="title">
            Recover your account
          </h2>

          <Flow onSubmit={onSubmit} flow={flow} />

          <div className="link-container">
            <a className="link" href="/auth/login">
              Go back to login
            </a>
          </div>
        </div>
      </div>
      <div className="img-container">
      </div>
    </>
  )
}

export default Recovery