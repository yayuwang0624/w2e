import { Dining } from '../interface/dining';
import { ErrorResponse } from '../interface/response';
import { AppDataSource } from '../data-source';
import { ReviewEntity } from '../entity/review-entity';
import { RestaurantEntity } from '../entity/restaurant-entity';
import { AddReviewRequest } from '../interface/request';
import { DiningEntity } from '../entity/dining-entity';
import { RestaurantRepo, DiningRepo } from '../data-source';
import { ensureActiveUser } from '../auth/require-auth';

export const AddDining = async (
	dining: DiningEntity & { token?: string },
	callback: (e: ErrorResponse | null, m?: string) => void,
) => {
	if (!(await ensureActiveUser(dining.token, callback)))
		return;

	try {
		let restaurant: RestaurantEntity =
			new RestaurantEntity();
		restaurant.name = dining.restaurant;
		await RestaurantRepo.upsert(restaurant, ['name']);

		let ret = await DiningRepo.save(dining);
		console.log(ret);
		if (ret == null) {
			const error: ErrorResponse = new ErrorResponse(
				400,
				'Adding dining failed',
			);
			callback(error);
		} else {
			callback(null, JSON.stringify(ret.uuid));
		}
	} catch (err: any) {
		callback(
			new ErrorResponse(
				500,
				err?.message ?? 'Adding dining failed',
			),
		);
	}
};
