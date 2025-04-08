import { HttpStatus, Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { PrismaClient } from '@prisma/client';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { OrderPaginationDto } from './dto/order-pagination.dto';
import { ChangeOrderStatusDto } from './dto/change-order-status.dto';
import { PRODUCT_SERVICE } from 'src/config/service';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit {

  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @Inject(PRODUCT_SERVICE) private readonly productClient: ClientProxy
  ){
    super();
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log(`Database Connected`)
  }

  async create(createOrderDto: CreateOrderDto) {
    try {
      const productsIds = createOrderDto.items.map((item)=> item.productId);
      const products = await firstValueFrom(
        this.productClient.send({cmd: 'validate_products'}, productsIds)
      );
      //2. Cálculos de los valores
      const totalAmount = createOrderDto.items.reduce((acc, orderItem) => {
        const price = products.find(
          (product) => product.id === orderItem.productId
        ).price;
        acc += price * orderItem.quantity;
        return acc;
      }, 0);

      const totalItems = createOrderDto.items.reduce((acc, orderItem) => {
        return acc + orderItem.quantity;
      }, 0);

      const order = await this.order.create({
        data: {
          totalAmount,
          totalItems,
          OrderItem: {
            createMany: {
              data: createOrderDto.items.map( (orderItem) => ({
                price: products.find(
                  (product) => product.id === orderItem.productId
                ).price,
                productId: orderItem.productId,
                quantity: orderItem.quantity
              }))
            }
          }
        },
        include: {
          OrderItem: {
            select: {
              price: true,
              quantity: true,
              productId: true
            }
          }
        }
      })

      return {
        ...order,
        OrderItem: order.OrderItem.map((orderItem)=> ({
          ...orderItem,
          name: products.find(
            (product) => product.id === orderItem.productId
          ).name
        }))
      };
    } catch (error) {
      throw new RpcException(error);
    }
    
  }

  async findAll(orderPaginationDto: OrderPaginationDto) {

    const { page, limit, status } = orderPaginationDto;
    
    const totalPages = await this.order.count({
      where: { status }
    });
    const currentPage = page;
    const perPage = Math.ceil(totalPages / limit);

    return {
      data: await this.order.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where: { status }
      }),
      meta:{
        total: totalPages,
        page: currentPage,
        lastPage: perPage,
      }
    }
  }

  async findOne(id: string) {
    
    const order = await this.order.findFirst({
      where: { id },
      include: {
        OrderItem: {
          select: {
            productId: true,
            price: true,
            quantity: true
          }
        }
      }
    });

    if( !order ) throw new RpcException({
      status: HttpStatus.NOT_FOUND,
      message: `Order with id ${ id } not found`
    });
    const productIds = order.OrderItem.map((orderItem)=>orderItem.productId)
    const products = await firstValueFrom(
      this.productClient.send({ cmd: 'validate_products'}, productIds)
    );

    return {
      ...order,
      OrderItem: order.OrderItem.map((orderItem)=> ({
        ...orderItem,
        name: products.find(
          (product) => product.id === orderItem.productId
        ).name
      }))
    };
  }

  async changeStatus(changeOrderStatusDto: ChangeOrderStatusDto){

    const { id, status } = changeOrderStatusDto;

    const order = await this.findOne( id );

    if( status === order.status ) return order;

    return this.order.update({
      where: { id },
      data: { status }
    });

  }
}