import { UserManagerWrapper } from "@/util/UserManaged"
import "../styles/globals.css"
import { theme, globalStyles, ThemeProps } from "@ory/themes"
import type { AppProps } from "next/app"
import Head from "next/head"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { ThemeProvider } from "styled-components"
import { createGlobalStyle } from "styled-components"

const GlobalStyle = createGlobalStyle((props: ThemeProps) =>
  globalStyles(props),
)

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>kern</title>
        <link rel="icon" type="image/x-icon"
          href="https://uploads-ssl.webflow.com/61e47fafb12bd56b40022a49/62349d6d1d8f3f519b8fad79_kern-favicon.png"></link>
      </Head>
      <div data-testid="app-react">
        <ThemeProvider theme={theme}>
          <GlobalStyle />
          <UserManagerWrapper>
            <Component {...pageProps} />
          </UserManagerWrapper>
          <ToastContainer />
        </ThemeProvider>
      </div>
    </>

  )
}

export default MyApp
