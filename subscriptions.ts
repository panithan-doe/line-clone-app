/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "./API";
type GeneratedSubscription<InputType, OutputType> = string & {
  __generatedSubscriptionInput: InputType;
  __generatedSubscriptionOutput: OutputType;
};

export const onCreateChatRoom = /* GraphQL */ `subscription OnCreateChatRoom($filter: ModelSubscriptionChatRoomFilterInput) {
  onCreateChatRoom(filter: $filter) {
    avatar
    createdAt
    description
    id
    lastMessage
    lastMessageAt
    name
    type
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateChatRoomSubscriptionVariables,
  APITypes.OnCreateChatRoomSubscription
>;
export const onCreateChatRoomMember = /* GraphQL */ `subscription OnCreateChatRoomMember(
  $filter: ModelSubscriptionChatRoomMemberFilterInput
) {
  onCreateChatRoomMember(filter: $filter) {
    chatRoomId
    createdAt
    id
    joinedAt
    role
    updatedAt
    userId
    userNickname
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateChatRoomMemberSubscriptionVariables,
  APITypes.OnCreateChatRoomMemberSubscription
>;
export const onCreateMessage = /* GraphQL */ `subscription OnCreateMessage($filter: ModelSubscriptionMessageFilterInput) {
  onCreateMessage(filter: $filter) {
    chatRoomId
    content
    createdAt
    id
    isRead
    senderId
    senderNickname
    type
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateMessageSubscriptionVariables,
  APITypes.OnCreateMessageSubscription
>;
export const onCreateMessageReadStatus = /* GraphQL */ `subscription OnCreateMessageReadStatus(
  $filter: ModelSubscriptionMessageReadStatusFilterInput
) {
  onCreateMessageReadStatus(filter: $filter) {
    createdAt
    id
    messageId
    readAt
    updatedAt
    userId
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateMessageReadStatusSubscriptionVariables,
  APITypes.OnCreateMessageReadStatusSubscription
>;
export const onCreateUser = /* GraphQL */ `subscription OnCreateUser(
  $filter: ModelSubscriptionUserFilterInput
  $owner: String
) {
  onCreateUser(filter: $filter, owner: $owner) {
    avatar
    createdAt
    description
    email
    id
    nickname
    owner
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateUserSubscriptionVariables,
  APITypes.OnCreateUserSubscription
>;
export const onDeleteChatRoom = /* GraphQL */ `subscription OnDeleteChatRoom($filter: ModelSubscriptionChatRoomFilterInput) {
  onDeleteChatRoom(filter: $filter) {
    avatar
    createdAt
    description
    id
    lastMessage
    lastMessageAt
    name
    type
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteChatRoomSubscriptionVariables,
  APITypes.OnDeleteChatRoomSubscription
>;
export const onDeleteChatRoomMember = /* GraphQL */ `subscription OnDeleteChatRoomMember(
  $filter: ModelSubscriptionChatRoomMemberFilterInput
) {
  onDeleteChatRoomMember(filter: $filter) {
    chatRoomId
    createdAt
    id
    joinedAt
    role
    updatedAt
    userId
    userNickname
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteChatRoomMemberSubscriptionVariables,
  APITypes.OnDeleteChatRoomMemberSubscription
>;
export const onDeleteMessage = /* GraphQL */ `subscription OnDeleteMessage($filter: ModelSubscriptionMessageFilterInput) {
  onDeleteMessage(filter: $filter) {
    chatRoomId
    content
    createdAt
    id
    isRead
    senderId
    senderNickname
    type
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteMessageSubscriptionVariables,
  APITypes.OnDeleteMessageSubscription
>;
export const onDeleteMessageReadStatus = /* GraphQL */ `subscription OnDeleteMessageReadStatus(
  $filter: ModelSubscriptionMessageReadStatusFilterInput
) {
  onDeleteMessageReadStatus(filter: $filter) {
    createdAt
    id
    messageId
    readAt
    updatedAt
    userId
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteMessageReadStatusSubscriptionVariables,
  APITypes.OnDeleteMessageReadStatusSubscription
>;
export const onDeleteUser = /* GraphQL */ `subscription OnDeleteUser(
  $filter: ModelSubscriptionUserFilterInput
  $owner: String
) {
  onDeleteUser(filter: $filter, owner: $owner) {
    avatar
    createdAt
    description
    email
    id
    nickname
    owner
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteUserSubscriptionVariables,
  APITypes.OnDeleteUserSubscription
>;
export const onUpdateChatRoom = /* GraphQL */ `subscription OnUpdateChatRoom($filter: ModelSubscriptionChatRoomFilterInput) {
  onUpdateChatRoom(filter: $filter) {
    avatar
    createdAt
    description
    id
    lastMessage
    lastMessageAt
    name
    type
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateChatRoomSubscriptionVariables,
  APITypes.OnUpdateChatRoomSubscription
>;
export const onUpdateChatRoomMember = /* GraphQL */ `subscription OnUpdateChatRoomMember(
  $filter: ModelSubscriptionChatRoomMemberFilterInput
) {
  onUpdateChatRoomMember(filter: $filter) {
    chatRoomId
    createdAt
    id
    joinedAt
    role
    updatedAt
    userId
    userNickname
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateChatRoomMemberSubscriptionVariables,
  APITypes.OnUpdateChatRoomMemberSubscription
>;
export const onUpdateMessage = /* GraphQL */ `subscription OnUpdateMessage($filter: ModelSubscriptionMessageFilterInput) {
  onUpdateMessage(filter: $filter) {
    chatRoomId
    content
    createdAt
    id
    isRead
    senderId
    senderNickname
    type
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateMessageSubscriptionVariables,
  APITypes.OnUpdateMessageSubscription
>;
export const onUpdateMessageReadStatus = /* GraphQL */ `subscription OnUpdateMessageReadStatus(
  $filter: ModelSubscriptionMessageReadStatusFilterInput
) {
  onUpdateMessageReadStatus(filter: $filter) {
    createdAt
    id
    messageId
    readAt
    updatedAt
    userId
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateMessageReadStatusSubscriptionVariables,
  APITypes.OnUpdateMessageReadStatusSubscription
>;
export const onUpdateUser = /* GraphQL */ `subscription OnUpdateUser(
  $filter: ModelSubscriptionUserFilterInput
  $owner: String
) {
  onUpdateUser(filter: $filter, owner: $owner) {
    avatar
    createdAt
    description
    email
    id
    nickname
    owner
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateUserSubscriptionVariables,
  APITypes.OnUpdateUserSubscription
>;
