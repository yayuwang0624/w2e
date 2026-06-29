import { verifyJwt, JwtPayload } from './jwt';
import { getJwtSecret } from './secret';
import { ErrorResponse } from '../interface/response';
import { UserRepo } from '../data-source';
import { UserEntity } from '../entity/user-entity';

export const verifyAuthToken = (
	token?: string,
): JwtPayload | null => {
	if (!token) return null;
	return verifyJwt(token, getJwtSecret());
};

export const ensureAuthed = (
	token: string | undefined,
	callback: (e: ErrorResponse | null, m?: string) => void,
): JwtPayload | null => {
	const payload = verifyAuthToken(token);
	if (!payload) {
		callback(
			new ErrorResponse(
				401,
				'authentication required',
			),
		);
		return null;
	}
	return payload;
};

export const ensureActiveUser = async (
	token: string | undefined,
	callback: (e: ErrorResponse | null, m?: string) => void,
): Promise<UserEntity | null> => {
	const payload = verifyAuthToken(token);
	if (!payload) {
		callback(
			new ErrorResponse(
				401,
				'authentication required',
			),
		);
		return null;
	}
	const user = await UserRepo.findOneBy({
		username: payload.sub,
	});
	if (!user) {
		callback(
			new ErrorResponse(401, 'user no longer exists'),
		);
		return null;
	}
	if (!user.active) {
		callback(
			new ErrorResponse(
				403,
				'your account is not active yet; an admin must approve it',
			),
		);
		return null;
	}
	return user;
};
