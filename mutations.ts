/* tslint:disable */
 
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
export const createGroupChat = /* GraphQL */ `mutation CreateGroupChat(
  $creatorId: String!
  $creatorNickname: String!
  $description: String
  $memberIds: [String]!
  $name: String!
) {
  createGroupChat(
    creatorId: $creatorId
    creatorNickname: $creatorNickname
    description: $description
    memberIds: $memberIds
    name: $name
  ) {
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
  APITypes.CreateGroupChatMutationVariables,
  APITypes.CreateGroupChatMutation
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
export const createPrivateChat = /* GraphQL */ `mutation CreatePrivateChat(
  $currentUserId: String!
  $currentUserNickname: String!
  $targetUserId: String!
  $targetUserNickname: String!
) {
  createPrivateChat(
    currentUserId: $currentUserId
    currentUserNickname: $currentUserNickname
    targetUserId: $targetUserId
    targetUserNickname: $targetUserNickname
  ) {
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
  APITypes.CreatePrivateChatMutationVariables,
  APITypes.CreatePrivateChatMutation
>;
export const createUser = /* GraphQL */ `mutation CreateUser(
  $condition: ModelUserConditionInput
  $input: CreateUserInput!
) {
  createUser(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.CreateUserMutationVariables,
  APITypes.CreateUserMutation
>;
export const createUserAfterAuth = /* GraphQL */ `mutation CreateUserAfterAuth(
  $description: String
  $email: String!
  $nickname: String!
) {
  createUserAfterAuth(
    description: $description
    email: $email
    nickname: $nickname
  )
}
` as GeneratedMutation<
  APITypes.CreateUserAfterAuthMutationVariables,
  APITypes.CreateUserAfterAuthMutation
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
    description
    email
    id
    nickname
    owner
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteUserMutationVariables,
  APITypes.DeleteUserMutation
>;
export const sendMessage = /* GraphQL */ `mutation SendMessage(
  $chatRoomId: String!
  $content: String!
  $senderId: String!
  $senderNickname: String!
  $type: String
) {
  sendMessage(
    chatRoomId: $chatRoomId
    content: $content
    senderId: $senderId
    senderNickname: $senderNickname
    type: $type
  ) {
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
  APITypes.SendMessageMutationVariables,
  APITypes.SendMessageMutation
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
export const updateProfileImage = /* GraphQL */ `mutation UpdateProfileImage(
  $fileName: String!
  $fileSize: Int!
  $fileType: String!
  $userId: String!
) {
  updateProfileImage(
    fileName: $fileName
    fileSize: $fileSize
    fileType: $fileType
    userId: $userId
  )
}
` as GeneratedMutation<
  APITypes.UpdateProfileImageMutationVariables,
  APITypes.UpdateProfileImageMutation
>;
export const updateUser = /* GraphQL */ `mutation UpdateUser(
  $condition: ModelUserConditionInput
  $input: UpdateUserInput!
) {
  updateUser(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.UpdateUserMutationVariables,
  APITypes.UpdateUserMutation
>;
export const updateUserProfile = /* GraphQL */ `mutation UpdateUserProfile(
  $description: String
  $email: String!
  $nickname: String
) {
  updateUserProfile(
    description: $description
    email: $email
    nickname: $nickname
  ) {
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
` as GeneratedMutation<
  APITypes.UpdateUserProfileMutationVariables,
  APITypes.UpdateUserProfileMutation
>;
