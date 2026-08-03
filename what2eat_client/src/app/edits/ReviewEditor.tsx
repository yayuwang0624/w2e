import {
	JRPCRequest,
	JRPCBody,
	GetDinings,
	GetDishesByRestaurant,
} from '@/app/RPC/JRPCRequest';

import {
	Input,
	Button,
	Autocomplete,
	AutocompleteItem,
	Form,
	Checkbox,
	Textarea,
} from '@heroui/react';

import dayjs from 'dayjs';
import React from 'react';
import { useState, useMemo, useEffect } from 'react';
import { v4 as UUID } from 'uuid';
import { Dish, Dining } from '@/app/dining/DishEditor';
import { useAuth } from '@/app/auth/AuthContext';

interface reviewForm {
	dining: string;
	diningRestaurant: string;
	reviewer: string;
	restaurant: string;
	score: number;
	dishes: string[];
	scores: number[];
	dishComments: string[];
	comment: string;
	date: Date;
	uuid: string;
}

function screenWidthToSize() {
	if (typeof window !== 'undefined') {
		const width = window.innerWidth;

		if (width >= 1024) {
			return 'lg';
		} else if (width >= 768) {
			return 'md';
		} else {
			return 'sm';
		}
	}
	return 'sm';
}

const ReviewEditor = () => {
	const { token, user } = useAuth();
	const linkedReviewer = user?.reviewer ?? '';
	const [submitted, setSubmitted] =
		useState<reviewForm | null>(null);
	const [submitResp, setSubmitResp] = useState(null);
	const [errors, setErrors] = useState<any>({});

	const [dining, setDining] = useState('');
	const [dinings, setDinings] = useState([]);
	const [reviewer, setReviewer] = useState('');
	const [restaurant, setRestaurnt] = useState('');
	const [diningScore, setDiningScore] = useState('0');
	const [candDishes, setCandDishes] = useState<Dish[]>(
		[],
	);
	const [dishes, setDishes] = useState(['']);
	const [dishScores, setDishScores] = useState(['0']);
	const [dishComments, setDishComments] = useState(['']);
	const [comment, setComment] = useState('');

	const windowSize = screenWidthToSize();

	const onDiningChange = async (
		diningRestaurant: string,
	) => {
		if (diningRestaurant) {
			const restaurant =
				diningRestaurant.split(' | ')[0];
			setRestaurnt(diningRestaurant);
			const restaurantDishes =
				await GetDishesByRestaurant(restaurant);
			setCandDishes(restaurantDishes);
		}
	};

	const diningString = (dining: Dining) => {
		return (
			dining.restaurant +
			' | ' +
			dayjs
				.unix(dining.unixTimestamp)
				.format('YYYY-MM-DD HH:MM') +
			' | ' +
			dining.uuid
		);
	};

	useEffect(() => {
		GetDinings((dinings: any) => {
			setDinings(dinings.reverse());
		});
	}, []);

	const onSelectAllDishes = () => {
		const allDishes: string[] = candDishes.map(
			(dish) => dish.name,
		);
		const allDishScores: string[] = candDishes.map(
			() => diningScore,
		);
		const allDishComments: string[] = candDishes.map(
			() => '',
		);
		allDishes.push('');
		allDishScores.push('0');
		allDishComments.push('');
		setDishes(allDishes);
		setDishScores(allDishScores);
		setDishComments(allDishComments);
	};

	const onClearAllDishes = () => {
		setDishes(['']);
		setDishScores(['0']);
		setDishComments(['']);
	};

	const onDishSelectChange = (
		index: number,
		value: string,
	) => {
		const currentDishes = dishes;
		const currentScores = dishScores;
		const currentComments = dishComments;
		const updatedDishes = [...currentDishes];
		const updatedScores = [...currentScores];
		const updatedComments = [...currentComments];
		const isLastRow = index === updatedDishes.length - 1;
		updatedDishes[index] = value;
		updatedScores[index] = diningScore;
		if (isLastRow && value !== '') {
			updatedDishes.push('');
			updatedScores.push('0');
			updatedComments.push('');
		}
		setDishes(updatedDishes);
		setDishScores(updatedScores);
		setDishComments(updatedComments);
	};

	const onDishScoreChange = (
		index: number,
		value: string,
	) => {
		const currentScores = dishScores;
		const updatedScores = [...currentScores];
		updatedScores[index] = value;
		setDishScores(updatedScores);
	};

	const onRemoveDish = (index: number) => {
		if (index === dishes.length - 1) {
			return;
		}
		const updatedDishes = [...dishes];
		const updatedScores = [...dishScores];
		const updatedComments = [...dishComments];
		updatedDishes.splice(index, 1);
		updatedScores.splice(index, 1);
		updatedComments.splice(index, 1);
		setDishes(updatedDishes);
		setDishScores(updatedScores);
		setDishComments(updatedComments);
	};

	const onDishCommentChange = (
		index: number,
		value: string,
	) => {
		const currentComments = dishComments;
		const updatedComments = [...currentComments];
		updatedComments[index] = value;
		setDishComments(updatedComments);
	};

	const onDiningScoreChange = (value: string) => {
		setDiningScore(value);
		const currentDishes = dishes;
		const currentScores = dishScores;
		const updatedScores = [...currentScores];
		if (
			updatedScores.length == 1 &&
			currentDishes[0] == ''
		) {
			updatedScores[0] = value;
			setDishScores(updatedScores);
		}
	};
	const getScoresAverage = () => {
		let res = 0,
			cnt = 0;
		for (let i = 0; i < dishScores.length - 1; i++) {
			const val = parseFloat(dishScores[i]);
			if (!isNaN(val)) {
				res += val;
				++cnt;
			}
		}
		return res / Math.max(cnt, 1);
	};

	const dishFields = useMemo(() => {
		return (
			<>
				{dishes.map((value, index) => (
					<div
						className='flex flex-row items-center justify-between w-full gap-[2%]'
						key={index}
					>
						{
							<Autocomplete
								size={windowSize}
								className='flex-[2]'
								variant='bordered'
								inputValue={value}
								defaultItems={candDishes}
								disabledKeys={dishes.filter(
									(_, idx) =>
										index !== idx,
								)}
								isClearable={true}
								allowsEmptyCollection={
									false
								}
								label={
									'Dish ' + (index + 1)
								}
								name={`dishes[${index}]`}
								popoverProps={{
									shouldCloseOnScroll:
										false,
								}}
								onInputChange={(value) => {
									onDishSelectChange(
										index,
										value as string,
									);
								}}
								onSelectionChange={(
									value,
								) => {
									onDishSelectChange(
										index,
										value as string,
									);
								}}
							>
								{(dish) => (
									<AutocompleteItem
										key={dish.name}
									>
										{dish.name}
									</AutocompleteItem>
								)}
							</Autocomplete>
						}
						<Input
							className='flex-[2]'
							variant='bordered'
							size={windowSize}
							label={'Comment'}
							name={`dishComments[${index}]`}
							value={dishComments[index]}
							onValueChange={(value) =>
								onDishCommentChange(
									index,
									value,
								)
							}
						/>
						<Input
							isRequired={dishes[index] != ''}
							className='flex-[1]'
							variant='bordered'
							size={windowSize}
							label={'Score'}
							placeholder='0'
							name={`disheScores[${index}]`}
							value={dishScores[index]}
							onValueChange={(value) =>
								onDishScoreChange(
									index,
									value,
								)
							}
							type='number'
							step='any'
							inputMode='decimal'
						/>
						{index !== dishes.length - 1 && (
							<Button
								isIconOnly
								variant='light'
								color='danger'
								size={windowSize}
								aria-label='Remove dish'
								onPress={() =>
									onRemoveDish(index)
								}
							>
								✕
							</Button>
						)}
					</div>
				))}
			</>
		);
	}, [candDishes, dishes, dishScores, dishComments]);

	useEffect(() => {
		setReviewer(linkedReviewer);
	}, [linkedReviewer]);

	const resetForm = () => {
		setReviewer(linkedReviewer);
		setDining('');
		setRestaurnt('');
		setDiningScore('0');
		setComment('');
		setCandDishes([]);
		setDishes(['']);
		setDishScores(['0']);
		setDishComments(['']);
	};

	const onSubmit = async (
		event: React.FormEvent<HTMLFormElement>,
	) => {
		event.preventDefault();
		const data = Object.fromEntries(
			new FormData(event.currentTarget),
		);
		if (data.terms !== 'true') {
			setErrors({ terms: 'Please accept the terms' });

			return;
		}

		const dishes: string[] = [];
		for (const key in data) {
			const match = key.match(/^dishes\[(\d+)\]$/);
			if (match) {
				const index: number = parseInt(
					match[1],
					10,
				);
				dishes[index] = data[key] as string;
			}
		}

		const dishScores: number[] = [];
		for (const key in data) {
			const match = key.match(
				/^disheScores\[(\d+)\]$/,
			);
			if (match) {
				const index: number = parseInt(
					match[1],
					10,
				);
				const parsed = parseFloat(
					data[key] as string,
				);
				dishScores[index] = isNaN(parsed)
					? 0
					: parsed;
			}
		}

		const dishComments: string[] = [];
		for (const key in data) {
			const match = key.match(
				/^dishComments\[(\d+)\]$/,
			);
			if (match) {
				const index: number = parseInt(
					match[1],
					10,
				);
				dishComments[index] = data[key] as string;
			}
		}

		setErrors({});
		const resSplit = restaurant.split(' | ');
		const diningId = resSplit[resSplit.length - 1];
		const diningRestaurant = resSplit[0];
		const review: reviewForm = {
			dining: diningId,
			diningRestaurant: restaurant,
			reviewer: reviewer,
			restaurant: diningRestaurant,
			score: isNaN(parseFloat(diningScore))
				? 0
				: parseFloat(diningScore),
			dishes: dishes.slice(0, -1),
			scores: dishScores.slice(0, -1),
			dishComments: dishComments.slice(0, -1),
			comment: comment,
			date: new Date(),
			uuid: UUID(),
		};

		setSubmitted(review);
		const addReviewBody: any = JRPCBody(
			'submit_review_form',
			{ ...review, token },
		);
		try {
			const response = await JRPCRequest(
				addReviewBody,
			);
			setSubmitResp(response);
			resetForm();
		} catch (error: any) {
			setErrors(error);
			console.log(error);
		}
	};

	return (
		<Form
			className='flex flex-col w-full lg:w-[4/5] space-y-4 p-4'
			validationBehavior='native'
			validationErrors={errors}
			onReset={resetForm}
			onSubmit={onSubmit}
		>
			<h1 className='text-3xl font-bold mb-2 leading-relaxed'>
				Review
			</h1>
			<div className='flex flex-col items-center gap-4 w-full'>
				<Input
					isReadOnly
					isDisabled
					label='Reviewer'
					size={windowSize}
					name='reviewer'
					variant='faded'
					value={linkedReviewer}
				/>

				<Autocomplete
					isRequired
					inputValue={dining}
					defaultItems={dinings}
					errorMessage={({
						validationDetails,
					}) => {
						if (
							validationDetails.valueMissing
						) {
							return 'Please select the reviewer';
						}

						return errors.name;
					}}
					label='Dining'
					variant='bordered'
					name='dining'
					popoverProps={{
						shouldCloseOnScroll: false,
					}}
					size={windowSize}
					// placeholder='Select Dining History'
					onInputChange={setDining}
					onSelectionChange={(sel) => {
						onDiningChange(sel as string);
					}}
				>
					{(dining) => (
						<AutocompleteItem
							key={diningString(dining)}
						>
							{diningString(dining)}
						</AutocompleteItem>
					)}
				</Autocomplete>

				<div className='flex flex-row justify-between w-full gap-[2%]'>
					<Input
						isReadOnly
						isDisabled
						value={restaurant}
						size={windowSize}
						label='Dining Id'
						description={
							'avg: ' + getScoresAverage()
						}
						variant='faded'
						className='flex-[2]'
					/>

					<Input
						isRequired
						endContent={<></>}
						className='flex-[1]'
						size={windowSize}
						variant='bordered'
						value={diningScore}
						onValueChange={onDiningScoreChange}
						label='Dining Score'
						placeholder='0'
						name='diningScore'
						type='number'
						step='any'
						inputMode='decimal'
					/>
				</div>

				<div className='flex flex-row gap-2 mr-auto'>
					<Button
						variant='bordered'
						onPress={onSelectAllDishes}
					>
						Select All Dishes
					</Button>

					<Button
						variant='bordered'
						onPress={onClearAllDishes}
					>
						Clear All
					</Button>
				</div>

				{dishFields}

				<Textarea
					size={windowSize}
					label='Restaurant Comment'
					variant='bordered'
					value={comment}
					onValueChange={setComment}
					name='comment'
				/>

				<Checkbox
					isRequired
					classNames={{
						label: 'text-small',
					}}
					isInvalid={!!errors.terms}
					name='terms'
					validationBehavior='aria'
					value='true'
					onValueChange={() =>
						setErrors((prev: any) => ({
							...prev,
							terms: undefined,
						}))
					}
				>
					I agree to the terms and conditions of
					W2E
				</Checkbox>

				{errors.terms && (
					<span className='text-danger text-small'>
						{errors.terms}
					</span>
				)}

				<div className='flex gap-4'>
					<Button
						className='w-full'
						color='primary'
						type='submit'
					>
						Submit
					</Button>
					<Button type='reset' variant='bordered'>
						Reset
					</Button>
				</div>
			</div>

			{submitted && (
				<div className='items-start w-full'>
					<div className='text-small text-default-500 mt-4 mb-4'>
						Response data:{' '}
						<pre>
							{JSON.stringify(
								submitResp,
								null,
								2,
							)}
						</pre>
					</div>
					<div className='text-small text-default-500 mt-4 mb-4'>
						Submitted data:{' '}
						<pre>
							{JSON.stringify(
								submitted,
								null,
								2,
							)}
						</pre>
					</div>
				</div>
			)}
		</Form>
	);
};

export default ReviewEditor;
