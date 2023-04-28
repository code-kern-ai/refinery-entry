export const isFreeTrial = process.env.IS_OS === 'true' || process.env.IS_OS === '1';
export const isDemoUser = process.env.IS_DEMO === 'true' || process.env.IS_DEMO === '1';