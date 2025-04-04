import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { PrismaClient } from '@prisma/client';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit {

  private readonly logger = new Logger(OrdersService.name);

  async onModuleInit() {
    await this.$connect();
    this.logger.log(`Database Connected`)
  }

  async create(createOrderDto: CreateOrderDto) {
    return await this.order.create({
      data: createOrderDto
    });
  }

  async findAll() {
    return await this.order.findMany();
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
}