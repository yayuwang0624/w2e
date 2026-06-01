import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { DishEntity } from './entity/dish-entity';
import { DiningEntity } from './entity/dining-entity';
import { ReviewEntity } from './entity/review-entity';
import { DishReviewEntity } from './entity/dish-review-entity';
import { RestaurantEntity } from './entity/restaurant-entity';
import { ReviewerEntity } from './entity/reviewer-entity';
import { UserEntity } from './entity/user-entity';

export const AppDataSource = new DataSource({
	type: 'sqlite',
	database: 'what2eat_sqlite/what2eat.sqlite',
	synchronize: true,
	logging: false,
	entities: [
		RestaurantEntity,
		ReviewEntity,
		DishReviewEntity,
		ReviewerEntity,
		DishEntity,
		DiningEntity,
		UserEntity,
	],
	migrations: [],
	subscribers: [],
});

export const ReviewRepo = AppDataSource.getRepository(ReviewEntity);
export const DishRepo = AppDataSource.getRepository(DishEntity);
export const RestaurantRepo = AppDataSource.getRepository(RestaurantEntity);
export const DiningRepo = AppDataSource.getRepository(DiningEntity);
export const DishReviewRepo = AppDataSource.getRepository(DishReviewEntity);
export const UserRepo = AppDataSource.getRepository(UserEntity);
