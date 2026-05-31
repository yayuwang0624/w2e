import { DishReviewEntity } from '../entity/dish-review-entity';
import { ErrorResponse } from '../interface/response';
import { AppDataSource } from '../data-source';

let dishReviewRepo = AppDataSource.getRepository(
    DishReviewEntity,
);

export const GetDishReviews = async (
    params: any,
    callback: (e: ErrorResponse | null, m?: string) => void,
) => {
    let dishReviews = await dishReviewRepo.find();
    callback(null, JSON.stringify(dishReviews));
};
