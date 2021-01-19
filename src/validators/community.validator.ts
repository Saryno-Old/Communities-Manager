import * as Joi from 'joi';

export const IDValidator = Joi.string().custom((value, helpers) => {
  console.log(value, isNaN(Number(value)) ? ':(' : value);
  return isNaN(Number(value)) ? helpers.error('Not Numeric') : value;
});

export const NameValidator = Joi.string()
  .min(1)
  .max(200);

export const IconValidator = Joi.string();
