/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "./API";
type GeneratedQuery<InputType, OutputType> = string & {
  __generatedQueryInput: InputType;
  __generatedQueryOutput: OutputType;
};

export const getChatRoom = /* GraphQL */ `query GetChatRoom($id: ID!) {
  getChatRoom(id: $id) {
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
` as GeneratedQuery<
  APITypes.GetChatRoomQueryVariables,
  APITypes.GetChatRoomQuery
>;
export const getChatRoomMember = /* GraphQL */ `query GetChatRoomMember($id: ID!) {
  getChatRoomMember(id: $id) {
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
` as GeneratedQuery<
  APITypes.GetChatRoomMemberQueryVariables,
  APITypes.GetChatRoomMemberQuery
>;
export const getMessage = /* GraphQL */ `query GetMessage($id: ID!) {
  getMessage(id: $id) {
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
` as GeneratedQuery<
  APITypes.GetMessageQueryVariables,
  APITypes.GetMessageQuery
>;
export const getMessageReadStatus = /* GraphQL */ `query GetMessageReadStatus($id: ID!) {
  getMessageReadStatus(id: $id) {
    createdAt
    id
    messageId
    readAt
    updatedAt
    userId
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetMessageReadStatusQueryVariables,
  APITypes.GetMessageReadStatusQuery
>;
export const getUser = /* GraphQL */ `query GetUser($email: String!) {
  getUser(email: $email) {
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
` as GeneratedQuery<APITypes.GetUserQueryVariables, APITypes.GetUserQuery>;
export const listChatRoomMemberByChatRoomIdAndUserId = /* GraphQL */ `query ListChatRoomMemberByChatRoomIdAndUserId(
  $chatRoomId: ID!
  $filter: ModelChatRoomMemberFilterInput
  $limit: Int
  $nextToken: String
  $sortDirection: ModelSortDirection
  $userId: ModelStringKeyConditionInput
) {
  listChatRoomMemberByChatRoomIdAndUserId(
    chatRoomId: $chatRoomId
    filter: $filter
    limit: $limit
    nextToken: $nextToken
    sortDirection: $sortDirection
    userId: $userId
  ) {
    items {
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
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListChatRoomMemberByChatRoomIdAndUserIdQueryVariables,
  APITypes.ListChatRoomMemberByChatRoomIdAndUserIdQuery
>;
export const listChatRoomMemberByUserId = /* GraphQL */ `query ListChatRoomMemberByUserId(
  $filter: ModelChatRoomMemberFilterInput
  $limit: Int
  $nextToken: String
  $sortDirection: ModelSortDirection
  $userId: String!
) {
  listChatRoomMemberByUserId(
    filter: $filter
    limit: $limit
    nextToken: $nextToken
    sortDirection: $sortDirection
    userId: $userId
  ) {
    items {
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
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListChatRoomMemberByUserIdQueryVariables,
  APITypes.ListChatRoomMemberByUserIdQuery
>;
export const listChatRoomMembers = /* GraphQL */ `query ListChatRoomMembers(
  $filter: ModelChatRoomMemberFilterInput
  $id: ID
  $limit: Int
  $nextToken: String
  $sortDirection: ModelSortDirection
) {
  listChatRoomMembers(
    filter: $filter
    id: $id
    limit: $limit
    nextToken: $nextToken
    sortDirection: $sortDirection
  ) {
    items {
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
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListChatRoomMembersQueryVariables,
  APITypes.ListChatRoomMembersQuery
>;
export const listChatRooms = /* GraphQL */ `query ListChatRooms(
  $filter: ModelChatRoomFilterInput
  $id: ID
  $limit: Int
  $nextToken: String
  $sortDirection: ModelSortDirection
) {
  listChatRooms(
    filter: $filter
    id: $id
    limit: $limit
    nextToken: $nextToken
    sortDirection: $sortDirection
  ) {
    items {
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
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListChatRoomsQueryVariables,
  APITypes.ListChatRoomsQuery
>;
export const listMessageReadStatuses = /* GraphQL */ `query ListMessageReadStatuses(
  $filter: ModelMessageReadStatusFilterInput
  $id: ID
  $limit: Int
  $nextToken: String
  $sortDirection: ModelSortDirection
) {
  listMessageReadStatuses(
    filter: $filter
    id: $id
    limit: $limit
    nextToken: $nextToken
    sortDirection: $sortDirection
  ) {
    items {
      createdAt
      id
      messageId
      readAt
      updatedAt
      userId
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListMessageReadStatusesQueryVariables,
  APITypes.ListMessageReadStatusesQuery
>;
export const listMessages = /* GraphQL */ `query ListMessages(
  $filter: ModelMessageFilterInput
  $id: ID
  $limit: Int
  $nextToken: String
  $sortDirection: ModelSortDirection
) {
  listMessages(
    filter: $filter
    id: $id
    limit: $limit
    nextToken: $nextToken
    sortDirection: $sortDirection
  ) {
    items {
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
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListMessagesQueryVariables,
  APITypes.ListMessagesQuery
>;
export const listUsers = /* GraphQL */ `query ListUsers(
  $email: String
  $filter: ModelUserFilterInput
  $limit: Int
  $nextToken: String
  $sortDirection: ModelSortDirection
) {
  listUsers(
    email: $email
    filter: $filter
    limit: $limit
    nextToken: $nextToken
    sortDirection: $sortDirection
  ) {
    items {
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
    nextToken
    __typename
  }
}
` as GeneratedQuery<APITypes.ListUsersQueryVariables, APITypes.ListUsersQuery>;
export const verifyUser = /* GraphQL */ `query VerifyUser($email: String!) {
  verifyUser(email: $email) {
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
` as GeneratedQuery<
  APITypes.VerifyUserQueryVariables,
  APITypes.VerifyUserQuery
>;
