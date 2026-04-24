import { AppDataSource } from '../../config/data-source';
import { AppError } from '../../common/errors/app-error';
import { Product } from '../../entities/product.entity';
import { Stock, StockUnit } from '../../entities/stock.entity';

export interface StockDto {
  id: string;
  productId: string;
  quantity: string;
  unit: StockUnit;
  unitPrice: string;
  availableFrom: string;
  expiresAt: string;
}

function toDto(s: Stock): StockDto {
  return {
    id: s.id,
    productId: s.productId,
    quantity: s.quantity,
    unit: s.unit,
    unitPrice: s.unitPrice,
    availableFrom: s.availableFrom,
    expiresAt: s.expiresAt,
  };
}

async function assertProductOwned(
  producerId: string,
  productId: string,
): Promise<Product> {
  const productRepo = AppDataSource.getRepository(Product);
  const product = await productRepo.findOne({
    where: { id: productId, producerId },
  });
  if (!product) {
    throw new AppError('NOT_FOUND', 'Produit introuvable', 404);
  }
  return product;
}

async function assertStockOwned(
  producerId: string,
  stockId: string,
): Promise<Stock> {
  const stockRepo = AppDataSource.getRepository(Stock);
  const stock = await stockRepo
    .createQueryBuilder('s')
    .innerJoin('s.product', 'p')
    .where('s.id = :stockId', { stockId })
    .andWhere('p.producer_id = :producerId', { producerId })
    .getOne();
  if (!stock) {
    throw new AppError('NOT_FOUND', 'Stock introuvable', 404);
  }
  return stock;
}

export const stocksService = {
  async listMineActive(producerId: string): Promise<StockDto[]> {
    const today = new Date().toISOString().slice(0, 10);
    const stockRepo = AppDataSource.getRepository(Stock);
    const rows = await stockRepo
      .createQueryBuilder('s')
      .innerJoin('s.product', 'p')
      .where('p.producer_id = :producerId', { producerId })
      .andWhere('s.expires_at >= :today', { today })
      .andWhere('s.quantity::numeric > 0')
      .orderBy('s.expires_at', 'ASC')
      .addOrderBy('s.id', 'ASC')
      .getMany();
    return rows.map(toDto);
  },

  async create(
    producerId: string,
    input: {
      productId: string;
      quantity: number;
      unit: StockUnit;
      unitPrice: number;
      availableFrom: string;
      expiresAt: string;
    },
  ): Promise<StockDto> {
    await assertProductOwned(producerId, input.productId);
    const stockRepo = AppDataSource.getRepository(Stock);
    const stock = stockRepo.create({
      productId: input.productId,
      quantity: input.quantity.toFixed(2),
      unit: input.unit,
      unitPrice: input.unitPrice.toFixed(2),
      availableFrom: input.availableFrom,
      expiresAt: input.expiresAt,
    });
    await stockRepo.save(stock);
    return toDto(stock);
  },

  async update(
    stockId: string,
    producerId: string,
    input: Partial<{
      quantity: number;
      unit: StockUnit;
      unitPrice: number;
      availableFrom: string;
      expiresAt: string;
    }>,
  ): Promise<StockDto> {
    const stockRepo = AppDataSource.getRepository(Stock);
    const stock = await assertStockOwned(producerId, stockId);
    if (input.quantity !== undefined) stock.quantity = input.quantity.toFixed(2);
    if (input.unit !== undefined) stock.unit = input.unit;
    if (input.unitPrice !== undefined) stock.unitPrice = input.unitPrice.toFixed(2);
    if (input.availableFrom !== undefined) stock.availableFrom = input.availableFrom;
    if (input.expiresAt !== undefined) stock.expiresAt = input.expiresAt;
    const from = stock.availableFrom;
    const to = stock.expiresAt;
    if (to < from) {
      throw new AppError(
        'VALIDATION_ERROR',
        'La date de fin doit être postérieure ou égale au début',
        400,
      );
    }
    await stockRepo.save(stock);
    return toDto(stock);
  },

  async delete(stockId: string, producerId: string): Promise<void> {
    const stockRepo = AppDataSource.getRepository(Stock);
    const stock = await assertStockOwned(producerId, stockId);
    await stockRepo.remove(stock);
  },
};
