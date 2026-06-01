import { JRPCBody, JRPCRequest } from '@/app/RPC/JRPCRequest';

export interface AuthUser {
    username: string;
    role: string;
}

export interface LoginResult {
    token: string;
    user: AuthUser;
}

export const apiLogin = async (
    username: string,
    password: string,
): Promise<LoginResult> => {
    const body = JRPCBody('login', { username, password });
    const response = await JRPCRequest(body);
    if (response.error) {
        throw new Error(
            response.error.message || 'Login failed',
        );
    }
    return JSON.parse(response.result) as LoginResult;
};

export const apiMe = async (
    token: string,
): Promise<AuthUser> => {
    const body = JRPCBody('me', { token });
    const response = await JRPCRequest(body);
    if (response.error) {
        throw new Error(
            response.error.message || 'Not authenticated',
        );
    }
    return JSON.parse(response.result) as AuthUser;
};
