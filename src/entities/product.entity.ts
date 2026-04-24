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
  @PrimaryColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid', name: 'producer_id' })
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

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @BeforeInsert()
  setId(): void {
    if (!this.id) {
      this.id = randomUUID();
    }
  }
}
