import 'reflect-metadata';
import { AppDataSource } from './data-source';
import { UserEntity } from './entity/user-entity';
import { generateSalt, hashPassword } from './auth/password';

// Manually provision a user (public sign-up is closed).
//   npm run seed-user -- <username> <password> [role]
async function main() {
    const [, , username, password, role] = process.argv;
    if (!username || !password) {
        console.error(
            'Usage: npm run seed-user -- <username> <password> [role]',
        );
        process.exit(1);
    }

    await AppDataSource.initialize();
    const repo = AppDataSource.getRepository(UserEntity);

    const salt = generateSalt();
    const user = new UserEntity();
    user.username = username;
    user.salt = salt;
    user.passwordHash = hashPassword(password, salt);
    user.role = role || 'user';

    await repo.save(user);
    console.log(
        `User '${username}' (role: ${user.role}) created/updated.`,
    );

    await AppDataSource.destroy();
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
