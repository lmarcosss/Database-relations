import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrderRepository')
    private ordersRepository: IOrdersRepository,

    @inject('ProductRepository')
    private productsRepository: IProductsRepository,

    @inject('CustomerRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) {
      throw new AppError("User doesn't exists.");
    }

    const findProducts = await this.productsRepository.findAllById(products);

    if (findProducts.length !== products.length) {
      throw new AppError("One or more products don't exists.");
    }

    const insufficientQuantities = findProducts.some((product, index) => {
      const quantityProduct = product.quantity - products[index].quantity;

      return quantityProduct < 0;
    });

    if (insufficientQuantities) {
      throw new AppError(
        "One or more products doesn't have enough quantities.",
      );
    }

    const modifiedProducts = findProducts.map((product, index) => {
      return {
        ...product,
        quantity: product.quantity - products[index].quantity,
      };
    });

    const updatedProducts = await this.productsRepository.updateQuantity(
      modifiedProducts,
    );

    const newProducts = products.map((product, index) => {
      return {
        product_id: product.id,
        quantity: product.quantity,
        price: updatedProducts[index].price,
      };
    });

    const order = await this.ordersRepository.create({
      customer,
      products: newProducts,
    });

    return order;
  }
}

export default CreateOrderService;
