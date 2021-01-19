import * as mongoose from 'mongoose';

import * as mongooselong from 'mongoose-long';
mongooselong(mongoose);

export type SnowflakeID = any;

export const {
  Types: { Long: SnowflakeSchemaID },
} = mongoose as any;
