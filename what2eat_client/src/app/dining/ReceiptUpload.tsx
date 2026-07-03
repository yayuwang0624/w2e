'use client';

import React, { useState } from 'react';
import { Button } from '@heroui/react';
import {
	ParseReceipt,
	ReceiptDraft,
} from '@/app/RPC/JRPCRequest';
import { useAuth } from '@/app/auth/AuthContext';

// Downscale to a max long-edge so uploads stay small and the model
// isn't billed for a huge image. Returns { base64, mediaType }.
const downscale = (
	file: File,
	maxEdge = 1600,
): Promise<{ base64: string; mediaType: string }> =>
	new Promise((resolve, reject) => {
		const img = new Image();
		const url = URL.createObjectURL(file);
		img.onload = () => {
			URL.revokeObjectURL(url);
			const scale = Math.min(
				1,
				maxEdge / Math.max(img.width, img.height),
			);
			const w = Math.round(img.width * scale);
			const h = Math.round(img.height * scale);
			const canvas = document.createElement('canvas');
			canvas.width = w;
			canvas.height = h;
			const ctx = canvas.getContext('2d');
			if (!ctx) {
				reject(new Error('canvas unsupported'));
				return;
			}
			ctx.drawImage(img, 0, 0, w, h);
			const dataUrl = canvas.toDataURL(
				'image/jpeg',
				0.85,
			);
			resolve({
				base64: dataUrl.split(',')[1],
				mediaType: 'image/jpeg',
			});
		};
		img.onerror = () => {
			URL.revokeObjectURL(url);
			reject(new Error('could not read image'));
		};
		img.src = url;
	});

type ReceiptUploadProps = {
	onDraft: (draft: ReceiptDraft) => void;
};

const ReceiptUpload = ({ onDraft }: ReceiptUploadProps) => {
	const { token, user } = useAuth();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const inputRef = React.useRef<HTMLInputElement>(null);

	const onFile = async (
		e: React.ChangeEvent<HTMLInputElement>,
	) => {
		const file = e.target.files?.[0];
		if (!file) return;
		setError(null);
		setLoading(true);
		try {
			const { base64, mediaType } = await downscale(
				file,
			);
			const draft = await ParseReceipt(
				base64,
				mediaType,
				token,
			);
			onDraft(draft);
		} catch (err: any) {
			setError(err?.message || 'failed to read receipt');
		} finally {
			setLoading(false);
			if (inputRef.current)
				inputRef.current.value = '';
		}
	};

	// Server enforces admin-only too; this just hides the UI.
	if (user?.role !== 'admin') return null;

	return (
		<div className='w-[75%] flex flex-col items-center space-y-2'>
			<input
				ref={inputRef}
				type='file'
				accept='image/*'
				capture='environment'
				className='hidden'
				onChange={onFile}
			/>
			<Button
				color='secondary'
				variant='bordered'
				radius='sm'
				fullWidth={true}
				className='font-bold text-base'
				isLoading={loading}
				onPress={() => inputRef.current?.click()}
			>
				{loading
					? 'Reading receipt…'
					: '📷 Scan receipt'}
			</Button>
			{error && (
				<p className='text-small text-danger'>
					{error}
				</p>
			)}
		</div>
	);
};

export default ReceiptUpload;
