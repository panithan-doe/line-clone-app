import { useState, useEffect } from "react";
import { MessageCircle } from "lucide-react";
import { ChatSidebar } from "./ChatSidebar";
import { ChatRoom } from "./ChatRoom";
import { signOut } from "aws-amplify/auth";
import { getUrl } from 'aws-amplify/storage';
import { client } from "../../lib/amplify";
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
            
            
            if (otherMember) {
              // Get the other user's profile data including avatar
              let otherUserAvatar: string | null = null;
              
              // Check cache first
              if (profilePictureCache[otherMember.userId]) {
                otherUserAvatar = profilePictureCache[otherMember.userId];
              } else {
                try {
                  
                  // Try Lambda first (preferred)
                  let userData = null;
                  try {
                    const userResponse = await client.queries.verifyUser({
                      email: otherMember.userId
                    });
                    userData = userResponse?.data as any || null;
                  } catch (lambdaError) {
                    // Fallback to direct access
                    try {
                      const { data: directUserData } = await client.models.User.get({
                        email: otherMember.userId
                      });
                      userData = directUserData;
                    } catch (directError) {
                      userData = null;
                    }
                  }
                  
                  if (userData?.avatar) {
                    try {
                      const { url } = await getUrl({
                        key: userData.avatar,
                        options: {
                          accessLevel: 'guest'
                        }
                      });
                      otherUserAvatar = url.toString();
                    } catch (avatarError) {
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
                }
              }
              
              // Get the other user's current nickname from User table
              let otherUserNickname = otherMember.userNickname || otherMember.userId;
              
              try {
                
                // Try Lambda first (preferred)
                let userData = null;
                try {
                  const userResponse = await client.queries.verifyUser({
                    email: otherMember.userId
                  });
                  userData = userResponse?.data as any || null;
                } catch (lambdaError) {
                  // Fallback to direct access
                  try {
                    const { data: directUserData } = await client.models.User.get({
                      email: otherMember.userId
                    });
                    userData = directUserData;
                  } catch (directError) {
                    userData = null;
                  }
                }
                
                if (userData?.nickname) {
                  otherUserNickname = userData.nickname;
                }
              } catch (err) {
              }
              
              // Use the other user's current nickname for display
              const roomData = {
                ...room,
                name: otherUserNickname,
                otherUserAvatar: otherUserAvatar,
                otherUserId: otherMember.userId
              };
              
              return roomData;
            } else {
              // No other member found - the other user left the chat
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
        setChatRooms([]);
      }
    } catch (error) {
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
    }
  };

  useEffect(() => {
    if (selectedRoom) {
      fetchMessages(selectedRoom.id);
    }
  }, [selectedRoom]);

  // Set up real-time subscriptions for new messages using individual event subscriptions
  useEffect(() => {
    if (!selectedRoom) {
      return;
    }
    
    // Subscribe to message creation events for the current room
    const createSubscription = client.models.Message.onCreate({
      filter: {
        chatRoomId: {
          eq: selectedRoom.id
        }
      }
    }).subscribe({
      next: async (newMessage) => {
        const convertedMessage = convertToMessage(newMessage);
        setMessages(prev => {
          // Check if message already exists to avoid duplicates
          const exists = prev.some(msg => msg.id === convertedMessage.id);
          if (exists) {
            return prev;
          }
          // Add new message and sort
          const updated = [...prev, convertedMessage].sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateA - dateB;
          });
          return updated;
        });

        // If this message is not from the current user, mark it as read since they're viewing the room
        if (newMessage.senderId !== user.attributes.email && newMessage.id && selectedRoom) {
          try {
            await markMessagesAsRead(selectedRoom.id);
          } catch (error) {
          }
        }
      },
      error: (error) => {
      }
    });

    // Subscribe to message update events for the current room (for read status updates)
    const updateSubscription = client.models.Message.onUpdate({
      filter: {
        chatRoomId: {
          eq: selectedRoom.id
        }
      }
    }).subscribe({
      next: (updatedMessage) => {
        const convertedMessage = convertToMessage(updatedMessage);
        setMessages(prev => prev.map(msg => 
          msg.id === convertedMessage.id ? convertedMessage : msg
        ));
      },
      error: (error) => {
      }
    });

    return () => {
      createSubscription.unsubscribe();
      updateSubscription.unsubscribe();
    };
  }, [selectedRoom?.id]);

  // Set up global real-time subscription for sidebar updates (new messages in other rooms)
  useEffect(() => {
    
    // Subscribe to all new message creations for updating sidebar and unread counts
    const subscription = client.models.Message.onCreate().subscribe({
      next: (newMessage) => {
        
        // Update chat rooms list with last message info (for all rooms) and sort by most recent
        setChatRooms(prev => {
          const updated = prev.map(room => {
            if (room.id === newMessage.chatRoomId) {
              return {
                ...room,
                lastMessage: newMessage.content || '',
                lastMessageAt: newMessage.createdAt || new Date().toISOString()
              };
            }
            return room;
          });
          
          // Sort by most recent message
          return updated.sort((a, b) => {
            const dateA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
            const dateB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
            return dateB - dateA; // Most recent first
          });
        });
        
        // Update unread counts for rooms that received new messages 
        // BUT only if the user is NOT currently viewing that room and didn't send the message
        if (newMessage.senderId !== user.attributes.email && 
            (!selectedRoom || selectedRoom.id !== newMessage.chatRoomId)) {
          setUnreadCounts(prev => ({
            ...prev,
            [newMessage.chatRoomId]: (prev[newMessage.chatRoomId] || 0) + 1
          }));
        }
      },
      error: (error) => {
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [user.attributes.email]);



  const sendMessage = async (content: string) => {
    if (!selectedRoom || !user) return;

    try {
      // Get current user's nickname from User table
      let currentUserNickname = user.attributes.email;
      
      try {
        
        // Try Lambda first (preferred)
        let userData = null;
        try {
          const userResponse = await client.queries.verifyUser({
            email: user.attributes.email
          });
          userData = userResponse?.data as any || null;
        } catch (lambdaError) {
          // Fallback to direct access
          try {
            const { data: directUserData } = await client.models.User.get({
              email: user.attributes.email
            });
            userData = directUserData;
          } catch (directError) {
            userData = null;
          }
        }
        
        if (userData?.nickname) {
          currentUserNickname = userData.nickname;
        }
      } catch (err) {
      }
      
      // Strategy: Lambda first (better for heavy load), direct access fallback
      
      let finalMessage = null;
      
      try {
        // Priority 1: Try Lambda first (preferred for heavy load and better scaling)
        const messageResponse = await client.mutations.sendMessage({
          chatRoomId: selectedRoom.id,
          content: content,
          type: "text",
          senderId: user.attributes.email,
          senderNickname: currentUserNickname
        });
        
        finalMessage = messageResponse?.data;
        console.log('✅ Message sent via Lambda successfully');
        
      } catch (lambdaError) {
        console.log('⚠️ Lambda sendMessage failed, falling back to direct access:', lambdaError);
        
        // Priority 2: Fallback to direct AppSync model creation
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
          console.log('✅ Message sent via direct access successfully');
          
          // Update ChatRoom's lastMessage manually (Lambda handles this automatically)
          try {
            await client.models.ChatRoom.update({
              id: selectedRoom.id,
              lastMessage: content,
              lastMessageAt: new Date().toISOString()
            });
          } catch (updateError) {
            console.log('⚠️ Failed to update ChatRoom lastMessage:', updateError);
          }
          
        } catch (directError) {
          console.error('❌ Both Lambda and direct access failed:', { lambdaError, directError });
          throw new Error('Failed to send message via both methods');
        }
      }

      if (finalMessage) {
        // DO NOT add to local state here - let the subscription handle it
        // This prevents duplicate messages since the subscription will add it automatically
        
        // Update local state for chat rooms (sidebar updates)
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
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.reload(); // force logout and trigger AuthWrapper to re-check
    } catch (error) {
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
    } else {
      setIsCurrentChatUnavailable(false);
    }
    
    // Fetch user role for the selected room
    if (room.type === 'group') {
      const role = await fetchUserRole(room.id);
      setUserRole(role);
    } else {
      setUserRole(undefined); // Private chats don't need role checking
    }
  };

  // Remove chat (soft delete for private chats, hard delete for group chats by admin)
  const handleRemoveChat = async (roomId: string) => {
    try {
      
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
            return;
          }
          
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
          }
          
          // Step 3: Delete the chat room itself (optional - keeps message history)
          // Uncomment the following lines if you want to delete the chat room completely:
          /*
          try {
            await client.models.ChatRoom.delete({
              id: roomId
            });
          } catch (roomDeleteError) {
          }
          */
        } else {
          // Handle private chat removal (soft delete - only remove current user)
          await client.models.ChatRoomMember.delete({
            id: membership.id
          });
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
      }
    } catch (error) {
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