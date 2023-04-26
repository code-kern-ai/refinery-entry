// import { Card, CardTitle, P, H2, H3, CodeBox } from "@ory/themes"
// import { AxiosError } from "axios"
// import type { NextPage } from "next"
// import Head from "next/head"
// import { useRouter } from "next/router"
// import { useEffect, useState } from "react"

// import { DocsButton, MarginCard, LogoutLink } from "../pkg"
// import ory from "../pkg/sdk"


// const Home: NextPage = () => {
//   const [session, setSession] = useState<string>(
//     "No valid Ory Session was found.\nPlease sign in to receive one.",
//   )
//   const [hasSession, setHasSession] = useState<boolean>(false)
//   const router = useRouter()

//   useEffect(() => {

//     ory
//       .toSession()
//       .then(({ data }) => {
//         setSession(JSON.stringify(data, null, 2))
//         setHasSession(true)
//         return router.push("/")
//       })
//       .catch((err: AxiosError) => {
//         return router.push("/")
//         switch (err.response?.status) {
//           case 403:
//             // This is a legacy error code thrown. See code 422 for
//             // more details.
//             return router.push("/welcome")
//           case 422:
//             // This status code is returned when we are trying to
//             // validate a session which has not yet completed
//             // its second factor
//             return router.push("/welcome")
//           case 401:
//             // do nothing, the user is not logged in
//             return router.push("/welcome")
//         }

//         // Something else happened!
//         return Promise.reject(err)
//       })
//   }, [router])

//   return (<p>Hi</p>)
// }

// export default Home
