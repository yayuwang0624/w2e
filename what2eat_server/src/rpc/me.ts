import { ErrorResponse } from '../interface/response';
import { UserRepo } from '../data-source';
import { verifyAuthToken } from '../auth/require-auth';

export const Me = async (
	params: { token?: string },
	callback: (e: ErrorResponse | null, m?: string) => void,
) => {
	const payload = verifyAuthToken(params?.token);
	if (!payload) {
		return callback(
			new ErrorResponse(
				401,
				'invalid or expired token',
			),
		);
	}

	const user = await UserRepo.findOneBy({
		username: payload.sub,
	});
	if (!user) {
		return callback(
			new ErrorResponse(401, 'user no longer exists'),
		);
	}

	callback(
		null,
		JSON.stringify({
			username: user.username,
			role: user.role,
			reviewer: user.reviewer,
			active: user.active,
		}),
	);
};
