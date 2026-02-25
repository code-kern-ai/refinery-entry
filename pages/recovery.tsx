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
  const { flow: flowId, invite } = router.query
  const isInvite = invite === "true"

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
            returnTo: isInvite ? "/set-password?invite=true" : undefined,
          })
          data = res.data
        }

        data.ui.nodes.forEach((node) => {
          const attrs = node.attributes as { name?: string }
          if (attrs.name === "code") {
            node.meta.label = {
              text: isInvite ? "Enter the code from your email" : "Enter your recovery code",
              id: 0,
              type: "info",
            }
          }
          if (attrs.name === "email") {
            node.meta.label = { text: "Your email address", id: 0, type: "info" }
          }
        })

        setFlow(data)
      } catch (err: any) {
        handleFlowError(router, "recovery", setFlow)(err)
      }
    }

    fetchFlow()
  }, [router.isReady, flowId, isInvite])

  const onSubmit = (values: UpdateRecoveryFlowBody) =>
    router
      .push(`${router.pathname}?flow=${flow?.id}${isInvite ? "&invite=true" : ""}`, undefined, {
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
            if (data.state === "passed_challenge") {
              router.push(isInvite ? "/set-password?invite=true" : "/")
            }
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
        <title>{isInvite ? "Accept Invitation" : "Recover Account"}</title>
      </Head>

      <div className="app-container">
        <KernLogo />

        <div id="verification">
          <h2 className="title">
            {isInvite ? "Accept Your Invitation" : "Recover your account"}
          </h2>

          <Flow onSubmit={onSubmit} flow={flow} />

          {!isInvite && (
            <div className="link-container">
              <a className="link" href="/auth/login">
                Go back to login
              </a>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default Recovery