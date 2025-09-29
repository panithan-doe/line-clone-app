import React from 'react';
import { UserPlus, Users, X } from 'lucide-react';

interface ActionMenuProps {
  onAddFriend: () => void;
  onCreateGroup: () => void;
  onClose: () => void;
}

export function ActionMenu({ onAddFriend, onCreateGroup, onClose }: ActionMenuProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Start New Chat</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {/* <div></div> */}
        <div className="space-y-3">
          <button
            onClick={onAddFriend}
            className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 rounded-lg transition-colors text-left"
          >
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-medium text-gray-800">Add Friend</h3>
              <p className="text-sm text-gray-500">Start a private chat with a friend</p>
            </div>
          </button>

          <button
            onClick={onCreateGroup}
            className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 rounded-lg transition-colors text-left"
          >
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-medium text-gray-800">Create Group</h3>
              <p className="text-sm text-gray-500">Start a group chat with friends</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}