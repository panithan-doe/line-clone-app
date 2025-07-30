import React, { useState, useEffect, useCallback } from 'react';
import { X, Users, Crown, User as UserIcon } from 'lucide-react';
import { getUrl } from 'aws-amplify/storage';
import { client } from '../../lib/amplify';
import type { ChatRoom } from '../../types';

interface GroupMember {
  id: string;
  userId: string;
  userNickname: string;
  role: string;
  joinedAt: string;
  avatar?: string;
  avatarUrl?: string;
}

interface GroupMembersModalProps {
  room: ChatRoom;
  onClose: () => void;
  currentUser: {
    attributes: {
      email: string;
    };
  };
}

export function GroupMembersModal({ room, onClose, currentUser }: GroupMembersModalProps) {
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchGroupMembers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch all members of this group chat
      const { data: memberships } = await client.models.ChatRoomMember.list({
        filter: {
          chatRoomId: { eq: room.id }
        }
      });

      if (memberships && memberships.length > 0) {
        // For each member, try to fetch their user profile data
        const memberPromises = memberships.map(async (membership) => {
          try {
            // Try Lambda first for user data
            let userData = null;
            try {
              const userResponse = await client.queries.verifyUser({
                email: membership.userId
              });
              userData = userResponse?.data;
            } catch {
              console.log('Lambda failed for user:', membership.userId, 'trying direct access');
              // Fallback to direct access
              try {
                const { data: directUserData } = await client.models.User.get({
                  email: membership.userId
                });
                userData = directUserData;
              } catch {
                console.error('Both Lambda and direct access failed for user:', membership.userId);
              }
            }

            // Get avatar URL if user has one
            let avatarUrl = undefined;
            if (userData?.avatar) {
              try {
                const { url } = await getUrl({ key: userData.avatar });
                avatarUrl = url.toString();
              } catch {
                console.error('Failed to get avatar URL for user:', membership.userId);
              }
            }

            return {
              id: membership.id || '',
              userId: membership.userId || '',
              userNickname: userData?.nickname || membership.userNickname || membership.userId || 'Unknown User',
              role: membership.role || 'member',
              joinedAt: membership.joinedAt || '',
              avatar: userData?.avatar ?? undefined,
              avatarUrl
            };
          } catch (error) {
            console.error('Error fetching member data:', error);
            return {
              id: membership.id || '',
              userId: membership.userId || '',
              userNickname: membership.userNickname || membership.userId || 'Unknown User',
              role: membership.role || 'member',
              joinedAt: membership.joinedAt || '',
            };
          }
        });

        const resolvedMembers = await Promise.all(memberPromises);
        
        // Sort members: admins first, then by join date
        const sortedMembers = resolvedMembers.sort((a, b) => {
          if (a.role === 'admin' && b.role !== 'admin') return -1;
          if (b.role === 'admin' && a.role !== 'admin') return 1;
          
          // Handle missing joinedAt dates
          const aDate = a.joinedAt ? new Date(a.joinedAt).getTime() : 0;
          const bDate = b.joinedAt ? new Date(b.joinedAt).getTime() : 0;
          return aDate - bDate;
        });

        setMembers(sortedMembers);
      } else {
        setMembers([]);
      }
    } catch (err) {
      console.error('Error fetching group members:', err);
      setError('Failed to load group members');
    } finally {
      setLoading(false);
    }
  }, [room.id]);

  useEffect(() => {
    fetchGroupMembers();
  }, [fetchGroupMembers]);

  const formatJoinDate = (dateString: string) => {
    if (!dateString) return 'Unknown';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Unknown';
    }
  };

  const getRoleIcon = (role: string) => {
    return role === 'admin' ? (
      <Crown className="w-4 h-4 text-yellow-500" />
    ) : (
      <UserIcon className="w-4 h-4 text-gray-400" />
    );
  };

  const getRoleText = (role: string) => {
    return role === 'admin' ? 'Admin' : 'Member';
  };

  const getRoleColor = (role: string) => {
    return role === 'admin' ? 'text-yellow-600 bg-yellow-50' : 'text-gray-600 bg-gray-50';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Group Members</h2>
              <p className="text-sm text-gray-500">{room.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          </div>
        )}

        {error && (
          <div className="text-red-500 text-center py-4">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={member.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border bg-gray-50 border-gray-200`}
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                    {member.avatarUrl ? (
                      <img
                        src={member.avatarUrl}
                        alt={`${member.userNickname} avatar`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                        <UserIcon className="w-5 h-5 text-gray-500" />
                      </div>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-800 truncate">
                        {member.userNickname}
                        {member.userId === currentUser.attributes.email && (
                          <span className="text-sm text-green-600 ml-1">(You)</span>
                        )}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500">
                      Joined {formatJoinDate(member.joinedAt)}
                    </p>
                  </div>

                  {/* Role Badge */}
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(member.role)}`}>
                    {getRoleIcon(member.role)}
                    {getRoleText(member.role)}
                  </div>
                </div>
              ))}
            </div>

            {members.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No members found
              </div>
            )}
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500 text-center">
            {members.length} member{members.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
    </div>
  );
}