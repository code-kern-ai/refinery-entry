import { Configuration } from '@ory/kratos-client';
import { Configuration as OryConfiguration, FrontendApi, OAuth2Api } from '@ory/client';

const ory = new FrontendApi(
    new Configuration({
        basePath: '/.ory/kratos/public/',
        baseOptions: {
            // mode: 'no-cors',
            withCredentials: true,
        }
    })
);

/**
 * Hydra OAuth2 admin SDK. Requests go to `/.ory/hydra` + `/admin/oauth2/...` (same origin as the app).
 * The gateway must reverse-proxy that prefix to Hydra admin (e.g. dev-setup/template/access-rules.yml); use a
 * rewrite / transparent proxy — not an HTTP redirect to :4445 — or the browser will hit CORS.
 */
export const hydraOAuth2 = new OAuth2Api(
    new OryConfiguration({
        basePath: '/.ory/hydra',
        baseOptions: {
            withCredentials: true,
        },
    }),
);

export default ory;
