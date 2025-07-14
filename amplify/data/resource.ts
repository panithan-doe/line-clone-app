import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  User: a
    .model({
      id: a.id(),
      email: a.string().required(),
      nickname: a.string().required(),
      avatar: a.string(),
      status: a.string().default('online'),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [
      // ให้ authenticated user สามารถสร้าง record ได้
      allow.authenticated().to(['create', 'read']),
      // ให้ owner สามารถจัดการ record ของตัวเองได้
      allow.owner()
    ]),

  ChatRoom: a
    .model({
      id: a.id(),
      name: a.string().required(),
      type: a.string().required(), // 'private' or 'group'
      description: a.string(),
      avatar: a.string(),
      lastMessage: a.string(),
      lastMessageAt: a.datetime(),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [allow.authenticated()]),

  Message: a
    .model({
      id: a.id(),
      content: a.string().required(),
      type: a.string().default('text'), // 'text', 'image', 'file'
      chatRoomId: a.id().required(),
      senderId: a.string().required(),
      senderNickname: a.string().required(),
      isRead: a.boolean().default(false),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [allow.authenticated()]),

  ChatRoomMember: a
    .model({
      id: a.id(),
      chatRoomId: a.id().required(),
      userId: a.string().required(),
      userNickname: a.string().required(),
      role: a.string().default('member'), // 'admin', 'member'
      joinedAt: a.datetime(),
    })
    .authorization((allow) => [allow.authenticated()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});