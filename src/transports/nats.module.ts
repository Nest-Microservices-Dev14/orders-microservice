import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { envs } from 'src/config/envs';
import { NATS_SERVERS } from 'src/config/service';

@Module({
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
    ]
})
export class NatsModule {}
