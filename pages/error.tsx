import type { NextPage } from "next"
import Head from "next/head"
import { KernLogo } from "@/pkg/ui/Icons"

const ErrorPage: NextPage = () => {

    return (
        <>
            <Head>
                <title>Error</title>
            </Head>

            <div className="app-container">
                <KernLogo />
                <div id="invite">
                    <h2 className="title">An error occurred</h2>

                    <p>Please contact support if the problem persists.</p>
                </div>
            </div>
            <div className="img-container">
            </div>
        </>
    )
}

export default ErrorPage