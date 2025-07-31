import React, { useState, useEffect } from 'react';
import { 
  SettingsCard,
  SettingsToggle,
  SettingsButton,
  SettingsMessage
} from './SettingsComponents';
import api from '../../services/api';

const RoleManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get('/admin/users');
        setUsers(response.data);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
    } catch (error) {
      console.error('Error updating user role:', error);
    }
  };

  return (
    <SettingsCard title="Role Management">
      {loading ? (
        <div>Loading users...</div>
      ) : (
        <div className="space-y-4">
          {users.map(user => (
            <div key={user.id} className="flex items-center justify-between p-4 border rounded">
              <div>
                <h3 className="font-medium">{user.name}</h3>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
              <div className="flex gap-2">
                <select
                  value={user.role}
                  onChange={(e) => handleRoleChange(user.id, e.target.value)}
                  className="rounded border p-2"
                >
                  <option value="customer">Customer</option>
                  <option value="seller">Seller</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </SettingsCard>
  );
};

export default RoleManagement;
