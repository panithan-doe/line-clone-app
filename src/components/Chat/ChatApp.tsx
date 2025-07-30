import { useState, useEffect } from "react";
import { MessageCircle } from "lucide-react";
import { ChatSidebar } from "./ChatSidebar";
import { ChatRoom } from "./ChatRoom";
import { signOut } from "aws-amplify/auth";
import { getUrl } from 'aws-amplify/storage';
import { client } from "../../lib/amplify";
import { onCreateMessage, onUpdateChatRoom } from "../../../subscriptions";
import type { ChatRoom as ChatRoomType, Message } from "../../types";

interface ChatAppProps {
  user: any; // User from Cognito with attributes
}

export function ChatApp({ user }: ChatAppProps) {
  const [selectedRoom, setSelectedRoom] = useState<ChatRoomType | null>(null);
  const [chatRooms, setChatRooms] = useState<ChatRoomType[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [profilePictureCache, setProfilePictureCache] = useState<Record<string, string | null>>({});
  const [userRole, setUserRole] = useState<string | undefined>(undefined);
  const [isCurrentChatUnavailable, setIsCurrentChatUnavailable] = useState(false);

  // Debug user data
  console.log('ChatApp - User data:', user);
  console.log('ChatApp - User email:', user?.attributes?.email);

  // Helper function to convert Amplify data to Message type
  const convertToMessage = (amplifyMessage: any): Message => {
    const now = new Date().toISOString();
    return {
      id: amplifyMessage.id || '',
      content: amplifyMessage.content || '',
      type: amplifyMessage.type || 'text',
      chatRoomId: amplifyMessage.chatRoomId || '',
      senderId: amplifyMessage.senderId || '',
      senderNickname: amplifyMessage.senderNickname || '',
      isRead: amplifyMessage.isRead || false,
      createdAt: amplifyMessage.createdAt || now,
      updatedAt: amplifyMessage.updatedAt || now,
    };
  };

  // Helper function to convert Amplify data to ChatRoom type
  const convertToChatRoom = (amplifyRoom: any): ChatRoomType => {
    const now = new Date().toISOString();
    return {
      id: amplifyRoom.id || '',
      name: amplifyRoom.name || '',
      type: amplifyRoom.type || 'private',
      description: amplifyRoom.description || '',
      lastMessage: amplifyRoom.lastMessage || '',
      lastMessageAt: amplifyRoom.lastMessageAt || '',
      createdAt: amplifyRoom.createdAt || now,
      updatedAt: amplifyRoom.updatedAt || now,
      otherUserAvatar: amplifyRoom.otherUserAvatar || null,
      otherUserId: amplifyRoom.otherUserId || null,
    };
  };

  // Fetch unread message counts for all chat rooms
  const fetchUnreadCounts = async (roomIds: string[]) => {
    try {
      const counts: Record<string, number> = {};
      
      for (const roomId of roomIds) {
        // Get the chat room to check if it's private or group
        const { data: rooms } = await client.models.ChatRoom.list({
          filter: {
            id: {
              eq: roomId
            }
          }
        });
        
        const room = rooms[0];
        if (!room) continue;
        
        if (room.type === 'private') {
          // For private chats, use the existing isRead logic
          const { data: unreadMessages } = await client.models.Message.list({
            filter: {
              chatRoomId: {
                eq: roomId
              },
              senderId: {
                ne: user.attributes.email // Not sent by current user
              },
              isRead: {
                eq: false
              }
            }
          });
          
          counts[roomId] = unreadMessages ? unreadMessages.length : 0;
        } else {
          // For group chats, check MessageReadStatus
          const { data: allMessages } = await client.models.Message.list({
            filter: {
              chatRoomId: {
                eq: roomId
              },
              senderId: {
                ne: user.attributes.email // Not sent by current user
              }
            }
          });
          
          if (allMessages) {
            let unreadCount = 0;
            for (const message of allMessages) {
              if (message.id) {
                // Check if current user has read this message
                const { data: readStatus } = await client.models.MessageReadStatus.list({
                  filter: {
                    messageId: {
                      eq: message.id
                    },
                    userId: {
                      eq: user.attributes.email
                    }
                  }
                });
                
                if (!readStatus || readStatus.length === 0) {
                  unreadCount++;
                }
              }
            }
            counts[roomId] = unreadCount;
          } else {
            counts[roomId] = 0;
          }
        }
      }
      
      setUnreadCounts(counts);
    } catch (error) {
      console.error('Error fetching unread counts:', error);
    }
  };

  // Fetch chat rooms where the current user is a member
  const fetchChatRooms = async () => {
    try {
      setLoading(true);
      
      // Get all chat room memberships for the current user
      const { data: memberships } = await client.models.ChatRoomMember.list({
        filter: {
          userId: {
            eq: user.attributes.email
          }
        }
      });

      if (memberships && memberships.length > 0) {
        // Get the actual chat rooms with proper display names
        const roomPromises = memberships.map(async (membership) => {
          if (!membership.chatRoomId) return null;
          
          const { data: rooms } = await client.models.ChatRoom.list({
            filter: {
              id: {
                eq: membership.chatRoomId
              }
            }
          });
          
          const room = rooms[0];
          if (!room) return null;
          
          // For private chats, get the other user's name
          if (room.type === 'private') {
            // Get all members of this chat room
            const { data: allMembers } = await client.models.ChatRoomMember.list({
              filter: {
                chatRoomId: {
                  eq: room.id ?? undefined
                }
              }
            });
            
            // Find the other user (not current user)
            const otherMember = allMembers.find(member => 
              member.userId && member.userId !== user.attributes.email
            );
            
            console.log('Private chat members:', allMembers);
            console.log('Other member found:', otherMember);
            
            if (otherMember) {
              // Get the other user's profile data including avatar
              let otherUserAvatar: string | null = null;
              
              // Check cache first
              if (profilePictureCache[otherMember.userId]) {
                otherUserAvatar = profilePictureCache[otherMember.userId];
                console.log('Using cached avatar for:', otherMember.userId);
              } else {
                try {
                  console.log('About to load other user data for:', otherMember.userId);
                  
                  // Try Lambda first (preferred)
                  let userData = null;
                  try {
                    const userResponse = await client.queries.verifyUser({
                      email: otherMember.userId
                    });
                    userData = userResponse?.data as any || null;
                    console.log('Lambda user data result:', userData);
                  } catch (lambdaError) {
                    console.log('Lambda failed for user:', otherMember.userId, 'trying direct access');
                    // Fallback to direct access
                    try {
                      const { data: directUserData } = await client.models.User.get({
                        email: otherMember.userId
                      });
                      userData = directUserData;
                      console.log('Direct user data result:', userData);
                    } catch (directError) {
                      console.error('Both Lambda and direct access failed for user:', otherMember.userId);
                      userData = null;
                    }
                  }
                  
                  console.log('Final user data:', userData);
                  
                  if (userData?.avatar) {
                    console.log('Other user avatar path:', userData.avatar);
                    try {
                      const { url } = await getUrl({
                        key: userData.avatar,
                        options: {
                          accessLevel: 'guest'
                        }
                      });
                      otherUserAvatar = url.toString();
                      console.log('Other user avatar URL:', otherUserAvatar);
                    } catch (avatarError) {
                      console.error('Error getting other user avatar URL:', avatarError);
                    }
                    
                    // Cache the profile picture
                    if (otherUserAvatar) {
                      setProfilePictureCache(prev => ({
                        ...prev,
                        [otherMember.userId]: otherUserAvatar
                      }));
                    }
                  }
                } catch (err) {
                  console.error('Error loading other user avatar:', err);
                }
              }
              
              // Get the other user's current nickname from User table
              let otherUserNickname = otherMember.userNickname || otherMember.userId;
              
              try {
                console.log('Loading user nickname for:', otherMember.userId);
                
                // Try Lambda first (preferred)
                let userData = null;
                try {
                  const userResponse = await client.queries.verifyUser({
                    email: otherMember.userId
                  });
                  userData = userResponse?.data as any || null;
                  console.log('Lambda user data result for nickname:', userData);
                } catch (lambdaError) {
                  console.log('Lambda failed for nickname, trying direct access');
                  // Fallback to direct access
                  try {
                    const { data: directUserData } = await client.models.User.get({
                      email: otherMember.userId
                    });
                    userData = directUserData;
                    console.log('Direct user data result for nickname:', userData);
                  } catch (directError) {
                    console.error('Both Lambda and direct access failed for nickname:', directError);
                    userData = null;
                  }
                }
                
                console.log('Final user data for nickname:', userData);
                
                if (userData?.nickname) {
                  otherUserNickname = userData.nickname;
                }
              } catch (err) {
                console.error('Error loading other user nickname:', err);
              }
              
              // Use the other user's current nickname for display
              const roomData = {
                ...room,
                name: otherUserNickname,
                otherUserAvatar: otherUserAvatar,
                otherUserId: otherMember.userId
              };
              
              console.log('Creating room data:', roomData.name, 'Avatar:', roomData.otherUserAvatar);
              return roomData;
            } else {
              // No other member found - the other user left the chat
              console.log('No other member found in private chat, showing as unavailable');
              const roomData = {
                ...room,
                name: 'Unavailable Chat',
                otherUserAvatar: null,
                otherUserId: null,
                isUnavailable: true // Flag to indicate this chat is unavailable
              };
              
              return roomData;
            }
          }
          
          return room;
        });

        const rooms = await Promise.all(roomPromises);
        const validRooms = rooms
          .filter(room => room !== null && room !== undefined)
          .map(room => convertToChatRoom(room));
        
        setChatRooms(validRooms);
        
        // Fetch unread counts for all rooms
        const roomIds = validRooms.map(room => room.id);
        await fetchUnreadCounts(roomIds);
      } else {
        console.log('No chat room memberships found for user');
        setChatRooms([]);
      }
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChatRooms();
  }, []);

  // Periodically check if the current private chat is still available
  useEffect(() => {
    if (!selectedRoom || selectedRoom.type !== 'private') {
      return;
    }

    const checkInterval = setInterval(async () => {
      const isAvailable = await checkChatAvailability(selectedRoom.id);
      const wasUnavailable = isCurrentChatUnavailable;
      const nowUnavailable = !isAvailable;
      
      if (wasUnavailable !== nowUnavailable) {
        console.log('Chat availability changed:', isAvailable);
        setIsCurrentChatUnavailable(nowUnavailable);
        
        // If chat just became unavailable, update the room name in the sidebar
        if (nowUnavailable) {
          setChatRooms(prev => prev.map(room => 
            room.id === selectedRoom.id 
              ? { ...room, name: 'Unavailable Chat', isUnavailable: true, otherUserAvatar: null, otherUserId: null }
              : room
          ));
        }
      }
    }, 5000); // Check every 5 seconds

    return () => {
      clearInterval(checkInterval);
    };
  }, [selectedRoom, isCurrentChatUnavailable]);

  // Set up global message subscription for unread count updates in sidebar
  useEffect(() => {
    console.log('=== USEEFFECT 1: Global message subscription ===');
    console.log('Dependencies - selectedRoom?.id:', selectedRoom?.id, 'user.attributes.email:', user?.attributes?.email);
    console.log('Setting up global message subscription for unread counts');
    
    const globalMessageSubscription = client.graphql({
      query: onCreateMessage
    }).subscribe({
      next: ({ data }) => {
        const newMessage = data.onCreateMessage;
        console.log('🟢 Global message received:', newMessage);
        
        if (newMessage && newMessage.senderId !== user.attributes.email) {
          // Update unread count for this room if it's not the currently selected room
          if (selectedRoom?.id !== newMessage.chatRoomId) {
            setUnreadCounts(prev => ({
              ...prev,
              [newMessage.chatRoomId]: (prev[newMessage.chatRoomId] || 0) + 1
            }));

            // Update the chat room's lastMessage and lastMessageAt for proper sorting
            // This is crucial for rooms that are not currently open
            setChatRooms((prev) =>
              prev.map((room) =>
                room.id === newMessage.chatRoomId
                  ? {
                      ...room,
                      lastMessage: newMessage.content || '',
                      lastMessageAt: newMessage.createdAt || new Date().toISOString(),
                    }
                  : room
              )
            );
          }
        }
      },
      error: (error) => {
        console.error('🔴 Global message subscription error:', error);
      }
    });

    return () => {
      console.log('Cleaning up global message subscription');
      globalMessageSubscription.unsubscribe();
    };
  }, [selectedRoom?.id, user?.attributes?.email]);

  // Mark messages as read
  const markMessagesAsRead = async (roomId: string) => {
    try {
      // Get the chat room to check if it's private or group
      const { data: rooms } = await client.models.ChatRoom.list({
        filter: {
          id: {
            eq: roomId
          }
        }
      });
      
      const room = rooms[0];
      if (!room) return;
      
      if (room.type === 'private') {
        // For private chats, use the existing isRead logic
        const { data: unreadMessages } = await client.models.Message.list({
          filter: {
            chatRoomId: {
              eq: roomId
            },
            senderId: {
              ne: user.attributes.email // Not sent by current user
            },
            isRead: {
              eq: false
            }
          }
        });

        // Mark all unread messages as read
        for (const message of unreadMessages) {
          if (message.id) {
            await client.models.Message.update({
              id: message.id,
              isRead: true
            });
          }
        }
      } else {
        // For group chats, create MessageReadStatus entries
        const { data: allMessages } = await client.models.Message.list({
          filter: {
            chatRoomId: {
              eq: roomId
            },
            senderId: {
              ne: user.attributes.email // Not sent by current user
            }
          }
        });
        
        if (allMessages) {
          for (const message of allMessages) {
            if (message.id) {
              // Check if current user has already read this message
              const { data: existingReadStatus } = await client.models.MessageReadStatus.list({
                filter: {
                  messageId: {
                    eq: message.id
                  },
                  userId: {
                    eq: user.attributes.email
                  }
                }
              });
              
              // If not read yet, create read status
              if (!existingReadStatus || existingReadStatus.length === 0) {
                await client.models.MessageReadStatus.create({
                  messageId: message.id,
                  userId: user.attributes.email,
                  readAt: new Date().toISOString(),
                  createdAt: new Date().toISOString(),
                });
              }
            }
          }
        }
      }

      // Update unread count for this room
      setUnreadCounts(prev => ({
        ...prev,
        [roomId]: 0
      }));
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  // Fetch messages for selected room
  const fetchMessages = async (roomId: string) => {
    try {
      const { data: roomMessages } = await client.models.Message.list({
        filter: {
          chatRoomId: {
            eq: roomId
          }
        }
      });
      
      // Convert to Message type and sort by creation time
      const convertedMessages = roomMessages
        .map(msg => convertToMessage(msg))
        .sort(
          (a, b) =>
            new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime()
        );
      
      setMessages(convertedMessages);
      
      // Mark messages as read when room is opened
      await markMessagesAsRead(roomId);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  useEffect(() => {
    if (selectedRoom) {
      fetchMessages(selectedRoom.id);
    }
  }, [selectedRoom]);

  // Set up real-time subscriptions for new messages
  useEffect(() => {
    console.log('=== USEEFFECT 2: Room message subscription ===');
    console.log('Dependencies - selectedRoom?.id:', selectedRoom?.id, 'user.attributes.email:', user?.attributes?.email);
    if (!selectedRoom) {
      console.log('No selected room, skipping subscription setup');
      return;
    }

    console.log('Setting up message subscription for room:', selectedRoom.id);
    
    const messageSubscription = client.graphql({
      query: onCreateMessage,
      variables: {
        filter: {
          chatRoomId: {
            eq: selectedRoom.id
          }
        }
      }
    }).subscribe({
      next: ({ data }) => {
        console.log('🟢 New message received in room:', data.onCreateMessage);
        const newMessage = data.onCreateMessage;
        
        if (newMessage && newMessage.senderId !== user.attributes.email) {
          // Only add messages from other users to avoid duplicates
          const convertedMessage = convertToMessage(newMessage);
          setMessages((prev) => {
            // Check if message already exists to avoid duplicates
            const exists = prev.some(msg => msg.id === convertedMessage.id);
            if (!exists) {
              return [...prev, convertedMessage];
            }
            return prev;
          });

          // Update the chat room's lastMessage and lastMessageAt for proper sorting
          setChatRooms((prev) =>
            prev.map((room) =>
              room.id === selectedRoom.id
                ? {
                    ...room,
                    lastMessage: newMessage.content || '',
                    lastMessageAt: newMessage.createdAt || new Date().toISOString(),
                  }
                : room
            )
          );

          // Since we're in the current chat room, automatically mark this message as read
          // No need to increment unread count for the current room
          if (newMessage.id) {
            markMessagesAsRead(selectedRoom.id);
          }
        }
      },
      error: (error) => {
        console.error('Message subscription error:', error);
      }
    });

    return () => {
      console.log('Cleaning up message subscription');
      messageSubscription.unsubscribe();
    };
  }, [selectedRoom?.id, user?.attributes?.email]);

  // Set up real-time subscriptions for chat room updates (last message updates)
  useEffect(() => {
    console.log('=== USEEFFECT 3: Chat room update subscription ===');
    console.log('Dependencies - selectedRoom?.id:', selectedRoom?.id);
    console.log('Setting up chat room update subscription');
    
    const chatRoomSubscription = client.graphql({
      query: onUpdateChatRoom
    }).subscribe({
      next: ({ data }) => {
        console.log('🟢 Chat room updated:', data.onUpdateChatRoom);
        const updatedRoom = data.onUpdateChatRoom;
        
        if (updatedRoom) {
          // Update the chat room in the sidebar with new last message info
          setChatRooms((prev) =>
            prev.map((room) =>
              room.id === updatedRoom.id
                ? {
                    ...room,
                    lastMessage: updatedRoom.lastMessage || '',
                    lastMessageAt: updatedRoom.lastMessageAt || '',
                  }
                : room
            )
          );

          // If this update is for a room we're not currently viewing, 
          // we might need to update unread counts
          if (selectedRoom?.id !== updatedRoom.id) {
            // Refresh unread counts for the updated room
            fetchUnreadCounts([updatedRoom.id]);
          }
        }
      },
      error: (error) => {
        console.error('Chat room subscription error:', error);
      }
    });

    return () => {
      console.log('Cleaning up chat room subscription');
      chatRoomSubscription.unsubscribe();
    };
  }, [selectedRoom?.id]);

  const sendMessage = async (content: string) => {
    if (!selectedRoom || !user) return;

    try {
      // Get current user's nickname from User table
      let currentUserNickname = user.attributes.email;
      
      try {
        console.log('Loading current user nickname for message sending...');
        
        // Try Lambda first (preferred)
        let userData = null;
        try {
          const userResponse = await client.queries.verifyUser({
            email: user.attributes.email
          });
          userData = userResponse?.data as any || null;
          console.log('Lambda current user data result:', userData);
        } catch (lambdaError) {
          console.log('Lambda failed for current user, trying direct access');
          // Fallback to direct access
          try {
            const { data: directUserData } = await client.models.User.get({
              email: user.attributes.email
            });
            userData = directUserData;
            console.log('Direct current user data result:', userData);
          } catch (directError) {
            console.error('Both Lambda and direct access failed for current user:', directError);
            userData = null;
          }
        }
        
        console.log('Final current user data for nickname:', userData);
        
        if (userData?.nickname) {
          currentUserNickname = userData.nickname;
        }
      } catch (err) {
        console.error('Error loading current user nickname:', err);
      }
      
      // Send message via Lambda function
      console.log('Sending message with data:', {
        chatRoomId: selectedRoom.id,
        content: content,
        type: "text",
        senderId: user.attributes.email,
        senderNickname: currentUserNickname
      });
      
      const messageResponse = await client.mutations.sendMessage({
        chatRoomId: selectedRoom.id,
        content: content,
        type: "text",
        senderId: user.attributes.email,
        senderNickname: currentUserNickname
      });
      
      console.log('Send message response:', messageResponse);
      console.log('Send message errors:', messageResponse?.errors);
      if (messageResponse?.errors) {
        messageResponse.errors.forEach((error, index) => {
          console.log(`Send message error ${index + 1}:`, error.message);
          console.log('Error details:', error);
        });
      }
      
      const newMessage = messageResponse?.data;
      
      // If Lambda fails, try direct model access as fallback
      let finalMessage = newMessage;
      if (!newMessage && messageResponse?.errors) {
        console.log('Lambda sendMessage failed, trying direct model access...');
        try {
          const { data: directMessage } = await client.models.Message.create({
            content,
            type: "text",
            chatRoomId: selectedRoom.id,
            senderId: user.attributes.email,
            senderNickname: currentUserNickname,
            isRead: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          finalMessage = directMessage;
          console.log('Direct message creation succeeded:', finalMessage);
          
          // IMPORTANT: Update ChatRoom's lastMessage since Lambda didn't do it
          // This ensures receivers see the correct lastMessage via real-time subscriptions
          try {
            await client.models.ChatRoom.update({
              id: selectedRoom.id,
              lastMessage: content,
              lastMessageAt: new Date().toISOString()
            });
            console.log('ChatRoom lastMessage updated successfully after direct message creation');
          } catch (updateError) {
            console.error('Failed to update ChatRoom lastMessage:', updateError);
          }
        } catch (directError) {
          console.error('Direct message creation also failed:', directError);
        }
      }

      if (finalMessage) {
        // Convert to Message type and add to local state
        const convertedMessage = convertToMessage(finalMessage);
        setMessages((prev) => [...prev, convertedMessage]);

        // The Lambda function already updates the chat room's last message
        // No need for manual update

        // Update local state for chat rooms
        setChatRooms((prev) =>
          prev.map((room) =>
            room.id === selectedRoom.id
              ? {
                  ...room,
                  lastMessage: content,
                  lastMessageAt: new Date().toISOString(),
                }
              : room
          )
        );

        // For other users, this message will be unread, but we don't need to update our local unread count
        // since we're the sender and we don't count our own messages as unread
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.reload(); // force logout and trigger AuthWrapper to re-check
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  };

  // Fetch user's role in a specific chat room
  const fetchUserRole = async (roomId: string) => {
    try {
      const { data: memberships } = await client.models.ChatRoomMember.list({
        filter: {
          and: [
            { chatRoomId: { eq: roomId } },
            { userId: { eq: user.attributes.email } }
          ]
        }
      });

      if (memberships && memberships.length > 0) {
        return memberships[0].role || 'member';
      }
      return 'member';
    } catch (error) {
      console.error('Error fetching user role:', error);
      return 'member';
    }
  };

  // Check if a private chat is still available (has other members)
  const checkChatAvailability = async (roomId: string) => {
    try {
      const { data: memberships } = await client.models.ChatRoomMember.list({
        filter: {
          chatRoomId: { eq: roomId }
        }
      });

      if (memberships && memberships.length > 0) {
        // Check if there's another member besides the current user
        const otherMember = memberships.find(member => 
          member.userId && member.userId !== user.attributes.email
        );
        return !!otherMember; // Returns true if other member exists, false if not
      }
      return false;
    } catch (error) {
      console.error('Error checking chat availability:', error);
      return false;
    }
  };

  // Handle room selection and fetch user role
  const handleSelectRoom = async (room: ChatRoomType) => {
    setSelectedRoom(room);
    
    // Check if this is a private chat and if it's still available
    if (room.type === 'private') {
      const isAvailable = await checkChatAvailability(room.id);
      setIsCurrentChatUnavailable(!isAvailable);
      console.log('Private chat availability:', isAvailable);
    } else {
      setIsCurrentChatUnavailable(false);
    }
    
    // Fetch user role for the selected room
    if (room.type === 'group') {
      const role = await fetchUserRole(room.id);
      setUserRole(role);
      console.log('User role in group chat:', role);
    } else {
      setUserRole(undefined); // Private chats don't need role checking
    }
  };

  // Remove chat (soft delete for private chats, hard delete for group chats by admin)
  const handleRemoveChat = async (roomId: string) => {
    try {
      console.log('Removing chat:', roomId);
      
      // Find the user's membership in this chat room
      const { data: memberships } = await client.models.ChatRoomMember.list({
        filter: {
          and: [
            { chatRoomId: { eq: roomId } },
            { userId: { eq: user.attributes.email } }
          ]
        }
      });

      if (memberships && memberships.length > 0) {
        const membership = memberships[0];
        
        // Handle group chat deletion (admin only)
        if (selectedRoom?.type === 'group') {
          if (membership.role !== 'admin') {
            console.error('Only admins can remove group chats');
            return;
          }
          
          console.log('Admin is deleting entire group chat...');
          
          // Step 1: Get all members of the group
          const { data: allMemberships } = await client.models.ChatRoomMember.list({
            filter: {
              chatRoomId: { eq: roomId }
            }
          });
          
          // Step 2: Delete all memberships (removes everyone from the group)
          if (allMemberships && allMemberships.length > 0) {
            const deletePromises = allMemberships.map(memberToDelete => 
              client.models.ChatRoomMember.delete({
                id: memberToDelete.id
              })
            );
            
            await Promise.all(deletePromises);
            console.log(`Removed ${allMemberships.length} members from group`);
          }
          
          // Step 3: Delete the chat room itself (optional - keeps message history)
          // Uncomment the following lines if you want to delete the chat room completely:
          /*
          try {
            await client.models.ChatRoom.delete({
              id: roomId
            });
            console.log('Chat room deleted completely');
          } catch (roomDeleteError) {
            console.error('Error deleting chat room:', roomDeleteError);
          }
          */
          
          console.log('Group chat deleted successfully');
        } else {
          // Handle private chat removal (soft delete - only remove current user)
          console.log('Removing user from private chat...');
          await client.models.ChatRoomMember.delete({
            id: membership.id
          });
          console.log('Successfully removed from private chat');
        }
        
        // Update local state to remove the chat from sidebar
        setChatRooms(prev => prev.filter(room => room.id !== roomId));
        
        // If this was the selected room, clear the selection
        if (selectedRoom?.id === roomId) {
          setSelectedRoom(null);
          setMessages([]);
          setUserRole(undefined);
        }
        
        // Refresh chat rooms to ensure consistency
        fetchChatRooms();
      } else {
        console.error('Membership not found for chat room:', roomId);
      }
    } catch (error) {
      console.error('Error removing from chat room:', error);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-100">
      <ChatSidebar
        chatRooms={chatRooms}
        selectedRoom={selectedRoom}
        onSelectRoom={handleSelectRoom}
        onSignOut={handleSignOut}
        user={user}
        onChatRoomsUpdate={fetchChatRooms}
        unreadCounts={unreadCounts}
      />

      <div className="flex-1 flex flex-col">
        {selectedRoom ? (
          <ChatRoom
            room={selectedRoom}
            messages={messages}
            onSendMessage={sendMessage}
            currentUserId={user.attributes.email}
            currentUser={user}
            onRemoveChat={handleRemoveChat}
            userRole={userRole}
            isUnavailable={selectedRoom.type === 'private' ? isCurrentChatUnavailable : selectedRoom.isUnavailable}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-12 h-12 text-gray-400" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                Welcome to LINE Clone
              </h2>
              <p className="text-gray-600">Select a chat to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}