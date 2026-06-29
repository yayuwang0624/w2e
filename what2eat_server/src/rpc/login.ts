import { ErrorResponse } from '../interface/response';
import { UserRepo } from '../data-source';
import { verifyPassword } from '../auth/password';
import { signJwt } from '../auth/jwt';
import { getJwtSecret } from '../auth/secret';

export const Login = async (
	params: { username?: string; password?: string },
	callback: (e: ErrorResponse | null, m?: string) => void,
) => {
	const { username, password } = params || {};
	if (!username || !password) {
		return callback(
			new ErrorResponse(
				400,
				'username and password are required',
			),
		);
	}

	const user = await UserRepo.findOneBy({ username });
	if (
		!user ||
		!verifyPassword(
			password,
			user.salt,
			user.passwordHash,
		)
	) {
		return callback(
			new ErrorResponse(
				401,
				'invalid username or password',
			),
		);
	}

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
