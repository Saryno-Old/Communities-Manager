import { Document, Model, model, Schema } from 'mongoose';
import { SnowflakeID, SnowflakeSchemaID } from './id';

const CommunitySchema = new Schema(
  {
    _id: { type: SnowflakeSchemaID },

    name: { type: String, min: 1, max: 200, required: true },
    icon: { type: String },

    owner_id: { type: SnowflakeSchemaID, required: true },
  },
  { versionKey: false },
);

export interface ICommunity extends Document {
  _id: SnowflakeID;

  name: string;
  icon?: string;

  // eslint-disable-next-line
  owner_id: SnowflakeID;

  json(): JSON;
}

export interface ICommuniyStatics extends Model<ICommunity> {
  empty: never;
}

CommunitySchema.methods.json = function() {
  const community = this as ICommunity;

  return {
    id: community._id,
    name: community.name,
    icon: community.icon,
    owner_id: community.owner_id,
  };
};

export const Community = model<ICommunity>(
  'Community',
  CommunitySchema,
  'communities',
);
