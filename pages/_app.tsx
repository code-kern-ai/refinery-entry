import i18n from "@/i18n/i18n";
import "../styles/tailwind.css"
import '@/submodules/tailwind-config/global.css';
import { theme, globalStyles, ThemeProps } from "@ory/themes"
import type { AppProps } from "next/app"
import Head from "next/head"
import { I18nextProvider } from "react-i18next";
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { ThemeProvider } from "styled-components"
import { createGlobalStyle } from "styled-components"

const GlobalStyle = createGlobalStyle((props: ThemeProps) =>
  globalStyles(props),
)

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <I18nextProvider i18n={i18n}>
      <Head>
        <title>kern</title>
        <link rel="icon" type="image/x-icon"
          href="https://uploads-ssl.webflow.com/61e47fafb12bd56b40022a49/62349d6d1d8f3f519b8fad79_kern-favicon.png"></link>
      </Head>
      <div>
        <ThemeProvider theme={theme}>
          <GlobalStyle />
          <Component {...pageProps} />
          <ToastContainer />
        </ThemeProvider>
      </div>
    </I18nextProvider>

  )
}

export default MyApp
