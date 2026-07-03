import { Dining } from '../interface/dining';
import { RestaurantEntity } from './restaurant-entity';

import {
    Entity,
    PrimaryColumn,
    Column,
    JoinColumn,
    ManyToOne,
    ManyToMany,
    CreateDateColumn,
    UpdateDateColumn,
    PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'dining' })
export class DiningEntity implements Dining {
    // @PrimaryColumn({ type: 'uuid' })
    @PrimaryGeneratedColumn('uuid')
    uuid: string;

    @Column({ type: 'text' })
    @ManyToOne(
        () => RestaurantEntity,
        (restaurant: { name: string }) => restaurant.name,
    )
    @JoinColumn([
        {
            name: 'restaurant',
            referencedColumnName: 'name',
        },
    ])
    restaurant: string;

    @Column({ type: 'int' })
    unixTimestamp: number;

    @Column({ nullable: true })
    people: number;

    @Column({ type: 'real', nullable: true })
    price: number;
}
