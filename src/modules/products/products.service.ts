import { AppDataSource } from '../../config/data-source';
import { AppError } from '../../common/errors/app-error';
import { Product, ProductCategory } from '../../entities/product.entity';

export interface ProductDto {
  id: string;
  producerId: string;
  name: string;
  category: ProductCategory;
  description: string;
  createdAt: string;
  updatedAt: string;
}

function toDto(p: Product): ProductDto {
  return {
    id: p.id,
    producerId: p.producerId,
    name: p.name,
    category: p.category,
    description: p.description,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

export const productsService = {
  async listMine(producerId: string): Promise<ProductDto[]> {
    const repo = AppDataSource.getRepository(Product);
    const rows = await repo.find({
      where: { producerId },
      order: { name: 'ASC' },
    });
    return rows.map(toDto);
  },

  async create(
    producerId: string,
    input: { name: string; category: ProductCategory; description: string },
  ): Promise<ProductDto> {
    const repo = AppDataSource.getRepository(Product);
    const product = repo.create({
      producerId,
      name: input.name,
      category: input.category,
      description: input.description,
    });
    await repo.save(product);
    return toDto(product);
  },

  async getById(id: string): Promise<ProductDto> {
    const repo = AppDataSource.getRepository(Product);
    const product = await repo.findOne({ where: { id } });
    if (!product) {
      throw new AppError('NOT_FOUND', 'Produit introuvable', 404);
    }
    return toDto(product);
  },

  async update(
    id: string,
    producerId: string,
    input: Partial<{ name: string; category: ProductCategory; description: string }>,
  ): Promise<ProductDto> {
    const repo = AppDataSource.getRepository(Product);
    const product = await repo.findOne({ where: { id, producerId } });
    if (!product) {
      throw new AppError('NOT_FOUND', 'Produit introuvable', 404);
    }
    if (input.name !== undefined) product.name = input.name;
    if (input.category !== undefined) product.category = input.category;
    if (input.description !== undefined) product.description = input.description;
    await repo.save(product);
    return toDto(product);
  },

  async delete(id: string, producerId: string): Promise<void> {
    const repo = AppDataSource.getRepository(Product);
    const res = await repo.delete({ id, producerId });
    if (!res.affected) {
      throw new AppError('NOT_FOUND', 'Produit introuvable', 404);
    }
  },
};
