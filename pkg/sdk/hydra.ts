import { Configuration, OAuth2Api } from '@ory/client'

const hydra = new OAuth2Api(
    new Configuration({
        basePath: '/.ory/hydra/admin/',
        baseOptions: {
            // mode: 'no-cors',
            withCredentials: true,
        },
    }),
)

export default hydra
