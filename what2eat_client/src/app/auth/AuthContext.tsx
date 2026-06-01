'use client';

import * as React from 'react';

import { apiLogin, apiMe, AuthUser } from '@/app/RPC/authApi';

const TOKEN_KEY = 'w2e_token';

interface AuthContextValue {
    user: AuthUser | null;
    token: string | null;
    isAuthenticated: boolean;
    loading: boolean;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = React.createContext<
    AuthContextValue | undefined
>(undefined);

export function AuthProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [user, setUser] = React.useState<AuthUser | null>(
        null,
    );
    const [token, setToken] = React.useState<string | null>(
        null,
    );
    const [loading, setLoading] = React.useState(true);

    // Restore a previous session from localStorage on mount.
    React.useEffect(() => {
        const stored =
            typeof window !== 'undefined'
                ? window.localStorage.getItem(TOKEN_KEY)
                : null;
        if (!stored) {
            setLoading(false);
            return;
        }
        apiMe(stored)
            .then((restoredUser) => {
                setUser(restoredUser);
                setToken(stored);
            })
            .catch(() => {
                window.localStorage.removeItem(TOKEN_KEY);
            })
            .finally(() => setLoading(false));
    }, []);

    const login = React.useCallback(
        async (username: string, password: string) => {
            const { token: newToken, user: newUser } =
                await apiLogin(username, password);
            window.localStorage.setItem(TOKEN_KEY, newToken);
            setToken(newToken);
            setUser(newUser);
        },
        [],
    );

    const logout = React.useCallback(() => {
        window.localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
    }, []);

    const value: AuthContextValue = {
        user,
        token,
        isAuthenticated: !!user,
        loading,
        login,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextValue {
    const ctx = React.useContext(AuthContext);
    if (!ctx) {
        throw new Error(
            'useAuth must be used within an AuthProvider',
        );
    }
    return ctx;
}
