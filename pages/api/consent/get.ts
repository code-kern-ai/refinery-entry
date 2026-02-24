// pages/api/consent/get.ts
import hydra from '@/pkg/sdk/hydra'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') return res.status(405).end()
    const { challenge } = req.query
    if (!challenge) return res.status(400).json({ error: 'missing challenge' })
    hydra.getOAuth2ConsentRequest({ consentChallenge: String(challenge) })
        .then(({ data }) => {
            return res.json(data)
        })
        .catch((err: any) => {
            console.error(err?.response?.data ?? err.message)
            return res.status(500).json({ error: 'failed to get consent request' })
        })
}