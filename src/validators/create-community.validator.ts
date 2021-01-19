import * as Joi from 'joi';
import {
  IconValidator,
  IDValidator,
  NameValidator,
} from './community.validator';

export const CreateCommunityValidator = Joi.object({
  name: NameValidator.required(),
  owner_id: IDValidator.required(),
  icon: IconValidator.base64({ urlSafe: true }).optional(),
}).required();
