import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { NATS_SERVERS } from 'src/config/service';
import { envs } from 'src/config/envs';

@Module({
  controllers: [OrdersController],
  imports: [
    ClientsModule.register([
      {
        name: NATS_SERVERS,
        transport: Transport.NATS,
        options: {
          servers: envs.natsServer
        }
      }
    ])
  ],
  providers: [OrdersService],
})
export class OrdersModule {}
