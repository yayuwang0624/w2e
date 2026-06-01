import { verifyJwt, JwtPayload } from './jwt';
import { getJwtSecret } from './secret';

// Reusable helper for RPC methods that need to be protected.
// Returns the decoded payload for a valid token, or null otherwise.
//
// Enforcement is not yet wired into the existing RPC methods; when ready,
// a protected method can do:
//
//   const auth = verifyAuthToken(params.token);
//   if (!auth) return callback(new ErrorResponse(401, 'unauthorized'));
//
export const verifyAuthToken = (
    token?: string,
): JwtPayload | null => {
    if (!token) return null;
    return verifyJwt(token, getJwtSecret());
};
