import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
  Index,
  Unique,
} from 'typeorm';
import { randomUUID } from 'crypto';
import { User } from './user.entity';
import { Order } from './order.entity';

@Entity('ratings')
@Unique('UQ_ratings_order_rater', ['orderId', 'raterId'])
export class Rating {
  @PrimaryColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid', name: 'order_id' })
  orderId!: string;

  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order!: Order;

  @Column({ type: 'uuid', name: 'rater_id' })
  raterId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rater_id' })
  rater!: User;

  @Column({ type: 'uuid', name: 'rated_id' })
  ratedId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rated_id' })
  rated!: User;

  @Column({ type: 'smallint' })
  stars!: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  comment!: string | null;

  @BeforeInsert()
  setId(): void {
    if (!this.id) {
      this.id = randomUUID();
    }
  }
}
