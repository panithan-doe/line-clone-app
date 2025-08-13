import React, { useState, useRef, useEffect } from 'react';
import { Phone, Video, MoreVertical, Users, User, Trash2 } from 'lucide-react';
import { ConfirmRemoveModal } from './ConfirmRemoveModal';
import type { ChatRoom } from '../../types';

interface ChatHeaderProps {
  room: ChatRoom;
  currentUser: any;
  onRemoveChat: (roomId: string) => void;
  userRole?: string; // 'admin' or 'member' for group chats
  onShowGroupMembers?: () => void;
}

export function ChatHeader({ room, currentUser, onRemoveChat, userRole, onShowGroupMembers }: ChatHeaderProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [removing, setRemoving] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleRemoveClick = () => {
    // Check permissions before allowing removal
    if (room.type === 'group' && userRole !== 'admin') {
      return; // Don't allow non-admin members to remove group
    }
    setShowDropdown(false);
    setShowConfirmModal(true);
  };

  const handleConfirmRemove = async () => {
    setRemoving(true);
    try {
      await onRemoveChat(room.id);
      setShowConfirmModal(false);
    } catch (error) {
      console.error('Error removing chat:', error);
      // Keep modal open on error so user can try again
    } finally {
      setRemoving(false);
    }
  };

  const handleCancelRemove = () => {
    setShowConfirmModal(false);
    setRemoving(false);
  };

  const getRemoveText = () => {
    return room.type === 'group' ? 'Remove Group' : 'Remove Friend';
  };

  const canRemoveChat = () => {
    // Private chats: both users can remove
    if (room.type === 'private') {
      return true;
    }
    // Group chats: only admins can remove
    return userRole === 'admin';
  };

  return (
    <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center">
          {room.type === 'group' ? (
            <div className="w-full h-full bg-blue-500 flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
          ) : room.otherUserAvatar ? (
            <img
              src={room.otherUserAvatar}
              alt={`${room.name} profile`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-500 flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
          )}
        </div>
        <div>
          {room.type === 'group' ? (
            <button 
              onClick={onShowGroupMembers}
              className="text-left hover:text-green-600 transition-colors"
            >
              <h2 className="font-semibold text-gray-800">{room.name}</h2>
              <p className="text-sm text-gray-500">Group Chat</p>
            </button>
          ) : (
            <div>
              <h2 className="font-semibold text-gray-800">{room.name}</h2>
              <p className="text-sm text-gray-500"></p>
            </div>
          )}
        </div>
      </div>
      
      {/* <div className="flex items-center space-x-2">

        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <MoreVertical className="w-5 h-5 text-gray-600" />
          </button>
          
          {showDropdown && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
              <button
                onClick={handleRemoveClick}
                disabled={!canRemoveChat()}
                className={`w-full px-4 py-2 text-left flex items-center gap-3 transition-colors ${
                  canRemoveChat()
                    ? 'text-red-600 hover:bg-red-50 cursor-pointer'
                    : 'text-gray-400 cursor-not-allowed opacity-50'
                }`}
              >
                <Trash2 className="w-4 h-4" />
                {getRemoveText()}
                {room.type === 'group' && !canRemoveChat() && (
                  <span className="text-xs ml-auto">(Admin only)</span>
                )}
              </button>
            </div>
          )}
        </div>
      </div> */}
      
      {/* Confirmation Modal */}
      {/* {showConfirmModal && (
        <ConfirmRemoveModal
          room={room}
          onConfirm={handleConfirmRemove}
          onCancel={handleCancelRemove}
          loading={removing}
          userRole={userRole}
        />
      )} */}
    </div>
  );
}