import * as Router from 'koa-router';
import {
  FindCommunityByIdValidator,
  QueryCommunitiesValidator,
} from '../validators/query-communities.validator';
import { Snowflakes } from '../utils/snowflakes';
import { ICommunity, Community } from '../models/community.model';
import { CreateCommunityValidator } from '../validators/create-community.validator';
import { MongoError } from 'mongodb';
import { PatchCommunityValidator } from '../validators/patch-community.validator';
import Joi from 'joi';

const CommunitiesRouter = new Router({
  prefix: '/communities',
});

CommunitiesRouter.get('query_communities', '/', async ctx => {
  const communityQuery = await QueryCommunitiesValidator.validateAsync(
    ctx.request.query,
  ).catch(err => {
    ctx.throw(400, err);
  });

  const query = {
    _id: {
      $lte: Snowflakes.encode(communityQuery.before),
      $gte: Snowflakes.encode(communityQuery.after),
    },
  };

  if (communityQuery.ids) query._id['$in'] = communityQuery.ids;

  if (communityQuery.names) query['names'] = { $in: communityQuery.names };

  const communities: ICommunity[] = await Community.find(query)
    .limit(communityQuery.limit)
    .skip(communityQuery.skip)
    .exec();

  ctx.body = communities.map(com => com.json());
});

CommunitiesRouter.get('get_community', '/:id', async ctx => {
  const communityQuery = await FindCommunityByIdValidator.validateAsync(
    ctx.params,
  ).catch(err => {
    ctx.throw(400, err);
  });

  const community = await Community.findById(communityQuery.id).exec();

  if (!community) {
    return ctx.throw(404, { error: `Community not found` });
  }

  ctx.body = community.json();
});

CommunitiesRouter.post('create_community', '/', async ctx => {
  const communityObj = await CreateCommunityValidator.validateAsync(
    ctx.request.body,
  ).catch(err => {
    ctx.throw(400, JSON.stringify(err));
  });

  const community = await new Community({
    _id: Snowflakes.next(),
    ...communityObj,
  })
    .save()
    .catch((err: MongoError) => {
      if (err.name === 'MongoError' && err.code === 11000) {
        ctx.throw(500, 'This should never happened...');
      }
      ctx.throw(500, { error: err.errmsg });
      return null;
    });

  ctx.response.status = 201;
  ctx.body = community.json();
});

CommunitiesRouter.patch('patch_community', '/:id', async ctx => {
  console.log(ctx.params, ctx.body);
  const [{ id }, patch] = await Promise.all([
    FindCommunityByIdValidator.validateAsync(ctx.params),
    PatchCommunityValidator.validateAsync(ctx.request.body),
  ]).catch((err: Joi.ValidationError) => {
    console.log(err);
    ctx.body = err;
    ctx.response.status = 500;
    return [{ id: null }, null];
  });

  if (!id) return;

  const update = await Community.updateOne({ _id: id }, patch).exec();

  if (!update) {
    return ctx.throw(404);
  }

  if (update.n == 1 && update.nModified == 0) {
    return (ctx.response.status = 304);
  }

  ctx.response.status = 202;
});

export { CommunitiesRouter };
