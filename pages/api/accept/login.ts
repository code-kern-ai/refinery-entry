// pages/api/login/accept.ts  — server-side, calls Hydra admin
import hydra from '@/pkg/sdk/hydra'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { challenge, subject } = req.body
    const { data } = await hydra.acceptOAuth2LoginRequest({
        loginChallenge: challenge,
        acceptOAuth2LoginRequest: {
            subject,
            remember: true,
            remember_for: 3600,
        },
    })
    res.json({ redirect_to: data.redirect_to })
}