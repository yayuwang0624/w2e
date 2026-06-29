'use client';

import * as React from 'react';

import { useAuth } from './AuthContext';

export default function RequireAuth({
	children,
	fallback,
}: {
	children: React.ReactNode;
	fallback?: React.ReactNode;
}) {
	const { isAuthenticated, user, loading } = useAuth();

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

	if (!user?.active) {
		return (
			<div className='flex items-center justify-center p-8 text-default-500'>
				Your account is awaiting admin approval
				before you can view this page.
			</div>
		);
	}

	return <>{children}</>;
}
