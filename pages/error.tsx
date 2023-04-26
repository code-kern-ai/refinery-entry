import { FlowError } from "@ory/client"
import { CardTitle, CodeBox } from "@ory/themes"
import { AxiosError } from "axios"
import type { NextPage } from "next"
import Link from "next/link"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"

import { ActionCard, CenterLink, MarginCard } from "../pkg"
import ory from "../pkg/sdk"
import { KernLogo } from "@/pkg/ui/Icons"

const Login: NextPage = () => {
  const [error, setError] = useState<FlowError | string>()

  // Get ?id=... from the URL
  const router = useRouter()
  const { id } = router.query

  useEffect(() => {
    // If the router is not ready yet, or we already have an error, do nothing.
    if (!router.isReady || error) {
      return
    }

    ory
      .getFlowError({ id: String(id) })
      .then(({ data }) => {
        setError(data)
      })
      .catch((err: AxiosError) => {
        switch (err.response?.status) {
          case 404:
          // The error id could not be found. Let's just redirect home!
          case 403:
          // The error id could not be fetched due to e.g. a CSRF issue. Let's just redirect home!
          case 410:
            // The error id expired. Let's just redirect home!
            return router.push("/welcome")
        }

        return Promise.reject(err)
      })
  }, [id, router, router.isReady, error])

  if (!error) {
    return null
  }

  return (
    <>
      <div className="app-container">
        <KernLogo />
        <div id="error">
          <h2 className="title">An error occurred</h2>
          <div className="link-container">
            <a className="link" data-testid="back-button" href="/auth/login">Go back to login</a>
          </div>
        </div>
      </div>
      <div className="img-container">
      </div>
    </>
  )
}

export default Error
