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

@Entity('producer_profiles')
export class ProducerProfile {
  @PrimaryColumn('uuid')
  id!: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'double precision', name: 'public_location_lat', nullable: true })
  publicLocationLat!: number | null;

  @Column({ type: 'double precision', name: 'public_location_lng', nullable: true })
  publicLocationLng!: number | null;

  @Column({ type: 'double precision', name: 'average_rating', default: 0 })
  averageRating!: number;

  @Column({ type: 'int', name: 'total_ratings', default: 0 })
  totalRatings!: number;

  @Column({ type: 'double precision', name: 'reliability_score', default: 0 })
  reliabilityScore!: number;

  @Column({ type: 'int', name: 'total_orders', default: 0 })
  totalOrders!: number;

  @Column({
    type: 'jsonb',
    name: 'additional_photos',
    default: () => "'[]'::jsonb",
  })
  additionalPhotos!: string[];

  @BeforeInsert()
  setId(): void {
    if (!this.id) {
      this.id = randomUUID();
    }
  }
}
