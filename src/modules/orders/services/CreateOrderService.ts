import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Product from '@modules/products/infra/typeorm/entities/Product';
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
class CreateProductService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,

    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,

    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) {
      throw new AppError('Customer does not exist');
    }

    const productsInStock = await this.productsRepository.findAllById(products);

    if (productsInStock.length !== products.length) {
      throw new AppError('Product does not exist');
    }

    const productList = [] as Product[];

    products.forEach(orderedProduct => {
      const currentStock = productsInStock.find(
        product => product.id === orderedProduct.id,
      );

      if (!currentStock) {
        throw new AppError('Product does not exist');
      }

      if (orderedProduct.quantity > currentStock.quantity) {
        throw new AppError('Insuficient quantity');
      }

      productList.push({
        ...currentStock,
        quantity: orderedProduct.quantity,
      });
    });

    await this.productsRepository.updateQuantity(productList);

    const alteredProducts = productList.map(product => ({
      product_id: product.id,
      price: product.price,
      quantity: product.quantity,
    }));

    const order = await this.ordersRepository.create({
      customer,
      products: alteredProducts,
    });

    return order;
  }
}

export default CreateProductService;
