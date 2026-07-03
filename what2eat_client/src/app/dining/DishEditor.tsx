'use client';

import {
	JRPCBody,
	JRPCRequest,
	GetRestaurants,
	GetDishesByRestaurant,
} from '@/app/RPC/JRPCRequest';
import { Button, Input } from '@heroui/react';
import {
	now,
	parseDate,
	getLocalTimeZone,
} from '@internationalized/date';

import React, { useEffect, useState } from 'react';

import {
	Form,
	Autocomplete,
	AutocompleteItem,
} from '@heroui/react';
import { Restaurant } from './DiningEditor';
import { useAuth } from '@/app/auth/AuthContext';

interface IDish {
	restaurant: string;
	name: string;
}

interface IDining {
	uuid: string;
	unixTimestamp: number;
	restaurant: string;
}

export class Dining implements IDining {
	uuid: string;
	unixTimestamp: number;
	restaurant: string;
	constructor(
		uuid: string,
		unixTimestamp: number,
		restaurant: string,
	) {
		this.uuid = uuid;
		this.unixTimestamp = unixTimestamp;
		this.restaurant = restaurant;
	}
}

export class Dish implements IDish {
	restaurant: string;
	name: string;

	constructor(restaurant: string, name: string) {
		this.restaurant = restaurant;
		this.name = name;
	}
}

type DishEditorProps = {
	diningRestaurant: string;
	setDiningRestaurant: (restaurant: string) => void;
	initialDishes?: string[];
};

const DishEditor = ({
	diningRestaurant,
	setDiningRestaurant,
	initialDishes,
}: DishEditorProps) => {
	const { token } = useAuth();
	const [restaurants, setRestaurants] = useState<
		Restaurant[]
	>([]);
	const [candDishes, setCandDishes] = useState<Dish[]>(
		[],
	);
	const [submitted, setSubmitted] = useState<Dish | null>(
		null,
	);
	const [submitResp, setSubmitResp] =
		React.useState(null);
	const [dishes, setDishes] = useState<string[]>(
		initialDishes && initialDishes.length
			? [...initialDishes, '']
			: [''],
	);

	const onDiningChange = async (restaurant: string) => {
		console.log('onDiningChange', restaurant);
		const restaurantDishes =
			await GetDishesByRestaurant(restaurant);
		setCandDishes(restaurantDishes);
	};

	const onSubmit = async (
		event: React.FormEvent<HTMLFormElement>,
	) => {
		event.preventDefault();
		const data = Object.fromEntries(
			new FormData(event.currentTarget),
		);
		for (const dish of dishes) {
			if (dish != '') {
				const newDishes = new Dish(
					data.restaurant as string,
					dish,
				);
				const addDishBody = JRPCBody('add_dish', {
					...newDishes,
					token,
				});
				setSubmitted(newDishes);
				const response = await JRPCRequest(
					addDishBody,
				);
				setSubmitResp(response);
			}
		}
	};

	useEffect(() => {
		GetRestaurants((restaurants: any) => {
			setRestaurants(restaurants.reverse());
		});
	}, []);

	useEffect(() => {
		if (diningRestaurant) {
			(async () => {
				const restaurantDishes =
					await GetDishesByRestaurant(
						diningRestaurant,
					);
				setCandDishes(restaurantDishes);
			})();
		}
	}, [diningRestaurant]);

	const handleInputChange = (
		index: number,
		value: string,
	) => {
		const currentDishes = dishes;
		const updatedDishes = [...currentDishes];
		updatedDishes[index] = value;
		setDishes(updatedDishes);

		if (
			index === updatedDishes.length - 1 &&
			value !== ''
		) {
			updatedDishes.push('');
			setDishes(updatedDishes);
		} else if (index === updatedDishes.length - 2) {
			while (
				index >= 0 &&
				updatedDishes[index] === ''
			) {
				updatedDishes.splice(index, 1);
				--index;
			}
			setDishes(updatedDishes);
		}
	};

	const dishFields = dishes.map((value, index) => (
		<Autocomplete
			key={index}
			label={`Dish ${index + 1}`}
			radius='sm'
			size='lg'
			variant='bordered'
			value={value}
			allowsCustomValue={true}
			defaultItems={candDishes}
			popoverProps={{
				shouldCloseOnScroll: false,
			}}
			scrollShadowProps={{
				isEnabled: false,
			}}
			onChange={(e) =>
				handleInputChange(index, e.target.value)
			}
			onInputChange={(value) =>
				handleInputChange(index, value)
			}
		>
			{(dish) => (
				<AutocompleteItem key={dish.name}>
					{dish.name}
				</AutocompleteItem>
			)}
		</Autocomplete>
	));

	return (
		<Form
			onSubmit={onSubmit}
			validationBehavior='native'
			className='w-[75%] flex flex-col items-center space-y-3'
		>
			<h1 className='text-3xl font-bold mb-4 leading-relaxed'>
				Dishes
			</h1>
			<Autocomplete
				isRequired
				variant='bordered'
				radius='sm'
				size='lg'
				name='restaurant'
				label='Restaurant'
				allowsCustomValue={true}
				inputValue={diningRestaurant}
				defaultItems={restaurants}
				popoverProps={{
					shouldCloseOnScroll: false,
				}}
				scrollShadowProps={{
					isEnabled: false,
				}}
				onInputChange={setDiningRestaurant}
			>
				{(restaurant) => (
					<AutocompleteItem key={restaurant.name}>
						{restaurant.name}
					</AutocompleteItem>
				)}
			</Autocomplete>
			{dishFields}
			<Button
				type='submit'
				color='primary'
				fullWidth={true}
				radius='sm'
				className='font-bold text-base'
			>
				SUBMIT
			</Button>
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

export default DishEditor;
function handleInputChange(
	index: number,
	value: any,
): void {
	throw new Error('Function not implemented.');
}
