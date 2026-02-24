import { Configuration, OAuth2Api } from '@ory/client'

const hydra = new OAuth2Api(
    new Configuration({
        basePath: 'http://hydra:4445',
        baseOptions: {
            // mode: 'no-cors',
            withCredentials: true,
        },
    }),
)

// const hydra = new OAuth2Api(
//     new Configuration({
//         basePath: '/.ory/hydra/public',
//         baseOptions: {
//             // mode: 'no-cors',
//             withCredentials: true,
//         },
//     }),
// )

export default hydra
