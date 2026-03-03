import { useState, useEffect } from 'react';
import axios from '../utils/axios';

function UserList({ onSelectUser, selectedUser }) {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get('/auth/users');
        setUsers(res.data);
      } catch (err) {
        console.error('Error fetching users:', err);
      }
    };
    fetchUsers();
  }, []);

  return (
    <div className="flex-1 overflow-y-auto">
      <h3 className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
        Users
      </h3>
      <div className="space-y-1 px-2">
        {users.map(user => (
          <div
            key={user._id}
            onClick={() => onSelectUser(user)}
            className={`px-4 py-3 rounded-lg cursor-pointer transition-colors duration-200 ${
              selectedUser?._id === user._id
                ? 'bg-blue-100 border-l-4 border-blue-600'
                : 'hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                {user.username ? user.username.charAt(0).toUpperCase() : '?'}
              </div>
              <span className="font-medium text-gray-800">
                {user.username || user.email || 'Unknown User'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default UserList;