import { AxiosError } from "axios"
import { NextRouter } from "next/router"
import { Dispatch, SetStateAction } from "react"
import { toast } from "react-toastify"

function handleAal2Error(jsonResponse: any, router: NextRouter,) {
  if (jsonResponse.error?.id === "session_aal2_required") {
    window.location.href = "/auth/login?aal=aal2"
  }
  else {
    router.push("/welcome")
  }
}

// A small function to help us deal with errors coming from fetching a flow.
export function handleGetFlowError<S>(
  router: NextRouter,
  flowType: "login" | "registration" | "settings" | "recovery" | "verification",
  resetFlow: Dispatch<SetStateAction<S | undefined>>,
) {
  return async (err: AxiosError) => {
    switch ((err.response?.data as any).error?.id) {
      case "session_aal2_required":
        // 2FA is enabled and enforced, but user did not perform 2fa yet!
        window.location.href = (err.response?.data as any).redirect_browser_to
        return
      case "session_already_available":
        await fetch('/.ory/kratos/public/sessions/whoami')
          .then(response => response.json())
          .then((jsonResponse) => handleAal2Error(jsonResponse, router))
          .catch(() => { router.push("/welcome") });
        return
      case "session_refresh_required":
        // We need to re-authenticate to perform this action
        window.location.href = (err.response?.data as any).redirect_browser_to
        return
      case "self_service_flow_return_to_forbidden":
        // The flow expired, let's request a new one.
        toast.error("The return_to address is not allowed.")
        resetFlow(undefined)
        await router.push("/welcome" + flowType)
        return
      case "self_service_flow_expired":
        // The flow expired, let's request a new one.
        toast.error("Your interaction expired, please fill out the form again.")
        resetFlow(undefined)
        await router.push("/welcome" + flowType)
        return
      case "security_csrf_violation":
        // A CSRF violation occurred. Best to just refresh the flow!
        toast.error(
          "A security violation was detected, please fill out the form again.",
        )
        resetFlow(undefined)
        await router.push("/auth/" + flowType)
        return
      case "security_identity_mismatch":
        // The requested item was intended for someone else. Let's request a new flow...
        resetFlow(undefined)
        await router.push("/welcome" + flowType)
        return
      case "browser_location_change_required":
        // Ory Kratos asked us to point the user to this URL.
        window.location.href = (err.response?.data as any).redirect_browser_to
        return
    }

    switch (err.response?.status) {
      case 410:
        // The flow expired, let's request a new one.
        resetFlow(undefined)
        await router.push("/welcome" + flowType)
        return
    }

    // We are not able to handle the error? Return it.
    return Promise.reject(err)
  }
}

// A small function to help us deal with errors coming from initializing a flow.
export const handleFlowError = handleGetFlowError
