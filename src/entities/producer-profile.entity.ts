import {
  Entity,
  PrimaryColumn,
  Column,
  OneToOne,
  JoinColumn,
  BeforeInsert,
} from 'typeorm';
import { randomUUID } from 'crypto';
import { User } from './user.entity';
import {
  DOUBLE_TYPE,
  JSON_ARRAY_DEFAULT,
  JSON_TYPE,
  uuidPrimaryColumn,
} from '../config/db-types';

@Entity('producer_profiles')
export class ProducerProfile {
  @PrimaryColumn(uuidPrimaryColumn())
  id!: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: DOUBLE_TYPE, name: 'public_location_lat', nullable: true })
  publicLocationLat!: number | null;

  @Column({ type: DOUBLE_TYPE, name: 'public_location_lng', nullable: true })
  publicLocationLng!: number | null;

  @Column({ type: DOUBLE_TYPE, name: 'average_rating', default: 0 })
  averageRating!: number;

  @Column({ type: 'int', name: 'total_ratings', default: 0 })
  totalRatings!: number;

  @Column({ type: DOUBLE_TYPE, name: 'reliability_score', default: 0 })
  reliabilityScore!: number;

  @Column({ type: 'int', name: 'total_orders', default: 0 })
  totalOrders!: number;

  @Column({
    type: JSON_TYPE,
    name: 'additional_photos',
    default: JSON_ARRAY_DEFAULT,
  })
  additionalPhotos!: string[];

  @BeforeInsert()
  setId(): void {
    if (!this.id) {
      this.id = randomUUID();
    }
  }
}
