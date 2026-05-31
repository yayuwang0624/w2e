import { ErrorResponse } from '../interface/response';
import { AppDataSource } from '../data-source';
import { ReviewEntity } from '../entity/review-entity';
import { DiningEntity } from '../entity/dining-entity';

let reviewRepo = AppDataSource.getRepository(ReviewEntity);
let diningRepo = AppDataSource.getRepository(DiningEntity);

export const GetReviews = async (
    params: any,
    callback: (e: ErrorResponse | null, m?: string) => void,
) => {
    let reviews = await reviewRepo.find();
    let dinings = await diningRepo.find();

    const diningTime = new Map<string, number>();
    for (const dining of dinings) {
        diningTime.set(dining.uuid, dining.unixTimestamp);
    }

    const result = reviews.map((review) => ({
        ...review,
        unixTimestamp: diningTime.get(review.dining) ?? null,
    }));

    callback(null, JSON.stringify(result));
};
