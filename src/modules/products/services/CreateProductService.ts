import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import Product from '../infra/typeorm/entities/Product';
import IProductsRepository from '../repositories/IProductsRepository';

interface IRequest {
  name: string;
  price: number;
  quantity: number;
}

@injectable()
class CreateProductService {
  constructor(
    @inject('ProductRepository')
    private productsRepository: IProductsRepository,
  ) {}

  public async execute({ name, price, quantity }: IRequest): Promise<Product> {
    const checkIfProductExists = await this.productsRepository.findByName(name);

    if (checkIfProductExists) {
      throw new AppError('Product already exists.');
    }

    const product = this.productsRepository.create({ name, price, quantity });

    return product;
  }
}

export default CreateProductService;
