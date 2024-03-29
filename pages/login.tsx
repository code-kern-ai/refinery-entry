import { LoginFlow, UpdateLoginFlowBody } from "@ory/client"
import { AxiosError } from "axios"
import type { NextPage } from "next"
import Head from "next/head"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"

import { Flow } from "../pkg"
import { handleGetFlowError, handleFlowError } from "../pkg/errors"
import { KernLogo } from "@/pkg/ui/Icons"

import { DemoFlow } from "@/pkg/ui/DemoFlow"
import { getValueIdentifier, getValuePassword } from "@/util/helper-functions"
import ory from "@/pkg/sdk"
import { MiscInfo } from "@/services/basic-fetch/misc"

const Login: NextPage = () => {
  const [initialFlow, setInitialFlow] = useState<LoginFlow>()
  const [changedFlow, setChangedFlow] = useState<LoginFlow>()
  const [selectedRole, setSelectedRole] = useState<string | undefined>('engineer');

  // Get ?flow=... from the URL
  const router = useRouter()
  const {
    return_to: returnTo,
    flow: flowId,
    // Refresh means we want to refresh the session. This is needed, for example, when we want to update the password
    // of a user.
    refresh,
    // AAL = Authorization Assurance Level. This implies that we want to upgrade the AAL, meaning that we want
    // to perform two-factor authentication/verification.
    aal,
  } = router.query

  useEffect(() => {
    // If the router is not ready yet, or we already have a flow, do nothing.
    if (!router.isReady || initialFlow) {
      return
    }
    // If ?flow=.. was in the URL, we fetch it
    if (flowId) {
      ory
        .getLoginFlow({ id: String(flowId) })
        .then(({ data }) => {
          setInitialFlow(data)
        })
        .catch(handleGetFlowError(router, "login", setInitialFlow))
      return
    }
    // Otherwise we initialize it
    ory
      .createBrowserLoginFlow({
        refresh: Boolean(refresh),
        aal: aal ? String(aal) : undefined,
        returnTo: returnTo ? String(returnTo) : undefined,
      })
      .then(({ data }) => {
        setInitialFlow(data)
      })
      .catch(handleFlowError(router, "login", setInitialFlow))
  }, [flowId, router, router.isReady, aal, refresh, returnTo, initialFlow])

  useEffect(() => {
    if (!initialFlow) return;
    const data: any = { ...initialFlow };
    if (data.ui.nodes[1].meta.label) {
      data.ui.nodes[1].meta.label.text = "Email address"
      if (MiscInfo.isDemo) {
        data.ui.nodes[1].attributes.value = getValueIdentifier(selectedRole);
      }
    }
    if (data.ui.nodes[2].meta.label && MiscInfo.isDemo) {
      data.ui.nodes[2].attributes.value = getValuePassword(selectedRole);
    }
    if (data.ui.nodes[3].meta.label && MiscInfo.isDemo) {
      data.ui.nodes[3].meta.label.text = "Proceed"
    }
    setChangedFlow(data);
  }, [initialFlow, selectedRole])

  const onSubmit = (values: UpdateLoginFlowBody) =>
    ory
      .updateLoginFlow({
        flow: String(initialFlow?.id),
        updateLoginFlowBody: values,
      })
      // We logged in successfully! Let's bring the user home.
      .then(() => {
        if (initialFlow?.return_to) {
          window.location.href = initialFlow?.return_to
          return
        }
        if (MiscInfo.isManaged) {
          router.push("/welcome")
        } else {
          router.push("/refinery/projects")
        }

      })
      .then(() => { })
      .catch(handleFlowError(router, "login", setInitialFlow))
      .catch((err: AxiosError) => {
        // If the previous handler did not catch the error it's most likely a form validation error
        if (err.response?.status === 400) {
          // Yup, it is!
          setInitialFlow(err.response?.data as LoginFlow | undefined)
          return
        }

        return Promise.reject(err)
      })

  return (
    <>
      <Head>
        <title>kern</title>
        <meta name="description" content="NextJS + React + Vercel + Ory" />
      </Head>
      <div className="app-container">
        <KernLogo />
        <div id="login">
          <h2 className="title">{MiscInfo.isDemo ? 'Proceed with your selected role' : 'Sign in to your account'}</h2>
          {!MiscInfo.isDemo ? (
            <>{MiscInfo.isManaged ? (
              <p className="text-paragraph">Or
                <a className="link" data-testid="cta-link" href="/auth/registration"> Register account </a> -
                no credit card required!
              </p>
            ) : (<>
              <p className="text-paragraph">You don&apos;t have an account yet?
                <a className="link" data-testid="cta-link" href="/auth/registration"> Sign up here (local)</a>
              </p>
            </>)}</>
          ) : (<></>)}
          <div className="ui-container">
            {!MiscInfo.isDemo ? (<Flow onSubmit={onSubmit} flow={changedFlow} />) : (<>
              <fieldset>
                <span className="typography-h3">
                  Select role
                  <span className="required-indicator">*</span>
                  <select className="typography-h3 select" id="roles" value={selectedRole} onChange={(e: any) => { setSelectedRole(e.target.value); }}>
                    <option value="engineer">Engineer</option>
                    <option value="expert">Expert</option>
                    <option value="annotator">Annotator</option>
                  </select>
                </span>
              </fieldset>
              <p className="text-description" id="description">
                {selectedRole === 'engineer' ? 'Administers the project and works on programmatic tasks such as labeling automation or filter settings.' : selectedRole === 'expert' ? 'Working on reference manual labels, which can be used by the engineering team to estimate the data quality.' : 'Working on manual labels as if they were heuristics. They can be switched on/off by the engineering team, so that the engineers can in - or exclude them during weak supervision.'}
              </p>
              <p className="text-description" id="sub-description">
                {selectedRole === 'engineer' ? 'They have access to all features of the application, including the Python SDK.' : selectedRole === 'expert' ? 'They have access to the labeling view only.' : 'They have access to a task-minimized labeling view only. Engineers can revoke their access to the labeling view.'}
              </p>
              <DemoFlow onSubmit={onSubmit} flow={changedFlow} />
            </>)}
          </div>
          <div className="link-container">
            {!MiscInfo.isDemo ? (<a className="link" data-testid="forgot-password" href="/auth/recovery">Forgot your password?</a>) : (<></>)}
          </div>
        </div>
      </div >
      <div className="img-container">
      </div>
    </>
  )
}

export default Login
