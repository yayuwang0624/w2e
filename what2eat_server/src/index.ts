import 'dotenv/config';
import * as jayson from 'jayson';
import { AppDataSource } from './data-source';
import * as cors from 'cors';
import * as connect from 'connect';
import { json as jsonParser } from 'body-parser';
import * as morgan from 'morgan';

import { Migrate } from './migrate';
import { AddDish, AddDishes } from './rpc/add-dish';
import { AddReview } from './rpc/add-review';
import { AddDining } from './rpc/add-dining';
import { GetDishesByRestaurant } from './rpc/get-dishes';
import { GetDishesByReview } from './rpc/get-dishes-review';
import { GetDishReviews } from './rpc/get-dish-reviews';
import { GetDinings } from './rpc/get-dinings';
import { GetReviews } from './rpc/get-reviews';
import { GetReviewers } from './rpc/get-reviewers';
import { GetRestaurants } from './rpc/get-restaurants';
import { SubmitReviewForm } from './rpc/submit-review-form';
import { Login } from './rpc/login';
import { Me } from './rpc/me';
import { Register } from './rpc/register';
import { ParseReceipt } from './rpc/parse-receipt';

async function main() {
	const app = connect();

	// create a server
	const server = new jayson.Server({
		add_dish: AddDish,
		add_dishes: AddDishes,
		add_review: AddReview,
		add_dining: AddDining,
		get_dishes_by_review: GetDishesByReview,
		get_dish_reviews: GetDishReviews,
		get_dishes_by_restaurant: GetDishesByRestaurant,
		get_dining: GetDinings,
		get_reviews: GetReviews,
		get_reviewers: GetReviewers,
		get_restaurants: GetRestaurants,
		submit_review_form: SubmitReviewForm,
		login: Login,
		me: Me,
		register: Register,
		parse_receipt: ParseReceipt,
	});

	await AppDataSource.initialize();

	// Migrate();

	app.use(morgan('combined'));
	app.use(cors({ methods: ['POST'] }));
	app.use(jsonParser({ limit: '15mb' }));
	app.use(server.middleware());
	app.listen(5000);
}

main();
