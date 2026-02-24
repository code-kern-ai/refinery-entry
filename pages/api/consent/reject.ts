// pages/api/consent/reject.ts
import hydra from '@/pkg/sdk/hydra'
import ory from '@/pkg/sdk'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).end()
    const { challenge } = req.body
    hydra.rejectOAuth2ConsentRequest({
        consentChallenge: challenge,
        rejectOAuth2Request: {
            error: 'access_denied',
            error_description: 'The resource owner denied the request',
        },
    }).then(({ data }) => {
        return res.json({ redirect_to: data.redirect_to })
    }).catch((err: any) => {
        console.error(err?.response?.data ?? err.message)
        return res.status(500).json({ error: 'failed to reject consent request' })
    })
}