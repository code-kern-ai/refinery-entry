// pages/api/consent/accept.ts
import hydra from '@/pkg/sdk/hydra'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).end()
    const { challenge, grant_scope, grant_access_token_audience, remember, remember_for, session } = req.body
    try {
        const { data } = await hydra.acceptOAuth2ConsentRequest({
            consentChallenge: challenge,
            acceptOAuth2ConsentRequest: {
                grant_scope,
                grant_access_token_audience,
                remember,
                remember_for,
                session,
            },
        })
        return res.json({ redirect_to: data.redirect_to })
    } catch (err: unknown) {
        const e = err as { response?: { data?: unknown }; message?: string }
        console.error(e?.response?.data ?? e?.message)
        return res.status(500).json({ error: 'failed to accept consent request' })
    }
}