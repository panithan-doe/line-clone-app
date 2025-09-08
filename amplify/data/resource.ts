import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
import { sendMessage } from '../functions/sendMessage/resource';
import { createPrivateChat } from '../functions/createPrivateChat/resource';
import { createGroupChat } from '../functions/createGroupChat/resource';
import { updateProfileImage } from '../functions/updateProfileImage/resource';
import { userAuth } from '../functions/userAuth/resource';
import { markChatAsRead } from '../functions/markChatAsRead/resource';
import { getUnreadCounts } from '../functions/getUnreadCounts/resource';

const schema = a.schema({
  User: a
    .model({
      id: a.id(),
      email: a.string().required(),
      nickname: a.string().required(),
      avatar: a.string(),
      description: a.string(), // Custom user description/status message
      owner: a.string(), // Owner field for authorization
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [
      // Allow authenticated users to create and read any user profile (needed for chat app)
      allow.authenticated().to(['create', 'read']),
      // Allow users to manage their own records
      allow.owner()
    ])
    .identifier(['email']),

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

  MessageReadStatus: a
    .model({
      id: a.id(),
      messageId: a.id().required(),
      userId: a.string().required(),
      readAt: a.datetime(),
      createdAt: a.datetime(),
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
      // Last Read Position fields for performance optimization
      lastReadMessageId: a.id(), // Last message ID that user has read
      lastReadAt: a.datetime(),   // Timestamp when user last read messages
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .secondaryIndexes((index) => [
      index('chatRoomId').sortKeys(['userId']).name('chatRoomId-userId-index'),
      index('userId').name('userId-index')
    ])
    .authorization((allow) => [allow.authenticated()]),

  // Lambda-backed mutations for enhanced functionality
  sendMessage: a
    .mutation()
    .arguments({
      chatRoomId: a.string().required(),
      content: a.string().required(),
      type: a.string(),
      senderId: a.string().required(),
      senderNickname: a.string().required(),
    })
    .returns(a.ref('Message'))
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(sendMessage)),

  createPrivateChat: a
    .mutation()
    .arguments({
      currentUserId: a.string().required(),
      targetUserId: a.string().required(),
      currentUserNickname: a.string().required(),
      targetUserNickname: a.string().required(),
    })
    .returns(a.ref('ChatRoom'))
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(createPrivateChat)),

  createGroupChat: a
    .mutation()
    .arguments({
      name: a.string().required(),
      description: a.string(),
      creatorId: a.string().required(),
      creatorNickname: a.string().required(),
      memberIds: a.string().array().required(),
    })
    .returns(a.ref('ChatRoom'))
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(createGroupChat)),

  updateProfileImage: a
    .mutation()
    .arguments({
      userId: a.string().required(),
      fileName: a.string().required(),
      fileType: a.string().required(),
      fileSize: a.integer().required(),
    })
    .returns(a.json())
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(updateProfileImage)),

  // User management
  createUserAccount: a
    .mutation()
    .arguments({
      email: a.string().required(),
      nickname: a.string().required(),
    })
    .returns(a.ref('User'))
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(userAuth)),

  verifyUser: a
    .query()
    .arguments({
      email: a.string().required(),
    })
    .returns(a.ref('User'))
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(userAuth)),

  updateUserProfile: a
    .mutation()
    .arguments({
      email: a.string().required(),
      nickname: a.string(),
      description: a.string(),
      avatar: a.string(),
    })
    .returns(a.ref('User'))
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(userAuth)),

  // Last Read Position operations for performance optimization
  markChatAsRead: a
    .mutation()
    .arguments({
      chatRoomId: a.string().required(),
      userId: a.string().required(),
      lastMessageId: a.string(),
    })
    .returns(a.ref('ChatRoomMember'))
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(markChatAsRead)),

  getUnreadCounts: a
    .query()
    .arguments({
      userId: a.string().required(),
      chatRoomIds: a.string().array(),
    })
    .returns(a.json())
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(getUnreadCounts)),

});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});