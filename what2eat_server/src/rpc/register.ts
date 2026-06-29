import { ErrorResponse } from '../interface/response';
import { UserRepo, AppDataSource } from '../data-source';
import { ReviewerEntity } from '../entity/reviewer-entity';
import { UserEntity } from '../entity/user-entity';
import {
	generateSalt,
	hashPassword,
} from '../auth/password';
import { signJwt } from '../auth/jwt';
import { getJwtSecret } from '../auth/secret';

const ReviewerRepo =
	AppDataSource.getRepository(ReviewerEntity);

export const Register = async (
	params: {
		username?: string;
		password?: string;
		reviewer?: string;
	},
	callback: (e: ErrorResponse | null, m?: string) => void,
) => {
	const username = params?.username?.trim();
	const password = params?.password;
	const reviewer = params?.reviewer?.trim();

	if (!username || !password || !reviewer) {
		return callback(
			new ErrorResponse(
				400,
				'username, password and reviewer are required',
			),
		);
	}

	// Username must be unique.
	const existingUser = await UserRepo.findOneBy({
		username,
	});
	if (existingUser) {
		return callback(
			new ErrorResponse(
				409,
				'username is already taken',
			),
		);
	}

	// A reviewer can be linked to at most one user account.
	const linked = await UserRepo.findOneBy({ reviewer });
	if (linked) {
		return callback(
			new ErrorResponse(
				409,
				'this reviewer is already linked to another account',
			),
		);
	}

	// Create the reviewer on the fly if this is a new reviewer id.
	const existingReviewer = await ReviewerRepo.findOneBy({
		name: reviewer,
	});
	if (!existingReviewer) {
		const newReviewer = new ReviewerEntity();
		newReviewer.name = reviewer;
		await ReviewerRepo.save(newReviewer);
	}

	const salt = generateSalt();
	const user = new UserEntity();
	user.username = username;
	user.salt = salt;
	user.passwordHash = hashPassword(password, salt);
	user.role = 'user';
	user.reviewer = reviewer;
	// Inactive until an admin approves the account in the DB.
	user.active = false;
	await UserRepo.save(user);

	const token = signJwt(
		{ sub: user.username, role: user.role },
		getJwtSecret(),
	);
	callback(
		null,
		JSON.stringify({
			token,
			user: {
				username: user.username,
				role: user.role,
				reviewer: user.reviewer,
			},
		}),
	);
};
