import React from 'react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';
import type { ChatRoom } from '../../types';

interface ConfirmRemoveModalProps {
  room: ChatRoom;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  userRole?: string; // 'admin' or 'member' for group chats
}

export function ConfirmRemoveModal({ room, onConfirm, onCancel, loading = false, userRole }: ConfirmRemoveModalProps) {
  const isGroup = room.type === 'group';
  const isAdmin = isGroup && userRole === 'admin';
  const title = isGroup ? (isAdmin ? 'Delete Group?' : 'Leave Group?') : 'Remove Friend?';
  const actionText = isGroup ? (isAdmin ? 'Delete Group' : 'Leave Group') : 'Remove Friend';
  
  const getDescription = () => {
    if (isGroup) {
      const isAdmin = userRole === 'admin';
      return (
        <>
          <p className="text-gray-600 mb-4">
            Are you sure you want to {isAdmin ? 'delete' : 'leave'} <span className="font-semibold">"{room.name}"</span>?
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">This action will:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  {isAdmin ? (
                    <>
                      <li>Delete the entire group chat permanently</li>
                      <li>Remove all members from the group</li>
                      <li>Delete all chat history for everyone</li>
                      <li>This action cannot be undone</li>
                    </>
                  ) : (
                    <>
                      <li>Remove you from the group chat</li>
                      <li>Delete all chat history from your device</li>
                      <li>You won't receive new messages from this group</li>
                      <li>Other members will remain in the group</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </>
      );
    } else {
      return (
        <>
          <p className="text-gray-600 mb-4">
            Are you sure you want to remove the chat with <span className="font-semibold">"{room.name}"</span>?
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">This action will:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Remove this chat from your chat list</li>
                  <li>Delete all chat history from your device</li>
                  <li>You won't receive new messages from this contact</li>
                  <li>The chat will show as "Unavailable Chat" for the other person</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <Trash2 className="w-4 h-4 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
          </div>
          <button
            onClick={onCancel}
            disabled={loading}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          {getDescription()}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 font-medium flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Removing...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                {actionText}
              </>
            )}
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-4">
          {isGroup 
            ? (isAdmin 
                ? "All members will lose access to this group permanently."
                : "You can be re-added to the group by any admin later."
              )
            : "You can start a new chat with this person anytime."
          }
        </p>
      </div>
    </div>
  );
}