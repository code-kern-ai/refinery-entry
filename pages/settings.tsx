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
import { useTranslation } from "react-i18next"

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
  const { t, i18n } = useTranslation('settings');
  const [language, setLanguage] = useState<string | undefined>(undefined);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showAuthenticator, setShowAuthenticator] = useState<boolean>(false);
  const [loadPage, setLoadPage] = useState<boolean>(false);

  useEffect(() => {
    const onLoad = () => {
      console.log('All elements including images and external resources are fully loaded.');
      setTimeout(() => { setLoadPage(true); }, 1000);
    };

    if (document.readyState === 'complete') {
      onLoad();
    } else {
      window.addEventListener('load', onLoad);
      return () => window.removeEventListener('load', onLoad);
    }
  }, []);
  // useEffect(() => {
  //   if (loadPage) return;
  //   setTimeout(() => {
  //     setLoadPage(true);
  //   }, 1000);
  // }, [loadPage]);

  useEffect(() => {
    getUserInfoExtended((res) => {
      setUser(res);
      if (res) {
        if (res?.organizationId) {
          if (WebSocketsService.getConnectionOpened()) return;
          WebSocketsService.setConnectionOpened(true);
          WebSocketsService.initWsNotifications();
        }
        setLanguage(res?.languageDisplay);
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
    if (!language) return;
    i18n.changeLanguage(language);
  }, [language, i18n]);

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
    setTimeout(() => {
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
    }, 100);
  }, [initialFlow])

  useEffect(() => {
    if (!changedFlow || !initialFlow || !loadPage) return;
    setTimeout(() => {
      const firstNameButtonVal = (document.querySelector('input[name="traits.name.first"]') as HTMLInputElement)?.value;
      const lastNameButtonVal = (document.querySelector('input[name="traits.name.last"]') as HTMLInputElement)?.value;
      if (isOidc && isOidcInvitation) {
        if ((firstNameButtonVal === "" || lastNameButtonVal === "" || firstNameButtonVal === undefined || lastNameButtonVal === undefined) && flowId) {
          setBackButtonDisabled(true);
        } else {
          setBackButtonDisabled(false);
        }
      } else {
        const emailButtonVal = (document.querySelector('input[name="traits.email"]') as HTMLInputElement)?.value;
        const passwordButtonVal = (document.querySelector('input[name="password"]') as HTMLInputElement)?.value;
        if (firstNameButtonVal !== "" && lastNameButtonVal !== "" && firstNameButtonVal !== undefined && lastNameButtonVal !== undefined) {
          setShowPassword(true);
          document.querySelector('button[value="profile"]')?.setAttribute("class", "hidden");
        }
        if (firstNameButtonVal !== "" && lastNameButtonVal !== "" && passwordButtonVal !== "" && passwordButtonVal !== undefined) {
          setShowAuthenticator(true);
        }

        if ((firstNameButtonVal === "" || lastNameButtonVal === "" || emailButtonVal === "" || passwordButtonVal === "" || firstNameButtonVal === undefined || lastNameButtonVal === undefined || emailButtonVal === undefined || passwordButtonVal === undefined) && flowId) {
          setBackButtonDisabled(true);
        } else {
          setBackButtonDisabled(false);
        }
      }
    }, 0); // Wait for the page to load
  }, [isOidc, isOidcInvitation, initialFlow, changedFlow, loadPage]);

  useEffect(() => {
    if (!changedFlow) return;
    if (changedFlow.ui.messages) {
      const messagesCopy = [...initialFlow.ui.messages];
      const messagesMapped = messagesCopy.map((message: any) => {
        if (flowId) {
          if (message.id === 1060001 && isOidc && isOidcInvitation) {
            return { ...message, id: 1060001 + 'a' };
          }
          if (message.id === 1050001 && showPassword) {
            return { ...message, id: 1050001 + 'a' };
          }
          if (message.id === 1060001 && !isOidc && !isOidcInvitation) {
            return { ...message, id: 1060001 + 'b' };

          }
        }
        return message;
      });
      setMessages(messagesMapped);
    }
  }, [changedFlow, isOidc, isOidcInvitation, showPassword, flowId, isOidc])

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

  useEffect(() => {
    if (backButtonDisabled || !changedFlow || !changedFlow.ui.messages || !flowId) return;
    const messagesCopy = [...changedFlow.ui.messages];
    const messagesMapped = messagesCopy.map((message: any) => {
      if (message.id === 1050001 && !isOidc) {
        return { ...message, id: 1050001 + 'ab' };
      }
      return message;
    });
    console.log(messagesMapped);
    setMessages(messagesMapped);
  }, [backButtonDisabled, changedFlow, flowId, isOidc]);


  return (
    <>
      <Head>
        <title>
          {t('title')}
        </title>
        <meta name="description" content="NextJS + React + Vercel + Ory" />
      </Head>
      <div className="app-container">
        <KernLogo />
        {(language && loadPage) && <div id="settings">
          <h2 className="title">{t('heading')}</h2>
          <div className="form-container">
            <Messages messages={messages} />
            <h3 className="subtitle">{t('subtitle')}</h3>
            <Flow
              hideGlobalMessages
              onSubmit={onSubmit}
              only="profile"
              flow={changedFlow}
            />
          </div>

          {!isOidc && <>
            {((flowId && showPassword) || !flowId) && (
              <div className="form-container">
                <h3 className="subtitle">{!flowId ? t('changePassword') : t('setPassword')}</h3>
                <Flow
                  hideGlobalMessages
                  onSubmit={onSubmit}
                  only="password"
                  flow={changedFlow}
                />
              </div>
            )}
          </>}

          {showAuthenticator && <>
            {containsBackupCodes ? (<div className="form-container">
              <h3 className="subtitle">{t('backUpCodes')}</h3>
              <p>{t('backUpCodesDescription')}</p>
              <Flow
                hideGlobalMessages
                onSubmit={onSubmit}
                only="lookup_secret"
                flow={changedFlow}
              />
            </div>) : (<> </>)}

            {containsTotp ? (<div className="form-container">
              <h3 className="subtitle">{t('totpAuthenticator')}</h3>
              <p>{t('addTotpAuthenticator')}
                {t('popularAuthenticatorApps')} <a href="https://www.lastpass.com" target="_blank">LastPass</a>{t('and')} Google
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
          </>}

          {(isOidc && isOidcInvitation) ? (<div className="form-container">
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
            }}>{t('back')}</button>
          </div>
        </div>}
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
