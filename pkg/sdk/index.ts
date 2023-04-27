import { Configuration } from '@ory/kratos-client';
import { FrontendApi } from '@ory/client';

const ory = new FrontendApi(
    new Configuration({
        basePath: '/.ory/kratos/public/',
        baseOptions: {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            mode: 'no-cors',
            withCredentials: true,
        }
    })
);

export default ory;
