/* tslint:disable */
/* eslint-disable */
//  This file was automatically generated and should not be edited.

export type ChatRoom = {
  __typename: "ChatRoom",
  avatar?: string | null,
  createdAt?: string | null,
  description?: string | null,
  id: string,
  lastMessage?: string | null,
  lastMessageAt?: string | null,
  name: string,
  type: string,
  updatedAt?: string | null,
};

export type ChatRoomMember = {
  __typename: "ChatRoomMember",
  chatRoomId: string,
  createdAt: string,
  id: string,
  joinedAt?: string | null,
  role?: string | null,
  updatedAt: string,
  userId: string,
  userNickname: string,
};

export type Message = {
  __typename: "Message",
  chatRoomId: string,
  content: string,
  createdAt?: string | null,
  id: string,
  isRead?: boolean | null,
  senderId: string,
  senderNickname: string,
  type?: string | null,
  updatedAt?: string | null,
};

export type MessageReadStatus = {
  __typename: "MessageReadStatus",
  createdAt?: string | null,
  id: string,
  messageId: string,
  readAt?: string | null,
  updatedAt: string,
  userId: string,
};

export type User = {
  __typename: "User",
  avatar?: string | null,
  createdAt?: string | null,
  description?: string | null,
  email: string,
  id?: string | null,
  nickname: string,
  owner?: string | null,
  updatedAt?: string | null,
};

export type ModelChatRoomMemberFilterInput = {
  and?: Array< ModelChatRoomMemberFilterInput | null > | null,
  chatRoomId?: ModelIDInput | null,
  createdAt?: ModelStringInput | null,
  id?: ModelIDInput | null,
  joinedAt?: ModelStringInput | null,
  not?: ModelChatRoomMemberFilterInput | null,
  or?: Array< ModelChatRoomMemberFilterInput | null > | null,
  role?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  userId?: ModelStringInput | null,
  userNickname?: ModelStringInput | null,
};

export type ModelIDInput = {
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
  beginsWith?: string | null,
  between?: Array< string | null > | null,
  contains?: string | null,
  eq?: string | null,
  ge?: string | null,
  gt?: string | null,
  le?: string | null,
  lt?: string | null,
  ne?: string | null,
  notContains?: string | null,
  size?: ModelSizeInput | null,
};

export enum ModelAttributeTypes {
  _null = "_null",
  binary = "binary",
  binarySet = "binarySet",
  bool = "bool",
  list = "list",
  map = "map",
  number = "number",
  numberSet = "numberSet",
  string = "string",
  stringSet = "stringSet",
}


export type ModelSizeInput = {
  between?: Array< number | null > | null,
  eq?: number | null,
  ge?: number | null,
  gt?: number | null,
  le?: number | null,
  lt?: number | null,
  ne?: number | null,
};

export type ModelStringInput = {
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
  beginsWith?: string | null,
  between?: Array< string | null > | null,
  contains?: string | null,
  eq?: string | null,
  ge?: string | null,
  gt?: string | null,
  le?: string | null,
  lt?: string | null,
  ne?: string | null,
  notContains?: string | null,
  size?: ModelSizeInput | null,
};

export enum ModelSortDirection {
  ASC = "ASC",
  DESC = "DESC",
}


export type ModelStringKeyConditionInput = {
  beginsWith?: string | null,
  between?: Array< string | null > | null,
  eq?: string | null,
  ge?: string | null,
  gt?: string | null,
  le?: string | null,
  lt?: string | null,
};

export type ModelChatRoomMemberConnection = {
  __typename: "ModelChatRoomMemberConnection",
  items:  Array<ChatRoomMember | null >,
  nextToken?: string | null,
};

export type ModelChatRoomFilterInput = {
  and?: Array< ModelChatRoomFilterInput | null > | null,
  avatar?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  description?: ModelStringInput | null,
  id?: ModelIDInput | null,
  lastMessage?: ModelStringInput | null,
  lastMessageAt?: ModelStringInput | null,
  name?: ModelStringInput | null,
  not?: ModelChatRoomFilterInput | null,
  or?: Array< ModelChatRoomFilterInput | null > | null,
  type?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
};

export type ModelChatRoomConnection = {
  __typename: "ModelChatRoomConnection",
  items:  Array<ChatRoom | null >,
  nextToken?: string | null,
};

export type ModelMessageReadStatusFilterInput = {
  and?: Array< ModelMessageReadStatusFilterInput | null > | null,
  createdAt?: ModelStringInput | null,
  id?: ModelIDInput | null,
  messageId?: ModelIDInput | null,
  not?: ModelMessageReadStatusFilterInput | null,
  or?: Array< ModelMessageReadStatusFilterInput | null > | null,
  readAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  userId?: ModelStringInput | null,
};

export type ModelMessageReadStatusConnection = {
  __typename: "ModelMessageReadStatusConnection",
  items:  Array<MessageReadStatus | null >,
  nextToken?: string | null,
};

export type ModelMessageFilterInput = {
  and?: Array< ModelMessageFilterInput | null > | null,
  chatRoomId?: ModelIDInput | null,
  content?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  id?: ModelIDInput | null,
  isRead?: ModelBooleanInput | null,
  not?: ModelMessageFilterInput | null,
  or?: Array< ModelMessageFilterInput | null > | null,
  senderId?: ModelStringInput | null,
  senderNickname?: ModelStringInput | null,
  type?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
};

export type ModelBooleanInput = {
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
  eq?: boolean | null,
  ne?: boolean | null,
};

export type ModelMessageConnection = {
  __typename: "ModelMessageConnection",
  items:  Array<Message | null >,
  nextToken?: string | null,
};

export type ModelUserFilterInput = {
  and?: Array< ModelUserFilterInput | null > | null,
  avatar?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  description?: ModelStringInput | null,
  email?: ModelStringInput | null,
  id?: ModelIDInput | null,
  nickname?: ModelStringInput | null,
  not?: ModelUserFilterInput | null,
  or?: Array< ModelUserFilterInput | null > | null,
  owner?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
};

export type ModelUserConnection = {
  __typename: "ModelUserConnection",
  items:  Array<User | null >,
  nextToken?: string | null,
};

export type ModelChatRoomConditionInput = {
  and?: Array< ModelChatRoomConditionInput | null > | null,
  avatar?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  description?: ModelStringInput | null,
  lastMessage?: ModelStringInput | null,
  lastMessageAt?: ModelStringInput | null,
  name?: ModelStringInput | null,
  not?: ModelChatRoomConditionInput | null,
  or?: Array< ModelChatRoomConditionInput | null > | null,
  type?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
};

export type CreateChatRoomInput = {
  avatar?: string | null,
  createdAt?: string | null,
  description?: string | null,
  id?: string | null,
  lastMessage?: string | null,
  lastMessageAt?: string | null,
  name: string,
  type: string,
  updatedAt?: string | null,
};

export type ModelChatRoomMemberConditionInput = {
  and?: Array< ModelChatRoomMemberConditionInput | null > | null,
  chatRoomId?: ModelIDInput | null,
  createdAt?: ModelStringInput | null,
  joinedAt?: ModelStringInput | null,
  not?: ModelChatRoomMemberConditionInput | null,
  or?: Array< ModelChatRoomMemberConditionInput | null > | null,
  role?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  userId?: ModelStringInput | null,
  userNickname?: ModelStringInput | null,
};

export type CreateChatRoomMemberInput = {
  chatRoomId: string,
  id?: string | null,
  joinedAt?: string | null,
  role?: string | null,
  userId: string,
  userNickname: string,
};

export type ModelMessageConditionInput = {
  and?: Array< ModelMessageConditionInput | null > | null,
  chatRoomId?: ModelIDInput | null,
  content?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  isRead?: ModelBooleanInput | null,
  not?: ModelMessageConditionInput | null,
  or?: Array< ModelMessageConditionInput | null > | null,
  senderId?: ModelStringInput | null,
  senderNickname?: ModelStringInput | null,
  type?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
};

export type CreateMessageInput = {
  chatRoomId: string,
  content: string,
  createdAt?: string | null,
  id?: string | null,
  isRead?: boolean | null,
  senderId: string,
  senderNickname: string,
  type?: string | null,
  updatedAt?: string | null,
};

export type ModelMessageReadStatusConditionInput = {
  and?: Array< ModelMessageReadStatusConditionInput | null > | null,
  createdAt?: ModelStringInput | null,
  messageId?: ModelIDInput | null,
  not?: ModelMessageReadStatusConditionInput | null,
  or?: Array< ModelMessageReadStatusConditionInput | null > | null,
  readAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  userId?: ModelStringInput | null,
};

export type CreateMessageReadStatusInput = {
  createdAt?: string | null,
  id?: string | null,
  messageId: string,
  readAt?: string | null,
  userId: string,
};

export type ModelUserConditionInput = {
  and?: Array< ModelUserConditionInput | null > | null,
  avatar?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  description?: ModelStringInput | null,
  nickname?: ModelStringInput | null,
  not?: ModelUserConditionInput | null,
  or?: Array< ModelUserConditionInput | null > | null,
  owner?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
};

export type CreateUserInput = {
  avatar?: string | null,
  createdAt?: string | null,
  description?: string | null,
  email: string,
  id?: string | null,
  nickname: string,
  owner?: string | null,
  updatedAt?: string | null,
};

export type DeleteChatRoomInput = {
  id: string,
};

export type DeleteChatRoomMemberInput = {
  id: string,
};

export type DeleteMessageInput = {
  id: string,
};

export type DeleteMessageReadStatusInput = {
  id: string,
};

export type DeleteUserInput = {
  email: string,
};

export type UpdateChatRoomInput = {
  avatar?: string | null,
  createdAt?: string | null,
  description?: string | null,
  id: string,
  lastMessage?: string | null,
  lastMessageAt?: string | null,
  name?: string | null,
  type?: string | null,
  updatedAt?: string | null,
};

export type UpdateChatRoomMemberInput = {
  chatRoomId?: string | null,
  id: string,
  joinedAt?: string | null,
  role?: string | null,
  userId?: string | null,
  userNickname?: string | null,
};

export type UpdateMessageInput = {
  chatRoomId?: string | null,
  content?: string | null,
  createdAt?: string | null,
  id: string,
  isRead?: boolean | null,
  senderId?: string | null,
  senderNickname?: string | null,
  type?: string | null,
  updatedAt?: string | null,
};

export type UpdateMessageReadStatusInput = {
  createdAt?: string | null,
  id: string,
  messageId?: string | null,
  readAt?: string | null,
  userId?: string | null,
};

export type UpdateUserInput = {
  avatar?: string | null,
  createdAt?: string | null,
  description?: string | null,
  email: string,
  id?: string | null,
  nickname?: string | null,
  owner?: string | null,
  updatedAt?: string | null,
};

export type ModelSubscriptionChatRoomFilterInput = {
  and?: Array< ModelSubscriptionChatRoomFilterInput | null > | null,
  avatar?: ModelSubscriptionStringInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  description?: ModelSubscriptionStringInput | null,
  id?: ModelSubscriptionIDInput | null,
  lastMessage?: ModelSubscriptionStringInput | null,
  lastMessageAt?: ModelSubscriptionStringInput | null,
  name?: ModelSubscriptionStringInput | null,
  or?: Array< ModelSubscriptionChatRoomFilterInput | null > | null,
  type?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
};

export type ModelSubscriptionStringInput = {
  beginsWith?: string | null,
  between?: Array< string | null > | null,
  contains?: string | null,
  eq?: string | null,
  ge?: string | null,
  gt?: string | null,
  in?: Array< string | null > | null,
  le?: string | null,
  lt?: string | null,
  ne?: string | null,
  notContains?: string | null,
  notIn?: Array< string | null > | null,
};

export type ModelSubscriptionIDInput = {
  beginsWith?: string | null,
  between?: Array< string | null > | null,
  contains?: string | null,
  eq?: string | null,
  ge?: string | null,
  gt?: string | null,
  in?: Array< string | null > | null,
  le?: string | null,
  lt?: string | null,
  ne?: string | null,
  notContains?: string | null,
  notIn?: Array< string | null > | null,
};

export type ModelSubscriptionChatRoomMemberFilterInput = {
  and?: Array< ModelSubscriptionChatRoomMemberFilterInput | null > | null,
  chatRoomId?: ModelSubscriptionIDInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  id?: ModelSubscriptionIDInput | null,
  joinedAt?: ModelSubscriptionStringInput | null,
  or?: Array< ModelSubscriptionChatRoomMemberFilterInput | null > | null,
  role?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  userId?: ModelSubscriptionStringInput | null,
  userNickname?: ModelSubscriptionStringInput | null,
};

export type ModelSubscriptionMessageFilterInput = {
  and?: Array< ModelSubscriptionMessageFilterInput | null > | null,
  chatRoomId?: ModelSubscriptionIDInput | null,
  content?: ModelSubscriptionStringInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  id?: ModelSubscriptionIDInput | null,
  isRead?: ModelSubscriptionBooleanInput | null,
  or?: Array< ModelSubscriptionMessageFilterInput | null > | null,
  senderId?: ModelSubscriptionStringInput | null,
  senderNickname?: ModelSubscriptionStringInput | null,
  type?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
};

export type ModelSubscriptionBooleanInput = {
  eq?: boolean | null,
  ne?: boolean | null,
};

export type ModelSubscriptionMessageReadStatusFilterInput = {
  and?: Array< ModelSubscriptionMessageReadStatusFilterInput | null > | null,
  createdAt?: ModelSubscriptionStringInput | null,
  id?: ModelSubscriptionIDInput | null,
  messageId?: ModelSubscriptionIDInput | null,
  or?: Array< ModelSubscriptionMessageReadStatusFilterInput | null > | null,
  readAt?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  userId?: ModelSubscriptionStringInput | null,
};

export type ModelSubscriptionUserFilterInput = {
  and?: Array< ModelSubscriptionUserFilterInput | null > | null,
  avatar?: ModelSubscriptionStringInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  description?: ModelSubscriptionStringInput | null,
  email?: ModelSubscriptionStringInput | null,
  id?: ModelSubscriptionIDInput | null,
  nickname?: ModelSubscriptionStringInput | null,
  or?: Array< ModelSubscriptionUserFilterInput | null > | null,
  owner?: ModelStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
};

export type GetChatRoomQueryVariables = {
  id: string,
};

export type GetChatRoomQuery = {
  getChatRoom?:  {
    __typename: "ChatRoom",
    avatar?: string | null,
    createdAt?: string | null,
    description?: string | null,
    id: string,
    lastMessage?: string | null,
    lastMessageAt?: string | null,
    name: string,
    type: string,
    updatedAt?: string | null,
  } | null,
};

export type GetChatRoomMemberQueryVariables = {
  id: string,
};

export type GetChatRoomMemberQuery = {
  getChatRoomMember?:  {
    __typename: "ChatRoomMember",
    chatRoomId: string,
    createdAt: string,
    id: string,
    joinedAt?: string | null,
    role?: string | null,
    updatedAt: string,
    userId: string,
    userNickname: string,
  } | null,
};

export type GetMessageQueryVariables = {
  id: string,
};

export type GetMessageQuery = {
  getMessage?:  {
    __typename: "Message",
    chatRoomId: string,
    content: string,
    createdAt?: string | null,
    id: string,
    isRead?: boolean | null,
    senderId: string,
    senderNickname: string,
    type?: string | null,
    updatedAt?: string | null,
  } | null,
};

export type GetMessageReadStatusQueryVariables = {
  id: string,
};

export type GetMessageReadStatusQuery = {
  getMessageReadStatus?:  {
    __typename: "MessageReadStatus",
    createdAt?: string | null,
    id: string,
    messageId: string,
    readAt?: string | null,
    updatedAt: string,
    userId: string,
  } | null,
};

export type GetUserQueryVariables = {
  email: string,
};

export type GetUserQuery = {
  getUser?:  {
    __typename: "User",
    avatar?: string | null,
    createdAt?: string | null,
    description?: string | null,
    email: string,
    id?: string | null,
    nickname: string,
    owner?: string | null,
    updatedAt?: string | null,
  } | null,
};

export type ListChatRoomMemberByChatRoomIdAndUserIdQueryVariables = {
  chatRoomId: string,
  filter?: ModelChatRoomMemberFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
  sortDirection?: ModelSortDirection | null,
  userId?: ModelStringKeyConditionInput | null,
};

export type ListChatRoomMemberByChatRoomIdAndUserIdQuery = {
  listChatRoomMemberByChatRoomIdAndUserId?:  {
    __typename: "ModelChatRoomMemberConnection",
    items:  Array< {
      __typename: "ChatRoomMember",
      chatRoomId: string,
      createdAt: string,
      id: string,
      joinedAt?: string | null,
      role?: string | null,
      updatedAt: string,
      userId: string,
      userNickname: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type ListChatRoomMemberByUserIdQueryVariables = {
  filter?: ModelChatRoomMemberFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
  sortDirection?: ModelSortDirection | null,
  userId: string,
};

export type ListChatRoomMemberByUserIdQuery = {
  listChatRoomMemberByUserId?:  {
    __typename: "ModelChatRoomMemberConnection",
    items:  Array< {
      __typename: "ChatRoomMember",
      chatRoomId: string,
      createdAt: string,
      id: string,
      joinedAt?: string | null,
      role?: string | null,
      updatedAt: string,
      userId: string,
      userNickname: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type ListChatRoomMembersQueryVariables = {
  filter?: ModelChatRoomMemberFilterInput | null,
  id?: string | null,
  limit?: number | null,
  nextToken?: string | null,
  sortDirection?: ModelSortDirection | null,
};

export type ListChatRoomMembersQuery = {
  listChatRoomMembers?:  {
    __typename: "ModelChatRoomMemberConnection",
    items:  Array< {
      __typename: "ChatRoomMember",
      chatRoomId: string,
      createdAt: string,
      id: string,
      joinedAt?: string | null,
      role?: string | null,
      updatedAt: string,
      userId: string,
      userNickname: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type ListChatRoomsQueryVariables = {
  filter?: ModelChatRoomFilterInput | null,
  id?: string | null,
  limit?: number | null,
  nextToken?: string | null,
  sortDirection?: ModelSortDirection | null,
};

export type ListChatRoomsQuery = {
  listChatRooms?:  {
    __typename: "ModelChatRoomConnection",
    items:  Array< {
      __typename: "ChatRoom",
      avatar?: string | null,
      createdAt?: string | null,
      description?: string | null,
      id: string,
      lastMessage?: string | null,
      lastMessageAt?: string | null,
      name: string,
      type: string,
      updatedAt?: string | null,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type ListMessageReadStatusesQueryVariables = {
  filter?: ModelMessageReadStatusFilterInput | null,
  id?: string | null,
  limit?: number | null,
  nextToken?: string | null,
  sortDirection?: ModelSortDirection | null,
};

export type ListMessageReadStatusesQuery = {
  listMessageReadStatuses?:  {
    __typename: "ModelMessageReadStatusConnection",
    items:  Array< {
      __typename: "MessageReadStatus",
      createdAt?: string | null,
      id: string,
      messageId: string,
      readAt?: string | null,
      updatedAt: string,
      userId: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type ListMessagesQueryVariables = {
  filter?: ModelMessageFilterInput | null,
  id?: string | null,
  limit?: number | null,
  nextToken?: string | null,
  sortDirection?: ModelSortDirection | null,
};

export type ListMessagesQuery = {
  listMessages?:  {
    __typename: "ModelMessageConnection",
    items:  Array< {
      __typename: "Message",
      chatRoomId: string,
      content: string,
      createdAt?: string | null,
      id: string,
      isRead?: boolean | null,
      senderId: string,
      senderNickname: string,
      type?: string | null,
      updatedAt?: string | null,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type ListUsersQueryVariables = {
  email?: string | null,
  filter?: ModelUserFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
  sortDirection?: ModelSortDirection | null,
};

export type ListUsersQuery = {
  listUsers?:  {
    __typename: "ModelUserConnection",
    items:  Array< {
      __typename: "User",
      avatar?: string | null,
      createdAt?: string | null,
      description?: string | null,
      email: string,
      id?: string | null,
      nickname: string,
      owner?: string | null,
      updatedAt?: string | null,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type VerifyUserQueryVariables = {
  email: string,
};

export type VerifyUserQuery = {
  verifyUser?:  {
    __typename: "User",
    avatar?: string | null,
    createdAt?: string | null,
    description?: string | null,
    email: string,
    id?: string | null,
    nickname: string,
    owner?: string | null,
    updatedAt?: string | null,
  } | null,
};

export type CreateChatRoomMutationVariables = {
  condition?: ModelChatRoomConditionInput | null,
  input: CreateChatRoomInput,
};

export type CreateChatRoomMutation = {
  createChatRoom?:  {
    __typename: "ChatRoom",
    avatar?: string | null,
    createdAt?: string | null,
    description?: string | null,
    id: string,
    lastMessage?: string | null,
    lastMessageAt?: string | null,
    name: string,
    type: string,
    updatedAt?: string | null,
  } | null,
};

export type CreateChatRoomMemberMutationVariables = {
  condition?: ModelChatRoomMemberConditionInput | null,
  input: CreateChatRoomMemberInput,
};

export type CreateChatRoomMemberMutation = {
  createChatRoomMember?:  {
    __typename: "ChatRoomMember",
    chatRoomId: string,
    createdAt: string,
    id: string,
    joinedAt?: string | null,
    role?: string | null,
    updatedAt: string,
    userId: string,
    userNickname: string,
  } | null,
};

export type CreateGroupChatMutationVariables = {
  creatorId: string,
  creatorNickname: string,
  description?: string | null,
  memberIds: Array< string | null >,
  name: string,
};

export type CreateGroupChatMutation = {
  createGroupChat?:  {
    __typename: "ChatRoom",
    avatar?: string | null,
    createdAt?: string | null,
    description?: string | null,
    id: string,
    lastMessage?: string | null,
    lastMessageAt?: string | null,
    name: string,
    type: string,
    updatedAt?: string | null,
  } | null,
};

export type CreateMessageMutationVariables = {
  condition?: ModelMessageConditionInput | null,
  input: CreateMessageInput,
};

export type CreateMessageMutation = {
  createMessage?:  {
    __typename: "Message",
    chatRoomId: string,
    content: string,
    createdAt?: string | null,
    id: string,
    isRead?: boolean | null,
    senderId: string,
    senderNickname: string,
    type?: string | null,
    updatedAt?: string | null,
  } | null,
};

export type CreateMessageReadStatusMutationVariables = {
  condition?: ModelMessageReadStatusConditionInput | null,
  input: CreateMessageReadStatusInput,
};

export type CreateMessageReadStatusMutation = {
  createMessageReadStatus?:  {
    __typename: "MessageReadStatus",
    createdAt?: string | null,
    id: string,
    messageId: string,
    readAt?: string | null,
    updatedAt: string,
    userId: string,
  } | null,
};

export type CreatePrivateChatMutationVariables = {
  currentUserId: string,
  currentUserNickname: string,
  targetUserId: string,
  targetUserNickname: string,
};

export type CreatePrivateChatMutation = {
  createPrivateChat?:  {
    __typename: "ChatRoom",
    avatar?: string | null,
    createdAt?: string | null,
    description?: string | null,
    id: string,
    lastMessage?: string | null,
    lastMessageAt?: string | null,
    name: string,
    type: string,
    updatedAt?: string | null,
  } | null,
};

export type CreateUserMutationVariables = {
  condition?: ModelUserConditionInput | null,
  input: CreateUserInput,
};

export type CreateUserMutation = {
  createUser?:  {
    __typename: "User",
    avatar?: string | null,
    createdAt?: string | null,
    description?: string | null,
    email: string,
    id?: string | null,
    nickname: string,
    owner?: string | null,
    updatedAt?: string | null,
  } | null,
};

export type CreateUserAfterAuthMutationVariables = {
  description?: string | null,
  email: string,
  nickname: string,
};

export type CreateUserAfterAuthMutation = {
  createUserAfterAuth?: string | null,
};

export type DeleteChatRoomMutationVariables = {
  condition?: ModelChatRoomConditionInput | null,
  input: DeleteChatRoomInput,
};

export type DeleteChatRoomMutation = {
  deleteChatRoom?:  {
    __typename: "ChatRoom",
    avatar?: string | null,
    createdAt?: string | null,
    description?: string | null,
    id: string,
    lastMessage?: string | null,
    lastMessageAt?: string | null,
    name: string,
    type: string,
    updatedAt?: string | null,
  } | null,
};

export type DeleteChatRoomMemberMutationVariables = {
  condition?: ModelChatRoomMemberConditionInput | null,
  input: DeleteChatRoomMemberInput,
};

export type DeleteChatRoomMemberMutation = {
  deleteChatRoomMember?:  {
    __typename: "ChatRoomMember",
    chatRoomId: string,
    createdAt: string,
    id: string,
    joinedAt?: string | null,
    role?: string | null,
    updatedAt: string,
    userId: string,
    userNickname: string,
  } | null,
};

export type DeleteMessageMutationVariables = {
  condition?: ModelMessageConditionInput | null,
  input: DeleteMessageInput,
};

export type DeleteMessageMutation = {
  deleteMessage?:  {
    __typename: "Message",
    chatRoomId: string,
    content: string,
    createdAt?: string | null,
    id: string,
    isRead?: boolean | null,
    senderId: string,
    senderNickname: string,
    type?: string | null,
    updatedAt?: string | null,
  } | null,
};

export type DeleteMessageReadStatusMutationVariables = {
  condition?: ModelMessageReadStatusConditionInput | null,
  input: DeleteMessageReadStatusInput,
};

export type DeleteMessageReadStatusMutation = {
  deleteMessageReadStatus?:  {
    __typename: "MessageReadStatus",
    createdAt?: string | null,
    id: string,
    messageId: string,
    readAt?: string | null,
    updatedAt: string,
    userId: string,
  } | null,
};

export type DeleteUserMutationVariables = {
  condition?: ModelUserConditionInput | null,
  input: DeleteUserInput,
};

export type DeleteUserMutation = {
  deleteUser?:  {
    __typename: "User",
    avatar?: string | null,
    createdAt?: string | null,
    description?: string | null,
    email: string,
    id?: string | null,
    nickname: string,
    owner?: string | null,
    updatedAt?: string | null,
  } | null,
};

export type SendMessageMutationVariables = {
  chatRoomId: string,
  content: string,
  senderId: string,
  senderNickname: string,
  type?: string | null,
};

export type SendMessageMutation = {
  sendMessage?:  {
    __typename: "Message",
    chatRoomId: string,
    content: string,
    createdAt?: string | null,
    id: string,
    isRead?: boolean | null,
    senderId: string,
    senderNickname: string,
    type?: string | null,
    updatedAt?: string | null,
  } | null,
};

export type UpdateChatRoomMutationVariables = {
  condition?: ModelChatRoomConditionInput | null,
  input: UpdateChatRoomInput,
};

export type UpdateChatRoomMutation = {
  updateChatRoom?:  {
    __typename: "ChatRoom",
    avatar?: string | null,
    createdAt?: string | null,
    description?: string | null,
    id: string,
    lastMessage?: string | null,
    lastMessageAt?: string | null,
    name: string,
    type: string,
    updatedAt?: string | null,
  } | null,
};

export type UpdateChatRoomMemberMutationVariables = {
  condition?: ModelChatRoomMemberConditionInput | null,
  input: UpdateChatRoomMemberInput,
};

export type UpdateChatRoomMemberMutation = {
  updateChatRoomMember?:  {
    __typename: "ChatRoomMember",
    chatRoomId: string,
    createdAt: string,
    id: string,
    joinedAt?: string | null,
    role?: string | null,
    updatedAt: string,
    userId: string,
    userNickname: string,
  } | null,
};

export type UpdateMessageMutationVariables = {
  condition?: ModelMessageConditionInput | null,
  input: UpdateMessageInput,
};

export type UpdateMessageMutation = {
  updateMessage?:  {
    __typename: "Message",
    chatRoomId: string,
    content: string,
    createdAt?: string | null,
    id: string,
    isRead?: boolean | null,
    senderId: string,
    senderNickname: string,
    type?: string | null,
    updatedAt?: string | null,
  } | null,
};

export type UpdateMessageReadStatusMutationVariables = {
  condition?: ModelMessageReadStatusConditionInput | null,
  input: UpdateMessageReadStatusInput,
};

export type UpdateMessageReadStatusMutation = {
  updateMessageReadStatus?:  {
    __typename: "MessageReadStatus",
    createdAt?: string | null,
    id: string,
    messageId: string,
    readAt?: string | null,
    updatedAt: string,
    userId: string,
  } | null,
};

export type UpdateProfileImageMutationVariables = {
  fileName: string,
  fileSize: number,
  fileType: string,
  userId: string,
};

export type UpdateProfileImageMutation = {
  updateProfileImage?: string | null,
};

export type UpdateUserMutationVariables = {
  condition?: ModelUserConditionInput | null,
  input: UpdateUserInput,
};

export type UpdateUserMutation = {
  updateUser?:  {
    __typename: "User",
    avatar?: string | null,
    createdAt?: string | null,
    description?: string | null,
    email: string,
    id?: string | null,
    nickname: string,
    owner?: string | null,
    updatedAt?: string | null,
  } | null,
};

export type UpdateUserProfileMutationVariables = {
  description?: string | null,
  email: string,
  nickname?: string | null,
};

export type UpdateUserProfileMutation = {
  updateUserProfile?:  {
    __typename: "User",
    avatar?: string | null,
    createdAt?: string | null,
    description?: string | null,
    email: string,
    id?: string | null,
    nickname: string,
    owner?: string | null,
    updatedAt?: string | null,
  } | null,
};

export type OnCreateChatRoomSubscriptionVariables = {
  filter?: ModelSubscriptionChatRoomFilterInput | null,
};

export type OnCreateChatRoomSubscription = {
  onCreateChatRoom?:  {
    __typename: "ChatRoom",
    avatar?: string | null,
    createdAt?: string | null,
    description?: string | null,
    id: string,
    lastMessage?: string | null,
    lastMessageAt?: string | null,
    name: string,
    type: string,
    updatedAt?: string | null,
  } | null,
};

export type OnCreateChatRoomMemberSubscriptionVariables = {
  filter?: ModelSubscriptionChatRoomMemberFilterInput | null,
};

export type OnCreateChatRoomMemberSubscription = {
  onCreateChatRoomMember?:  {
    __typename: "ChatRoomMember",
    chatRoomId: string,
    createdAt: string,
    id: string,
    joinedAt?: string | null,
    role?: string | null,
    updatedAt: string,
    userId: string,
    userNickname: string,
  } | null,
};

export type OnCreateMessageSubscriptionVariables = {
  filter?: ModelSubscriptionMessageFilterInput | null,
};

export type OnCreateMessageSubscription = {
  onCreateMessage?:  {
    __typename: "Message",
    chatRoomId: string,
    content: string,
    createdAt?: string | null,
    id: string,
    isRead?: boolean | null,
    senderId: string,
    senderNickname: string,
    type?: string | null,
    updatedAt?: string | null,
  } | null,
};

export type OnCreateMessageReadStatusSubscriptionVariables = {
  filter?: ModelSubscriptionMessageReadStatusFilterInput | null,
};

export type OnCreateMessageReadStatusSubscription = {
  onCreateMessageReadStatus?:  {
    __typename: "MessageReadStatus",
    createdAt?: string | null,
    id: string,
    messageId: string,
    readAt?: string | null,
    updatedAt: string,
    userId: string,
  } | null,
};

export type OnCreateUserSubscriptionVariables = {
  filter?: ModelSubscriptionUserFilterInput | null,
  owner?: string | null,
};

export type OnCreateUserSubscription = {
  onCreateUser?:  {
    __typename: "User",
    avatar?: string | null,
    createdAt?: string | null,
    description?: string | null,
    email: string,
    id?: string | null,
    nickname: string,
    owner?: string | null,
    updatedAt?: string | null,
  } | null,
};

export type OnDeleteChatRoomSubscriptionVariables = {
  filter?: ModelSubscriptionChatRoomFilterInput | null,
};

export type OnDeleteChatRoomSubscription = {
  onDeleteChatRoom?:  {
    __typename: "ChatRoom",
    avatar?: string | null,
    createdAt?: string | null,
    description?: string | null,
    id: string,
    lastMessage?: string | null,
    lastMessageAt?: string | null,
    name: string,
    type: string,
    updatedAt?: string | null,
  } | null,
};

export type OnDeleteChatRoomMemberSubscriptionVariables = {
  filter?: ModelSubscriptionChatRoomMemberFilterInput | null,
};

export type OnDeleteChatRoomMemberSubscription = {
  onDeleteChatRoomMember?:  {
    __typename: "ChatRoomMember",
    chatRoomId: string,
    createdAt: string,
    id: string,
    joinedAt?: string | null,
    role?: string | null,
    updatedAt: string,
    userId: string,
    userNickname: string,
  } | null,
};

export type OnDeleteMessageSubscriptionVariables = {
  filter?: ModelSubscriptionMessageFilterInput | null,
};

export type OnDeleteMessageSubscription = {
  onDeleteMessage?:  {
    __typename: "Message",
    chatRoomId: string,
    content: string,
    createdAt?: string | null,
    id: string,
    isRead?: boolean | null,
    senderId: string,
    senderNickname: string,
    type?: string | null,
    updatedAt?: string | null,
  } | null,
};

export type OnDeleteMessageReadStatusSubscriptionVariables = {
  filter?: ModelSubscriptionMessageReadStatusFilterInput | null,
};

export type OnDeleteMessageReadStatusSubscription = {
  onDeleteMessageReadStatus?:  {
    __typename: "MessageReadStatus",
    createdAt?: string | null,
    id: string,
    messageId: string,
    readAt?: string | null,
    updatedAt: string,
    userId: string,
  } | null,
};

export type OnDeleteUserSubscriptionVariables = {
  filter?: ModelSubscriptionUserFilterInput | null,
  owner?: string | null,
};

export type OnDeleteUserSubscription = {
  onDeleteUser?:  {
    __typename: "User",
    avatar?: string | null,
    createdAt?: string | null,
    description?: string | null,
    email: string,
    id?: string | null,
    nickname: string,
    owner?: string | null,
    updatedAt?: string | null,
  } | null,
};

export type OnUpdateChatRoomSubscriptionVariables = {
  filter?: ModelSubscriptionChatRoomFilterInput | null,
};

export type OnUpdateChatRoomSubscription = {
  onUpdateChatRoom?:  {
    __typename: "ChatRoom",
    avatar?: string | null,
    createdAt?: string | null,
    description?: string | null,
    id: string,
    lastMessage?: string | null,
    lastMessageAt?: string | null,
    name: string,
    type: string,
    updatedAt?: string | null,
  } | null,
};

export type OnUpdateChatRoomMemberSubscriptionVariables = {
  filter?: ModelSubscriptionChatRoomMemberFilterInput | null,
};

export type OnUpdateChatRoomMemberSubscription = {
  onUpdateChatRoomMember?:  {
    __typename: "ChatRoomMember",
    chatRoomId: string,
    createdAt: string,
    id: string,
    joinedAt?: string | null,
    role?: string | null,
    updatedAt: string,
    userId: string,
    userNickname: string,
  } | null,
};

export type OnUpdateMessageSubscriptionVariables = {
  filter?: ModelSubscriptionMessageFilterInput | null,
};

export type OnUpdateMessageSubscription = {
  onUpdateMessage?:  {
    __typename: "Message",
    chatRoomId: string,
    content: string,
    createdAt?: string | null,
    id: string,
    isRead?: boolean | null,
    senderId: string,
    senderNickname: string,
    type?: string | null,
    updatedAt?: string | null,
  } | null,
};

export type OnUpdateMessageReadStatusSubscriptionVariables = {
  filter?: ModelSubscriptionMessageReadStatusFilterInput | null,
};

export type OnUpdateMessageReadStatusSubscription = {
  onUpdateMessageReadStatus?:  {
    __typename: "MessageReadStatus",
    createdAt?: string | null,
    id: string,
    messageId: string,
    readAt?: string | null,
    updatedAt: string,
    userId: string,
  } | null,
};

export type OnUpdateUserSubscriptionVariables = {
  filter?: ModelSubscriptionUserFilterInput | null,
  owner?: string | null,
};

export type OnUpdateUserSubscription = {
  onUpdateUser?:  {
    __typename: "User",
    avatar?: string | null,
    createdAt?: string | null,
    description?: string | null,
    email: string,
    id?: string | null,
    nickname: string,
    owner?: string | null,
    updatedAt?: string | null,
  } | null,
};
