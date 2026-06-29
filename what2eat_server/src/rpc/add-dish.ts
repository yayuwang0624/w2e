import { Dining } from '../interface/dining';
import { Dish } from '../interface/dish';
import { ErrorResponse } from '../interface/response';
import { AppDataSource } from '../data-source';
import { ReviewEntity } from '../entity/review-entity';
import { RestaurantEntity } from '../entity/restaurant-entity';
import { AddReviewRequest } from '../interface/request';
import { DishEntity } from '../entity/dish-entity';
import { RestaurantRepo, DishRepo } from '../data-source';
import { ensureActiveUser } from '../auth/require-auth';

export const AddDish = async (
	dish: DishEntity & { token?: string },
	callback: (e: ErrorResponse | null, m?: string) => void,
) => {
	if (!(await ensureActiveUser(dish.token, callback)))
		return;

	let restaurant: RestaurantEntity =
		new RestaurantEntity();
	console.log(dish);
	restaurant.name = dish.restaurant;
	await RestaurantRepo.upsert(restaurant, ['name']);

	let ret = await DishRepo.upsert(dish, [
		'restaurant',
		'name',
	]);
	console.log(ret);
	if (ret == null) {
		const error: ErrorResponse = new ErrorResponse(
			400,
			'Adding dish failed',
		);
		callback(error);
	} else {
		callback(null, JSON.stringify(dish.name));
	}
};

export const AddDishes = async (
	dishes: DishEntity[],
	callback: (e: ErrorResponse | null, m?: string) => void,
) => {
	const error: ErrorResponse = new ErrorResponse(
		300,
		'Not implemented',
	);
	callback(error);
};
