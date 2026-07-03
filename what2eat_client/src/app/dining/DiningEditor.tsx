'use client';

import {
	GetRestaurants,
	JRPCBody,
	JRPCRequest,
} from '@/app/RPC/JRPCRequest';
import {
	ZonedDateTime,
	getLocalTimeZone,
	now,
	parseDateTime,
	toZoned,
} from '@internationalized/date';
import { ReceiptDraft } from '@/app/RPC/JRPCRequest';
import { Button, DatePicker } from '@heroui/react';
import React, {
	useEffect,
	useLayoutEffect,
	useState,
} from 'react';

import {
	Input,
	Autocomplete,
	AutocompleteItem,
	Form,
} from '@heroui/react';

import { v4 as UUID } from 'uuid';

import { useAuth } from '@/app/auth/AuthContext';

interface Dining {
	uuid: string;
	unixTimestamp: number;
	restaurant: string;
	people: number;
	price: number;
}

interface IRestaurant {
	name: string;
}

export class Restaurant implements IRestaurant {
	name: string;
	constructor(name: string) {
		this.name = name;
	}
}

class DiningForm implements Dining {
	uuid: string;
	unixTimestamp: number;
	restaurant: string;
	people: number;
	price: number;

	constructor(
		uuid: string,
		unixTimestamp: number,
		restaurant: string,
		people: number,
		price: number,
	) {
		this.uuid = uuid;
		this.unixTimestamp = unixTimestamp;
		this.restaurant = restaurant;
		this.people = people;
		this.price = price;
	}
}

type DiningProps = {
	setDiningRestaurant: (restaurant: string) => void;
	draft?: ReceiptDraft | null;
};

const draftTime = (
	datetime?: string,
): ZonedDateTime => {
	if (datetime) {
		try {
			return toZoned(
				parseDateTime(datetime),
				getLocalTimeZone(),
			);
		} catch (e) {
			console.warn(
				'[dining] could not parse datetime',
				datetime,
				e,
			);
		}
	}
	return now(getLocalTimeZone());
};

const DiningEditor = ({
	setDiningRestaurant,
	draft,
}: DiningProps) => {
	const { token } = useAuth();
	const [submitted, setSubmitted] =
		useState<Dining | null>(null);
	const [submitResp, setSubmitResp] =
		React.useState(null);
	const [restaurants, setRestaurants] = useState<
		Restaurant[]
	>([]);
	const [time, setTime] = useState<ZonedDateTime | null>(
		draftTime(draft?.datetime),
	);
	const [people, setPeople] = useState<number>(
		draft?.people || 0,
	);
	const [price, setPrice] = useState<number>(
		draft?.price || 0,
	);

	const onPeopleChange = (value: string) => {
		const newPeople = Number(value) || 0;
		if (newPeople > 0 && people === 0) {
			setPrice(
				Math.round((price / newPeople) * 100) / 100,
			);
		} else if (newPeople > 0 && people > 0) {
			setPrice(
				Math.round(
					((price * people) / newPeople) * 100,
				) / 100,
			);
		}
		setPeople(newPeople);
	};

	const onSubmit = async (event: any) => {
		event.preventDefault();
		const data = Object.fromEntries(
			new FormData(event.currentTarget),
		);
		const dining: Dining = {
			uuid: UUID(),
			unixTimestamp: Math.floor(
				time!.toDate().getTime() / 1000,
			),
			restaurant: data.restaurant as string,
			people: Number(data.people || 0),
			price: Number(data.price || 0),
		};
		const getDiningBody = JRPCBody('add_dining', {
			...dining,
			token,
		});

		setSubmitted(dining);
		const response = await JRPCRequest(getDiningBody);
		setSubmitResp(response);
		const dining_id = JSON.parse(response.result);
		setDiningRestaurant(data.restaurant as string);
	};

	useEffect(() => {
		GetRestaurants(setRestaurants);
		setTime(draftTime(draft?.datetime));
	}, []);

	useLayoutEffect(() => {}, []);

	return (
		<Form
			onSubmit={onSubmit}
			validationBehavior='native'
			className='w-[75%] flex flex-col items-center space-y-3'
		>
			<h1 className='text-3xl font-bold mb-4 leading-relaxed'>
				Dining
			</h1>
			<Autocomplete
				isRequired
				variant='bordered'
				radius='sm'
				size='lg'
				name='restaurant'
				label='Restaurant'
				allowsCustomValue={true}
				defaultInputValue={draft?.restaurant}
				defaultItems={restaurants}
				popoverProps={{
					shouldCloseOnScroll: false,
				}}
				scrollShadowProps={{
					isEnabled: false,
				}}
			>
				{(restaurant) => (
					<AutocompleteItem key={restaurant.name}>
						{restaurant.name}
					</AutocompleteItem>
				)}
			</Autocomplete>
			<DatePicker
				isRequired
				radius='sm'
				size='lg'
				variant='bordered'
				hideTimeZone
				showMonthAndYearPickers
				selectorButtonPlacement='start'
				value={time}
				onChange={setTime}
			/>
			<div className='flex w-full gap-3'>
				<Input
					radius='sm'
					size='md'
					variant='bordered'
					type='number'
					min={0}
					name='people'
					label='People'
					placeholder='0'
					value={
						people ? String(people) : ''
					}
					onValueChange={onPeopleChange}
				/>
				<Input
					radius='sm'
					size='md'
					variant='bordered'
					type='number'
					min={0}
					step='0.01'
					name='price'
					label='Price / person'
					placeholder='0.00'
					value={
						price ? String(price) : ''
					}
					onValueChange={(value: string) =>
						setPrice(Number(value) || 0)
					}
					startContent={
						<span className='text-default-400 text-small'>
							$
						</span>
					}
				/>
			</div>
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

export default DiningEditor;
