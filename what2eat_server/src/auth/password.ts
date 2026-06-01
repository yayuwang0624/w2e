import * as CryptoJS from 'crypto-js';

const PBKDF2_ITERATIONS = 10000;
const KEY_SIZE_WORDS = 256 / 32;

export const generateSalt = (): string =>
    CryptoJS.lib.WordArray.random(16).toString(CryptoJS.enc.Hex);

export const hashPassword = (
    password: string,
    salt: string,
): string =>
    CryptoJS.PBKDF2(password, salt, {
        keySize: KEY_SIZE_WORDS,
        iterations: PBKDF2_ITERATIONS,
    }).toString(CryptoJS.enc.Hex);

export const verifyPassword = (
    password: string,
    salt: string,
    hash: string,
): boolean => hashPassword(password, salt) === hash;
