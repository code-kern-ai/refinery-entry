export const isManagedApp = process.env.IS_OS === 'false' || process.env.IS_OS === '0';
export const isDemoUser = process.env.IS_DEMO === 'true' || process.env.IS_DEMO === '1';