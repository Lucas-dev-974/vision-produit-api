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
import { Order } from './order.entity';
import { Product } from './product.entity';
import { StockUnit } from './stock.entity';

@Entity('order_items')
export class OrderItem {
  @PrimaryColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid', name: 'order_id' })
  orderId!: string;

  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order!: Order;

  @Column({ type: 'uuid', name: 'product_id' })
  productId!: string;

  @ManyToOne(() => Product, { onDelete: 'RESTRICT' })
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

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'unit_price_snapshot',
  })
  unitPriceSnapshot!: string;

  @BeforeInsert()
  setId(): void {
    if (!this.id) {
      this.id = randomUUID();
    }
  }
}
