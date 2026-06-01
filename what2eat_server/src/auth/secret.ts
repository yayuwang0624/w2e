// JWT signing secret. Set JWT_SECRET in the environment for production;
// the fallback exists only so local development works out of the box.
export const getJwtSecret = (): string =>
    process.env.JWT_SECRET || 'what2eat-dev-secret-change-me';
