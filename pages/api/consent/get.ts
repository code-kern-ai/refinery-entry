// pages/api/consent/get.ts
import hydra from '@/pkg/sdk/hydra'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') return res.status(405).end()
    const { challenge } = req.query
    if (!challenge) return res.status(400).json({ error: 'missing challenge' })
    try {
        const { data } = await hydra.getOAuth2ConsentRequest({ consentChallenge: String(challenge) })
        return res.json(data)
    } catch (err: unknown) {
        const e = err as { response?: { data?: unknown }; message?: string }
        console.error(e?.response?.data ?? e?.message)
        return res.status(500).json({ error: 'failed to get consent request' })
    }
}