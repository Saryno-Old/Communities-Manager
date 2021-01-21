import { SubscribeType, Publisher, Event } from 'kubets';

export { Event };

export const Events =
  process.env.ENABLE_KUBEMQ === 'true'
    ? new Publisher({
        host: process.env.KUBEMQ_HOST || 'localhost',
        port: Number(process.env.KUBEMQ_PORT) || 5000,
        channel: `internal_community_members`,
        client: `internal_community_members_client`,
        type: SubscribeType.Events,
      })
    : null;

export enum EventType {
  COMMUNITY_JOIN = 1,
  COMMUNITY_LEAVE = 2,
}

export const makeEvent = (type: EventType, data: any) => {
  const event = new Event();
  event.setBody(Buffer.from(JSON.stringify({ type, data })).toString('base64'));
  return event;
};

export const sendEvent = (type: EventType, data: any) => {
  if (Events) Events.send(makeEvent(type, data));
};
