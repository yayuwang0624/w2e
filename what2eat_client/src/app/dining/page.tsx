'use client';

import React, { useEffect, useState } from 'react';

import DiningEditor from './DiningEditor';
import DishEditor from './DishEditor';
import ReceiptUpload from './ReceiptUpload';
import NavigationBar from '@/app/NavigationBar';
import RequireAuth from '@/app/auth/RequireAuth';
import { ReceiptDraft } from '@/app/RPC/JRPCRequest';

const Dining = () => {
	const [diningRestaurant, setDiningRestaurant] =
		useState('');
	const [draft, setDraft] =
		useState<ReceiptDraft | null>(null);
	const [draftKey, setDraftKey] = useState(0);

	const onDraft = (d: ReceiptDraft) => {
		setDraft(d);
		setDiningRestaurant(d.restaurant);
		setDraftKey((k) => k + 1);
	};

	return (
		<>
			<NavigationBar />
			<RequireAuth>
				<div className='flex flex-col items-center mt-[2em] h-[90vh] min-w-[50%] lg:max-w-[50%] mx-auto space-y-[10vh]'>
					<ReceiptUpload onDraft={onDraft} />
					<DiningEditor
						key={`dining-${draftKey}`}
						draft={draft}
						setDiningRestaurant={
							setDiningRestaurant
						}
					/>
					<DishEditor
						key={`dish-${draftKey}`}
						diningRestaurant={diningRestaurant}
						initialDishes={draft?.items.map(
							(i) => i.nameCn,
						)}
						initialDishHints={draft?.items.map(
							(i) => i.nameEn,
						)}
						setDiningRestaurant={
							setDiningRestaurant
						}
					/>
				</div>
			</RequireAuth>
		</>
	);
};

export default Dining;
