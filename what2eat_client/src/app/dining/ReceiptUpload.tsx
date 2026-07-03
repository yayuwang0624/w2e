'use client';

import React, { useEffect, useState } from 'react';
import {
	ParseReceipt,
	ReceiptDraft,
} from '@/app/RPC/JRPCRequest';
import { useAuth } from '@/app/auth/AuthContext';

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
	const [dragging, setDragging] = useState(false);
	const inputRef = React.useRef<HTMLInputElement>(null);

	const processFile = async (file: File) => {
		if (!file.type.startsWith('image/')) {
			setError('please drop an image file');
			return;
		}
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
			if (!draft.items || draft.items.length === 0) {
				setError(
					'no dishes detected on the receipt',
				);
			}
			onDraft(draft);
		} catch (err: any) {
			setError(err?.message || 'failed to read receipt');
		} finally {
			setLoading(false);
			if (inputRef.current)
				inputRef.current.value = '';
		}
	};

	const onInputChange = (
		e: React.ChangeEvent<HTMLInputElement>,
	) => {
		const file = e.target.files?.[0];
		if (file) processFile(file);
	};

	const onDrop = (e: React.DragEvent) => {
		e.preventDefault();
		setDragging(false);
		if (loading) return;
		const file = e.dataTransfer.files?.[0];
		if (file) processFile(file);
	};

	useEffect(() => {
		if (user?.role !== 'admin') return;
		const handler = (e: ClipboardEvent) => {
			if (loading || !e.clipboardData) return;
			const file = Array.from(e.clipboardData.items)
				.find((i) => i.type.startsWith('image/'))
				?.getAsFile();
			if (file) {
				e.preventDefault();
				processFile(file);
			}
		};
		window.addEventListener('paste', handler);
		return () =>
			window.removeEventListener('paste', handler);
	}, [loading, token, user?.role]);

	if (user?.role !== 'admin') return null;

	return (
		<div className='w-[75%] flex flex-col items-center space-y-2'>
			<input
				ref={inputRef}
				type='file'
				accept='image/*'
				capture='environment'
				className='hidden'
				onChange={onInputChange}
			/>
			<div
				role='button'
				tabIndex={0}
				onClick={() => inputRef.current?.click()}
				onKeyDown={(e) => {
					if (e.key === 'Enter' || e.key === ' ')
						inputRef.current?.click();
				}}
				onDrop={onDrop}
				onDragOver={(e) => {
					e.preventDefault();
					if (!dragging) setDragging(true);
				}}
				onDragLeave={() => setDragging(false)}
				className={`w-full flex flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed px-4 py-6 text-center cursor-pointer transition-colors ${
					dragging
						? 'border-secondary bg-secondary/10'
						: 'border-default-300 hover:border-secondary'
				}`}
			>
				<span className='font-bold text-base'>
					{loading
						? 'Reading receipt…'
						: 'Scan receipt'}
				</span>
				<span className='text-small text-default-500'>
					Drag &amp; drop, paste, or click to
					upload a photo
				</span>
			</div>
			{error && (
				<p className='text-small text-danger'>
					{error}
				</p>
			)}
		</div>
	);
};

export default ReceiptUpload;
