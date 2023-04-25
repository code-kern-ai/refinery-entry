import { Configuration } from '@ory/kratos-client';
import { edgeConfig } from "@ory/integrations/next"
import { FrontendApi } from '@ory/client';


const ory = new FrontendApi(
    new Configuration({
        basePath: "http://localhost:4455/.ory/kratos/public",
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

// export default ory;

export default new FrontendApi(new Configuration(edgeConfig))
