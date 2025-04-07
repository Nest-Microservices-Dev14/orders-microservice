import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { PrismaClient } from '@prisma/client';
import { RpcException } from '@nestjs/microservices';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { OrderPaginationDto } from './dto/order-pagination.dto';
import { ChangeOrderStatusDto } from './dto/change-order-status.dto';

@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit {

  private readonly logger = new Logger(OrdersService.name);

  async onModuleInit() {
    await this.$connect();
    this.logger.log(`Database Connected`)
  }

  async create(createOrderDto: CreateOrderDto) {
    return {
      message: 'Funcionando mícroservicio',
      createOrderDto
    }
    // return await this.order.create({
    //   data: createOrderDto
    // });
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
      where: { id }
    });

    if( !order ) throw new RpcException({
      status: HttpStatus.NOT_FOUND,
      message: `Order with id ${ id } not found`
    });

    return order;
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