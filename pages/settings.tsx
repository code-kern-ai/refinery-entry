import { SettingsFlow, UpdateSettingsFlowBody } from "@ory/client"
import { CardTitle, H3, P } from "@ory/themes"
import { AxiosError } from "axios"
import type { NextPage } from "next"
import Head from "next/head"
import Link from "next/link"
import { useRouter } from "next/router"
import { ReactNode, useEffect, useState } from "react"

import { ActionCard, CenterLink, Flow, Messages, Methods } from "../pkg"
import { handleFlowError } from "../pkg/errors"
import ory from "../pkg/sdk"
import { KernLogo } from "@/pkg/ui/Icons"
import { firstName, lastName } from "@/util/constants"

interface Props {
  flow?: SettingsFlow
  only?: Methods
}

function SettingsCard({
  flow,
  only,
  children,
}: Props & { children: ReactNode }) {
  if (!flow) {
    return null
  }

  const nodes = only
    ? flow.ui.nodes.filter(({ group }) => group === only)
    : flow.ui.nodes

  if (nodes.length === 0) {
    return null
  }

  return <ActionCard wide>{children}</ActionCard>
}

const Settings: NextPage = () => {
  const [initialFlow, setInitialFlow] = useState<SettingsFlow>()
  const [changedFlow, setChangedFlow] = useState<SettingsFlow>()

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
        .getSettingsFlow({ id: String(flowId) })
        .then(({ data }) => {
          setInitialFlow(data)
        })
        .catch(handleFlowError(router, "settings", setInitialFlow))
      return
    }

    // Otherwise we initialize it
    ory
      .createBrowserSettingsFlow({
        returnTo: returnTo ? String(returnTo) : undefined,
      })
      .then(({ data }) => {
        setInitialFlow(data)
      })
      .catch(handleFlowError(router, "settings", setInitialFlow))
  }, [flowId, router, router.isReady, returnTo, initialFlow])

  useEffect(() => {
    if (!initialFlow) return;
    if (initialFlow.ui.nodes[1].meta.label) {
      initialFlow.ui.nodes[1].meta.label.text = "Email address";
    }
    setChangedFlow(initialFlow)
  }, [initialFlow])

  const onSubmit = (values: UpdateSettingsFlowBody) =>
    router
      // On submission, add the flow ID to the URL but do not navigate. This prevents the user loosing
      // his data when she/he reloads the page.
      .push(`/settings?flow=${initialFlow?.id}`, undefined, { shallow: true })
      .then(() =>
        ory
          .updateSettingsFlow({
            flow: String(initialFlow?.id),
            updateSettingsFlowBody: values,
          })
          .then(({ data }) => {
            // The settings have been saved and the flow was updated. Let's show it to the user!
            setInitialFlow(data)

            // continue_with is a list of actions that the user might need to take before the settings update is complete.
            // It could, for example, contain a link to the verification form.
            if (data.continue_with) {
              let item: any;
              for (item of data.continue_with) {
                switch (item.action) {
                  case "show_verification_ui":
                    router.push("/verification?flow=" + item.flow.id)
                    return
                }
              }
            }
          })
          .catch(handleFlowError(router, "settings", setInitialFlow))
          .catch(async (err: AxiosError) => {
            // If the previous handler did not catch the error it's most likely a form validation error
            if (err.response?.status === 400) {
              // Yup, it is!
              setInitialFlow(err.response?.data)
              return
            }

            return Promise.reject(err)
          }),
      )

  return (
    <>
      <Head>
        <title>
          Account settings
        </title>
        <meta name="description" content="NextJS + React + Vercel + Ory" />
      </Head>
      <div className="app-container">
        <KernLogo />
        <div id="settings">
          <h2 className="title">Profile management and security settings</h2>
          <div className="form-container">
            <h3 className="subtitle">Profile Settings</h3>
            <Messages messages={changedFlow?.ui.messages} />
            <Flow
              hideGlobalMessages
              onSubmit={onSubmit}
              only="profile"
              flow={changedFlow}
            />
          </div>

          <div className="form-container">
            <h3 className="subtitle">Change password</h3>
            <Messages messages={changedFlow?.ui.messages} />
            <Flow
              hideGlobalMessages
              onSubmit={onSubmit}
              only="password"
              flow={changedFlow}
            />
          </div>

          <div className="form-container">
            <h3 className="subtitle">Manage 2FA backup recovery codes</h3>
            <p>Recovery codes can be used in panic situations where you have lost access to your 2FA device.</p>
            <Messages messages={changedFlow?.ui.messages} />
            <Flow
              hideGlobalMessages
              onSubmit={onSubmit}
              only="lookup_secret"
              flow={changedFlow}
            />
          </div>

          <div className="form-container">
            <h3 className="subtitle">Manage 2FA TOTP Authenticator App</h3>
            <p>Add a TOTP Authenticator App to your account to improve your account security.
              Popular Authenticator Apps are <a href="https://www.lastpass.com" target="_blank">LastPass</a> and Google
              Authenticator (<a href="https://apps.apple.com/us/app/google-authenticator/id388497605"
                target="_blank">iOS</a>, <a
                  href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2&hl=en&gl=US"
                  target="_blank">Android</a>).
            </p>
            <Messages messages={changedFlow?.ui.messages} />
            <Flow
              hideGlobalMessages
              onSubmit={onSubmit}
              only="totp"
              flow={changedFlow}
            />
          </div>

          <div className="link-container">
            <a className="link" data-testid="forgot-password" href="/login">Back</a>
          </div>
        </div>
      </div>
      <div className="img-container">
      </div>
    </>
  )
}

export default Settings
