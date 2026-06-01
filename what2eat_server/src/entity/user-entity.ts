import {
    Entity,
    PrimaryColumn,
    Column,
    CreateDateColumn,
} from 'typeorm';

@Entity({ name: 'user' })
export class UserEntity {
    @PrimaryColumn('text')
    username: string;

    @Column({ type: 'text' })
    passwordHash: string;

    @Column({ type: 'text' })
    salt: string;

    @Column({ type: 'text', default: 'user' })
    role: string;

    @CreateDateColumn()
    createdAt: Date;
}
