'use client';

import ReviewEditor from './ReviewEditor';
import NavigationBar from '@/app/NavigationBar';
import RequireAuth from '@/app/auth/RequireAuth';

const Dining = () => {
	return (
		<>
			<NavigationBar />
			<RequireAuth>
				<div className='flex flex-col items-center mt-[2em] min-w-[50%] lg:max-w-[50%] mx-auto space-y-[10vh]'>
					<ReviewEditor />
				</div>
			</RequireAuth>
		</>
	);
};

export default Dining;
