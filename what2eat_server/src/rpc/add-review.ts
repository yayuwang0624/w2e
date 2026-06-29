import { Review } from '../interface/review';
import { ErrorResponse } from '../interface/response';
import { AppDataSource } from '../data-source';
import { ReviewEntity } from '../entity/review-entity';
import { RestaurantEntity } from '../entity/restaurant-entity';
import { AddReviewRequest } from '../interface/request';
import { DishEntity } from '../entity/dish-entity';
import {
	RestaurantRepo,
	DishRepo,
	ReviewRepo,
	DiningRepo,
} from '../data-source';
import { ensureActiveUser } from '../auth/require-auth';

export const AddReview = async (
	review: ReviewEntity & { token?: string },
	callback: (e: ErrorResponse | null, m?: string) => void,
) => {
	if (!(await ensureActiveUser(review.token, callback)))
		return;

	console.log(review);

	let restaurant: RestaurantEntity =
		new RestaurantEntity();
	restaurant.name = review.restaurant;
	await RestaurantRepo.upsert(restaurant, ['name']);
	// let dishEntity: DishEntity = new DishEntity();

	// dishEntity.restaurant = review.restaurant;
	// for (let dish of dishes) {
	//     dishEntity.name = dish;
	//     await DishRepo.upsert(dishEntity, ['name', 'restaurant']);
	// }

	let ret = ReviewRepo.save(review);
	console.log(ret);
	if (ret == null) {
		const error: ErrorResponse = new ErrorResponse(
			400,
			'Insert review failed',
		);
		callback(error);
	} else {
		callback(null, 'review updated');
	}
};
