import * as Router from 'koa-router';
import {
  FindCommunityByIdValidator,
  QueryCommunitiesValidator,
} from '../validators/query-communities.validator';
import { Snowflakes } from '../utils/snowflakes';
import { ICommunity, Community } from '../models/community.model';
import { CreateCommunityValidator } from '../validators/create-community.validator';

import { PatchCommunityValidator } from '../validators/patch-community.validator';
import Joi from 'joi';
import { EventType, sendEvent } from '../events/events';


const CommunitiesRouter = new Router({
  prefix: '/communities',
});

CommunitiesRouter.get('query_communities', '/', async ctx => {
  const communityQuery = await QueryCommunitiesValidator.validateAsync(
    ctx.request.query,
  ).catch((err: Joi.ValidationError) => {
    ctx.throw(400, {
      error: {
        type: 'validation-error',
        details: err.details,
      },
    });
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
  ).catch((err: Joi.ValidationError) => {
    ctx.throw(400, {
      error: {
        type: 'validation-error',
        details: err.details,
      },
    });
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
  ).catch((err: Joi.ValidationError) => {
    ctx.throw(400, {
      error: {
        type: 'validation-error',
        details: err.details,
      },
    });
  });

  const community = await new Community({
    _id: Snowflakes.next(),
    ...communityObj,
  })
    .save()
    .catch(() => ctx.throw(500));

  ctx.response.status = 201;
  ctx.body = community.json();
  setImmediate(async () => {
    sendEvent(EventType.COMMUNITY_CREATE, {
      id: community.id,
      name: community.name,
    });
  });
});

CommunitiesRouter.patch('patch_community', '/:id', async ctx => {
  const [{ id }, patch] = await Promise.all([
    FindCommunityByIdValidator.validateAsync(ctx.params),
    PatchCommunityValidator.validateAsync(ctx.request.body),
  ]).catch((err: Joi.ValidationError) => {
    return ctx.throw(400, {
      error: {
        type: 'validation-error',
        details: err.details,
      },
    });
  });

  const update = await Community.updateOne({ _id: id }, patch).exec();

  if (!update) {
    return ctx.throw(404);
  }

  if (update.n == 1 && update.nModified == 0) {
    return (ctx.response.status = 304);
  }

  ctx.response.status = 202;
setImmediate(async () => {
  sendEvent(EventType.COMMUNITY_UPDATE, { id });
});

});

export { CommunitiesRouter };
