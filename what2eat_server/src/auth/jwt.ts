import * as CryptoJS from 'crypto-js';

// Minimal HS256 JSON Web Token implementation built on the
// already-installed crypto-js. No external JWT dependency required.

export interface JwtPayload {
    sub: string; // username
    role?: string;
    iat: number;
    exp: number;
    [key: string]: any;
}

const HEADER = { alg: 'HS256', typ: 'JWT' };
const DEFAULT_EXPIRY_SECONDS = 60 * 60 * 24 * 7; // 7 days

const toBase64Url = (wordArray: CryptoJS.lib.WordArray): string =>
    CryptoJS.enc.Base64.stringify(wordArray)
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');

const utf8ToBase64Url = (str: string): string =>
    toBase64Url(CryptoJS.enc.Utf8.parse(str));

const base64UrlToUtf8 = (b64url: string): string => {
    const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
    return CryptoJS.enc.Base64.parse(b64).toString(CryptoJS.enc.Utf8);
};

const sign = (message: string, secret: string): string =>
    toBase64Url(CryptoJS.HmacSHA256(message, secret));

export const signJwt = (
    payload: Record<string, any>,
    secret: string,
    expiresInSeconds: number = DEFAULT_EXPIRY_SECONDS,
): string => {
    const now = Math.floor(Date.now() / 1000);
    const fullPayload = {
        iat: now,
        exp: now + expiresInSeconds,
        ...payload,
    };
    const encodedHeader = utf8ToBase64Url(JSON.stringify(HEADER));
    const encodedPayload = utf8ToBase64Url(
        JSON.stringify(fullPayload),
    );
    const signature = sign(
        `${encodedHeader}.${encodedPayload}`,
        secret,
    );
    return `${encodedHeader}.${encodedPayload}.${signature}`;
};

export const verifyJwt = (
    token: string,
    secret: string,
): JwtPayload | null => {
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [encodedHeader, encodedPayload, signature] = parts;
    const expected = sign(
        `${encodedHeader}.${encodedPayload}`,
        secret,
    );
    if (expected !== signature) return null;
    try {
        const payload = JSON.parse(
            base64UrlToUtf8(encodedPayload),
        ) as JwtPayload;
        const now = Math.floor(Date.now() / 1000);
        if (typeof payload.exp === 'number' && payload.exp < now) {
            return null;
        }
        return payload;
    } catch {
        return null;
    }
};
