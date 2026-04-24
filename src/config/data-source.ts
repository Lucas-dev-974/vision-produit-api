import 'reflect-metadata';
import path from 'path';
import { DataSource } from 'typeorm';
import { env } from './env';
import { User } from '../entities/user.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { ProducerProfile } from '../entities/producer-profile.entity';
import { Product } from '../entities/product.entity';
import { Stock } from '../entities/stock.entity';
import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { Conversation } from '../entities/conversation.entity';
import { Message } from '../entities/message.entity';
import { Rating } from '../entities/rating.entity';
import { Report } from '../entities/report.entity';
import { EmailVerificationToken } from '../entities/email-verification-token.entity';
import { PasswordResetToken } from '../entities/password-reset-token.entity';

export const AppDataSource = new DataSource({
  type: env.DB_TYPE || 'mysql',
  host: env.DB_HOST,
  port: env.DB_PORT,
  username: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  entities: [
    User,
    RefreshToken,
    ProducerProfile,
    Product,
    Stock,
    Order,
    OrderItem,
    Conversation,
    Message,
    Rating,
    Report,
    EmailVerificationToken,
    PasswordResetToken,
  ],
  migrations: [path.join(__dirname, '..', 'migrations', '*.{ts,js}')],
  synchronize: env.DB_SYNC,
  logging: env.NODE_ENV === 'development',
});
