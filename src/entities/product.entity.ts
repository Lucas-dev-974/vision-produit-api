import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  Index,
} from 'typeorm';
import { randomUUID } from 'crypto';
import { User } from './user.entity';
import { TIMESTAMPTZ_TYPE, uuidColumn, uuidPrimaryColumn } from '../config/db-types';

export enum ProductCategory {
  FRUITS = 'fruits',
  VEGETABLES = 'vegetables',
  EGGS = 'eggs',
  HONEY = 'honey',
  POULTRY = 'poultry',
  FISH = 'fish',
  OTHER = 'other',
}

@Entity('products')
export class Product {
  @PrimaryColumn(uuidPrimaryColumn())
  id!: string;

  @Index()
  @Column(uuidColumn({ name: 'producer_id' }))
  producerId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'producer_id' })
  producer!: User;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({
    type: 'enum',
    enum: ProductCategory,
    enumName: 'product_category_enum',
  })
  category!: ProductCategory;

  @Column({ type: 'text' })
  description!: string;

  @CreateDateColumn({ name: 'created_at', type: TIMESTAMPTZ_TYPE })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: TIMESTAMPTZ_TYPE })
  updatedAt!: Date;

  @BeforeInsert()
  setId(): void {
    if (!this.id) {
      this.id = randomUUID();
    }
  }
}
