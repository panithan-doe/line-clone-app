/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "./API";
type GeneratedMutation<InputType, OutputType> = string & {
  __generatedMutationInput: InputType;
  __generatedMutationOutput: OutputType;
};

export const createChatRoom = /* GraphQL */ `mutation CreateChatRoom(
  $condition: ModelChatRoomConditionInput
  $input: CreateChatRoomInput!
) {
  createChatRoom(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.CreateChatRoomMutationVariables,
  APITypes.CreateChatRoomMutation
>;
export const createChatRoomMember = /* GraphQL */ `mutation CreateChatRoomMember(
  $condition: ModelChatRoomMemberConditionInput
  $input: CreateChatRoomMemberInput!
) {
  createChatRoomMember(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.CreateChatRoomMemberMutationVariables,
  APITypes.CreateChatRoomMemberMutation
>;
export const createMessage = /* GraphQL */ `mutation CreateMessage(
  $condition: ModelMessageConditionInput
  $input: CreateMessageInput!
) {
  createMessage(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.CreateMessageMutationVariables,
  APITypes.CreateMessageMutation
>;
export const createMessageReadStatus = /* GraphQL */ `mutation CreateMessageReadStatus(
  $condition: ModelMessageReadStatusConditionInput
  $input: CreateMessageReadStatusInput!
) {
  createMessageReadStatus(condition: $condition, input: $input) {
    createdAt
    id
    messageId
    readAt
    updatedAt
    userId
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateMessageReadStatusMutationVariables,
  APITypes.CreateMessageReadStatusMutation
>;
export const createUser = /* GraphQL */ `mutation CreateUser(
  $condition: ModelUserConditionInput
  $input: CreateUserInput!
) {
  createUser(condition: $condition, input: $input) {
    avatar
    createdAt
    email
    id
    nickname
    owner
    status
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateUserMutationVariables,
  APITypes.CreateUserMutation
>;
export const deleteChatRoom = /* GraphQL */ `mutation DeleteChatRoom(
  $condition: ModelChatRoomConditionInput
  $input: DeleteChatRoomInput!
) {
  deleteChatRoom(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.DeleteChatRoomMutationVariables,
  APITypes.DeleteChatRoomMutation
>;
export const deleteChatRoomMember = /* GraphQL */ `mutation DeleteChatRoomMember(
  $condition: ModelChatRoomMemberConditionInput
  $input: DeleteChatRoomMemberInput!
) {
  deleteChatRoomMember(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.DeleteChatRoomMemberMutationVariables,
  APITypes.DeleteChatRoomMemberMutation
>;
export const deleteMessage = /* GraphQL */ `mutation DeleteMessage(
  $condition: ModelMessageConditionInput
  $input: DeleteMessageInput!
) {
  deleteMessage(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.DeleteMessageMutationVariables,
  APITypes.DeleteMessageMutation
>;
export const deleteMessageReadStatus = /* GraphQL */ `mutation DeleteMessageReadStatus(
  $condition: ModelMessageReadStatusConditionInput
  $input: DeleteMessageReadStatusInput!
) {
  deleteMessageReadStatus(condition: $condition, input: $input) {
    createdAt
    id
    messageId
    readAt
    updatedAt
    userId
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteMessageReadStatusMutationVariables,
  APITypes.DeleteMessageReadStatusMutation
>;
export const deleteUser = /* GraphQL */ `mutation DeleteUser(
  $condition: ModelUserConditionInput
  $input: DeleteUserInput!
) {
  deleteUser(condition: $condition, input: $input) {
    avatar
    createdAt
    email
    id
    nickname
    owner
    status
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteUserMutationVariables,
  APITypes.DeleteUserMutation
>;
export const updateChatRoom = /* GraphQL */ `mutation UpdateChatRoom(
  $condition: ModelChatRoomConditionInput
  $input: UpdateChatRoomInput!
) {
  updateChatRoom(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.UpdateChatRoomMutationVariables,
  APITypes.UpdateChatRoomMutation
>;
export const updateChatRoomMember = /* GraphQL */ `mutation UpdateChatRoomMember(
  $condition: ModelChatRoomMemberConditionInput
  $input: UpdateChatRoomMemberInput!
) {
  updateChatRoomMember(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.UpdateChatRoomMemberMutationVariables,
  APITypes.UpdateChatRoomMemberMutation
>;
export const updateMessage = /* GraphQL */ `mutation UpdateMessage(
  $condition: ModelMessageConditionInput
  $input: UpdateMessageInput!
) {
  updateMessage(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.UpdateMessageMutationVariables,
  APITypes.UpdateMessageMutation
>;
export const updateMessageReadStatus = /* GraphQL */ `mutation UpdateMessageReadStatus(
  $condition: ModelMessageReadStatusConditionInput
  $input: UpdateMessageReadStatusInput!
) {
  updateMessageReadStatus(condition: $condition, input: $input) {
    createdAt
    id
    messageId
    readAt
    updatedAt
    userId
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateMessageReadStatusMutationVariables,
  APITypes.UpdateMessageReadStatusMutation
>;
export const updateUser = /* GraphQL */ `mutation UpdateUser(
  $condition: ModelUserConditionInput
  $input: UpdateUserInput!
) {
  updateUser(condition: $condition, input: $input) {
    avatar
    createdAt
    email
    id
    nickname
    owner
    status
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateUserMutationVariables,
  APITypes.UpdateUserMutation
>;
