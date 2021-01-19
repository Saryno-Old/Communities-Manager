import * as Joi from 'joi';
import { IDValidator, NameValidator } from './community.validator';

export const FindCommunityByIdValidator = Joi.object({
  id: IDValidator.required(),
}).required();

export const QueryCommunitiesValidator = Joi.object({
  ids: Joi.array()
    .items(IDValidator)
    .optional(),
  before: IDValidator.optional().default(() => Date.now()),
  after: IDValidator.optional()
    .default(0)
    .optional(),

  limit: Joi.number()
    .max(250)
    .min(1)
    .default(50)
    .optional(),

  skip: Joi.number()
    .min(0)
    .default(0)
    .optional(),

  names: Joi.array()
    .items(NameValidator.required())
    .optional(),
}).required();
