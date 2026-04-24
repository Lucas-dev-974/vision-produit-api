import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
  Index,
} from 'typeorm';
import { randomUUID } from 'crypto';
import { Product } from './product.entity';

export enum StockUnit {
  KG = 'kg',
  G = 'g',
  BUNCH = 'bunch',
  CRATE = 'crate',
  UNIT = 'unit',
  PIECE = 'piece',
  LITER = 'liter',
}

@Entity('stocks')
export class Stock {
  @PrimaryColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid', name: 'product_id' })
  productId!: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  quantity!: string;

  @Column({
    type: 'enum',
    enum: StockUnit,
    enumName: 'stock_unit_enum',
  })
  unit!: StockUnit;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'unit_price' })
  unitPrice!: string;

  @Column({ type: 'date', name: 'available_from' })
  availableFrom!: string;

  @Column({ type: 'date', name: 'expires_at' })
  expiresAt!: string;

  @BeforeInsert()
  setId(): void {
    if (!this.id) {
      this.id = randomUUID();
    }
  }
}
