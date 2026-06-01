'use client';

import * as React from 'react';

import { useAuth } from './AuthContext';

// Reusable client-side gate. Wrap any page/section that should only be
// visible to logged-in users:
//
//   <RequireAuth><Edits /></RequireAuth>
//
// Not yet applied to existing pages so nobody gets locked out before a
// user is seeded — opt in per page when ready.
export default function RequireAuth({
    children,
    fallback,
}: {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}) {
    const { isAuthenticated, loading } = useAuth();

    if (loading) return null;

    if (!isAuthenticated) {
        return (
            <>
                {fallback ?? (
                    <div className='flex items-center justify-center p-8 text-default-500'>
                        Please log in to view this page.
                    </div>
                )}
            </>
        );
    }

    return <>{children}</>;
}
