import { SettingsFlow, UiNode, UpdateSettingsFlowBody } from "@ory/client"
import { AxiosError } from "axios"
import type { NextPage } from "next"
import Head from "next/head"
import { useRouter } from "next/router"
import { useCallback, useEffect, useState } from "react"

import { Flow, Messages } from "../pkg"
import { handleFlowError } from "../pkg/errors"
import ory from "../pkg/sdk"
import { KernLogo } from "@/pkg/ui/Icons"
import { prepareNodes } from "@/util/helper-functions"
import { WebSocketsService } from "@/submodules/react-components/hooks/web-socket/WebSocketsService"
import { getAllActiveAdminMessages, getUserInfoExtended } from "@/util/data-fetch"
import { useWebsocket } from "@/submodules/react-components/hooks/web-socket/useWebsocket"
import { Application, CurrentPage } from "@/submodules/react-components/hooks/web-socket/constants"
import { AdminMessage } from "@/submodules/react-components/types/admin-messages"
import { postProcessAdminMessages } from "@/submodules/react-components/helpers/admin-messages-helper"
import AdminMessages from "@/submodules/react-components/components/AdminMessages"

const Settings: NextPage = () => {
  const [initialFlow, setInitialFlow]: any = useState<SettingsFlow>()
  const [changedFlow, setChangedFlow]: any = useState<SettingsFlow>()
  const [containsTotp, setContainsTotp] = useState<boolean>(false)
  const [containsBackupCodes, setContainsBackupCodes] = useState<boolean>(false)
  const [isOidc, setIsOidc] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [activeAdminMessages, setActiveAdminMessages] = useState<AdminMessage[]>([]);
  const [isOidcInvitation, setIsOidcInvitation] = useState(false);
  const [backButtonDisabled, setBackButtonDisabled] = useState(false);
  const [messages, setMessages] = useState<any>(null);
  // Get ?flow=... from the URL
  const router = useRouter()
  const { flow: flowId, return_to: returnTo } = router.query

  useEffect(() => {
    getUserInfoExtended((res) => {
      setUser(res);
      if (res) {
        if (res?.organizationId) {
          if (WebSocketsService.getConnectionOpened()) return;
          WebSocketsService.setConnectionOpened(true);
          WebSocketsService.initWsNotifications();
        }
      }
    });
  }, []);

  useEffect(() => {
    refetchAdminMessagesAndProcess();
  }, []);

  const handleWebsocketNotification = useCallback((msgParts: string[]) => {
    if (msgParts[1] == 'admin_message') {
      refetchAdminMessagesAndProcess();
    }
  }, []);

  function refetchAdminMessagesAndProcess() {
    getAllActiveAdminMessages((res) => setActiveAdminMessages(postProcessAdminMessages(res)));
  }

  useWebsocket(user?.organizationId, Application.ENTRY, CurrentPage.ENTRY_LAYOUT, handleWebsocketNotification)

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
    initialFlow.ui.nodes = prepareNodes(initialFlow);
    const checkIfTotp = initialFlow.ui.nodes.find((node: UiNode) => node.group === "totp");
    const checkIfBackupCodes = initialFlow.ui.nodes.find((node: UiNode) => node.group === "lookup_secret");
    if (checkIfTotp) {
      setContainsTotp(true);
    }
    if (checkIfBackupCodes) {
      setContainsBackupCodes(true);
    }
    setChangedFlow(initialFlow)

    //prevent password change option display if sso
    requestAnimationFrame(() => {
      if (["microsoft", "google"].includes(initialFlow.identity.metadata_public?.registration_scope?.provider_id)) {
        initialFlow.ui.nodes = initialFlow.ui.nodes.filter((node: UiNode) => node.group !== "password");
        setIsOidc(true);
        if (initialFlow.identity.metadata_public?.registration_scope?.invitation_sso) {
          setIsOidcInvitation(true);
        }
        const provider = initialFlow.identity.metadata_public?.registration_scope?.provider_id;
        if (provider === "google") {
          document.querySelector('button[value="Microsoft"]')?.setAttribute("class", "hidden");
        } else if (provider === "microsoft") {
          document.querySelector('button[value="Google"]')?.setAttribute("class", "hidden");
        }
      }
    });
  }, [initialFlow])

  useEffect(() => {
    if (!changedFlow || !initialFlow) return;
    const firstNameButtonVal = (document.querySelector('input[name="traits.name.first"]') as HTMLInputElement)?.value;
    const lastNameButtonVal = (document.querySelector('input[name="traits.name.last"]') as HTMLInputElement)?.value;
    if (isOidc && isOidcInvitation) {
      if (firstNameButtonVal === "" || lastNameButtonVal === "") {
        setBackButtonDisabled(true);
      } else {
        setBackButtonDisabled(false);
      }
    } else {
      const emailButtonVal = (document.querySelector('input[name="traits.email"]') as HTMLInputElement)?.value;
      const passwordButtonVal = (document.querySelector('input[name="password"]') as HTMLInputElement)?.value;
      if (firstNameButtonVal === "" || lastNameButtonVal === "" || emailButtonVal === "" || passwordButtonVal === "") {
        setBackButtonDisabled(true);
      } else {
        setBackButtonDisabled(false);
      }
    }
  }, [isOidc, isOidcInvitation, initialFlow, changedFlow]);

  useEffect(() => {
    if (!changedFlow) return;
    if (changedFlow.ui.messages) {
      setMessages(changedFlow.ui.messages);
    }
  }, [changedFlow])

  const onSubmit = (values: UpdateSettingsFlowBody) =>
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
      })
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
            <Messages messages={messages} />
            <h3 className="subtitle">Profile Settings</h3>
            <Flow
              hideGlobalMessages
              onSubmit={onSubmit}
              only="profile"
              flow={changedFlow}
            />
          </div>
          {!isOidc ?
            <div className="form-container">
              <h3 className="subtitle">{flowId ? 'Set' : 'Change'} password</h3>
              <Flow
                hideGlobalMessages
                onSubmit={onSubmit}
                only="password"
                flow={changedFlow}
              />
            </div> : null}

          {containsBackupCodes ? (<div className="form-container">
            <h3 className="subtitle">Manage 2FA backup recovery codes</h3>
            <p>Recovery codes can be used in panic situations where you have lost access to your 2FA device.</p>
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
            <Flow
              hideGlobalMessages
              onSubmit={onSubmit}
              only="totp"
              flow={changedFlow}
            />
          </div>) : (<> </>)}

          {isOidc && isOidcInvitation ? (<div className="form-container">
            <Flow
              hideGlobalMessages
              onSubmit={onSubmit}
              only="oidc"
              flow={changedFlow}
            />
          </div>) : (<> </>)}

          <div className="link-container">
            <button className="link disabled:opacity-50 disabled:cursor-not-allowed" data-testid="forgot-password" disabled={backButtonDisabled} onClick={() => {
              router.push("/cognition")
            }}>Back</button>
          </div>
        </div>
      </div>
      <div className="img-container">
      </div>
      <AdminMessages
        adminMessages={activeAdminMessages}
        setActiveAdminMessages={setActiveAdminMessages} />
    </>
  )
}

export default Settings
