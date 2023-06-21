import { SettingsFlow, UiNode, UpdateSettingsFlowBody } from "@ory/client"
import { AxiosError } from "axios"
import type { NextPage } from "next"
import Head from "next/head"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"

import { Flow, Messages } from "../pkg"
import { handleFlowError } from "../pkg/errors"
import ory from "../pkg/sdk"
import { KernLogo } from "@/pkg/ui/Icons"
import { prepareFirstLastNameAsRequired } from "@/util/helper-functions"

const Settings: NextPage = () => {
  const [initialFlow, setInitialFlow]: any = useState<SettingsFlow>()
  const [changedFlow, setChangedFlow]: any = useState<SettingsFlow>()
  const [containsTotp, setContainsTotp] = useState<boolean>(false)
  const [containsBackupCodes, setContainsBackupCodes] = useState<boolean>(false)

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
    initialFlow.ui.nodes = prepareFirstLastNameAsRequired(2, 3, initialFlow);
    const checkIfTotp = initialFlow.ui.nodes.find((node: UiNode) => node.group === "totp");
    const checkIfBackupCodes = initialFlow.ui.nodes.find((node: UiNode) => node.group === "lookup_secret");
    if (checkIfTotp) {
      setContainsTotp(true);
    }
    if (checkIfBackupCodes) {
      setContainsBackupCodes(true);
    }
    setChangedFlow(initialFlow)
  }, [initialFlow])

  const onSubmit = (values: UpdateSettingsFlowBody) =>
    ory
      .updateSettingsFlow({
        flow: String(initialFlow?.id),
        updateSettingsFlowBody: values,
      })
      .then(() =>
        ory
          .updateSettingsFlow({
            flow: String(initialFlow?.id),
            updateSettingsFlowBody: values,
          })
          .then(({ data }) => {
            // The settings have been saved and the flow was updated. Let's show it to the user!
            setInitialFlow(data)
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

          {containsBackupCodes ? (<div className="form-container">
            <h3 className="subtitle">Manage 2FA backup recovery codes</h3>
            <p>Recovery codes can be used in panic situations where you have lost access to your 2FA device.</p>
            <Messages messages={changedFlow?.ui.messages} />
            <Flow
              hideGlobalMessages
              onSubmit={onSubmit}
              only="lookup_secret"
              flow={changedFlow}
            />
          </div>) : (<> </>)}

          {containsTotp ? (<div className="form-container">
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
          </div>) : (<> </>)}

          <div className="link-container">
            <a className="link" data-testid="forgot-password" href="/welcome">Back</a>
          </div>
        </div>
      </div>
      <div className="img-container">
      </div>
    </>
  )
}

export default Settings
