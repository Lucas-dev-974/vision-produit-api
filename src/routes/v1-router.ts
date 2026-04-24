import { Router } from 'express';
import { authRoutes } from '../modules/auth/auth.routes';
import { publicRoutes } from '../modules/public/public.routes';
import { productsRoutes } from '../modules/products/products.routes';
import { stocksRoutes } from '../modules/stocks/stocks.routes';
import { usersRoutes } from '../modules/users/users.routes';
import { searchRoutes } from '../modules/search/search.routes';
import { ordersRoutes } from '../modules/orders/orders.routes';
import { messagingRoutes } from '../modules/messaging/messaging.routes';
import { conversationsRoutes } from '../modules/conversations/conversations.routes';
import { notificationsRoutes } from '../modules/notifications/notifications.routes';

export const v1Router = Router();

v1Router.get('/health', (_req, res) => {
  res.json({ data: { status: 'ok' } });
});

v1Router.use('/public', publicRoutes);
v1Router.use('/auth', authRoutes);
v1Router.use('/products', productsRoutes);
v1Router.use('/stocks', stocksRoutes);
v1Router.use('/users', usersRoutes);
v1Router.use('/search', searchRoutes);
v1Router.use('/orders', ordersRoutes);
v1Router.use('/messaging', messagingRoutes);
v1Router.use('/conversations', conversationsRoutes);
v1Router.use('/notifications', notificationsRoutes);
