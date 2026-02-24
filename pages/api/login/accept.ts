// pages/api/login/accept.ts  — server-side, calls Hydra admin
import hydra from '@/pkg/sdk/hydra'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { challenge, subject } = req.body
    try {
        const { data } = await hydra.acceptOAuth2LoginRequest({
            loginChallenge: challenge,
            acceptOAuth2LoginRequest: {
                subject,
                remember: true,
                remember_for: 3600,
            },
        })
        return res.json({ redirect_to: data.redirect_to })
    } catch (err) {
        console.error(err)
        return res.status(500).json({ error: 'An error occurred while accepting the login challenge' })
    }
}