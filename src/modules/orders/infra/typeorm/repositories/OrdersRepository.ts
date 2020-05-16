import { getRepository, Repository } from 'typeorm';

import IOrdersRepository from '@modules/orders/repositories/IOrdersRepository';
import ICreateOrderDTO from '@modules/orders/dtos/ICreateOrderDTO';
import Order from '../entities/Order';
import OrdersProducts from '../entities/OrdersProducts';

class OrdersRepository implements IOrdersRepository {
  private ormRepository: Repository<Order>;

  private orderProductRepository: Repository<OrdersProducts>;

  constructor() {
    this.ormRepository = getRepository(Order);
    this.orderProductRepository = getRepository(OrdersProducts);
  }

  public async create({ customer, products }: ICreateOrderDTO): Promise<Order> {
    const newOrder = this.ormRepository.create({
      customer,
      order_products: products,
    });

    const order = await this.ormRepository.save(newOrder);

    return order;
  }

  public async findById(id: string): Promise<Order | undefined> {
    return this.ormRepository.findOne(
      {
        id,
      },
      { relations: ['customer', 'order_products'] },
    );
  }
}

export default OrdersRepository;
