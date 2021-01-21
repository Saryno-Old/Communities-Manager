import * as dotenv from 'dotenv';
dotenv.config();

import * as Koa from 'koa';
import * as koalogger from 'koa-logger';
import * as koabody from 'koa-body';
import * as Router from 'koa-router';
import { CommunitiesRouter } from './routers/communities.router';
import * as removeTrailingSlashes from 'koa-remove-trailing-slashes';

import * as mongoose from 'mongoose';
import { Logger } from './utils/logger';
import stripAnsi = require('strip-ansi');
import { isHttpError } from 'http-errors';



const uri = process.env.MONGO_URI;

mongoose.connect(uri, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
});

const app = new Koa();

app.use(removeTrailingSlashes());

app.use(
  koalogger((str, args) => {
    const [method, path, response, time, size] = Object.values(args).slice(1);
    Logger.info(stripAnsi(str), { method, path, response, time, size });
  }),
);

app.use(async (ctx, next) => {
  try { 
    await next();
  } catch(e) {
    if(isHttpError(e)) {
      ctx.body = { error: e['error'] };
      ctx.response.status = e.status;
      return;
    }

    ctx.response.status = 500;
  }
})

app.use(koabody());

const BaseRouter = new Router();

BaseRouter.use(CommunitiesRouter.routes());

app.use(BaseRouter.routes());

app.listen(3000);
