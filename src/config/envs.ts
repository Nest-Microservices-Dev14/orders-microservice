import 'dotenv/config';
import * as joi from 'joi';

interface EnvVars {
    PORT: number,
    productsMicroserviceHost: string,
    productsMicroservicePort: number
}

const envsSchema = joi.object({
    PORT: joi.number().required(),
    productsMicroserviceHost: joi.string().required(),
    productsMicroservicePort: joi.number().required()
})
.unknown(true);

const { error, value } = envsSchema.validate(process.env);

if( error ) throw new Error(`Config validation error: ${ error.message }`);

const envVars: EnvVars = value;

export const envs = {
    PORT: envVars.PORT,
    productsMicroserviceHost: envVars.productsMicroserviceHost,
    productsMicroservicePort: envVars.productsMicroservicePort
}