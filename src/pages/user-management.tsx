import React, { useState } from 'react';

const initialUsers = [
  { id: 1, name: 'Alice Admin', role: 'admin', email: 'alice@tender.com' },
  { id: 2, name: 'Oscar Officer', role: 'officer', email: 'oscar@tender.com' },
  { id: 3, name: 'Betty Bidder', role: 'bidder', email: 'betty@tender.com' },
  { id: 4, name: 'Sam Bidder', role: 'bidder', email: 'sam@tender.com' },
];

const UserManagement = () => {
  const [users, setUsers] = useState(initialUsers);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'bidder' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editUser, setEditUser] = useState({ name: '', email: '', role: 'bidder' });

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    setUsers([
      ...users,
      { ...newUser, id: users.length + 1 },
    ]);
    setNewUser({ name: '', email: '', role: 'bidder' });
  };

  const handleEdit = (user: any) => {
    setEditingId(user.id);
    setEditUser({ name: user.name, email: user.email, role: user.role });
  };

  const handleSave = (id: number) => {
    setUsers(users.map(u => u.id === id ? { ...u, ...editUser } : u));
    setEditingId(null);
  };

  const handleDelete = (id: number) => {
    setUsers(users.filter(u => u.id !== id));
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">User Management</h1>
      <form onSubmit={handleAddUser} className="bg-white rounded shadow p-4 mb-8 flex gap-4 items-end">
        <div>
          <label className="font-semibold">Name</label>
          <input
            className="border rounded px-2 py-1 w-full"
            value={newUser.name}
            onChange={e => setNewUser({ ...newUser, name: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="font-semibold">Email</label>
          <input
            className="border rounded px-2 py-1 w-full"
            type="email"
            value={newUser.email}
            onChange={e => setNewUser({ ...newUser, email: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="font-semibold">Role</label>
          <select
            className="border rounded px-2 py-1 w-full"
            value={newUser.role}
            onChange={e => setNewUser({ ...newUser, role: e.target.value })}
          >
            <option value="admin">Admin</option>
            <option value="officer">Tender Officer</option>
            <option value="bidder">Bidder</option>
          </select>
        </div>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded font-semibold">Add User</button>
      </form>
      <div className="bg-white rounded shadow p-6">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b">
              <th className="py-2">Name</th>
              <th className="py-2">Email</th>
              <th className="py-2">Role</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b hover:bg-gray-50">
                <td className="py-2 font-medium">
                  {editingId === user.id ? (
                    <input
                      className="border rounded px-2 py-1"
                      value={editUser.name}
                      onChange={e => setEditUser({ ...editUser, name: e.target.value })}
                    />
                  ) : (
                    user.name
                  )}
                </td>
                <td className="py-2">
                  {editingId === user.id ? (
                    <input
                      className="border rounded px-2 py-1"
                      value={editUser.email}
                      onChange={e => setEditUser({ ...editUser, email: e.target.value })}
                    />
                  ) : (
                    user.email
                  )}
                </td>
                <td className="py-2">
                  {editingId === user.id ? (
                    <select
                      className="border rounded px-2 py-1"
                      value={editUser.role}
                      onChange={e => setEditUser({ ...editUser, role: e.target.value })}
                    >
                      <option value="admin">Admin</option>
                      <option value="officer">Tender Officer</option>
                      <option value="bidder">Bidder</option>
                    </select>
                  ) : (
                    user.role.charAt(0).toUpperCase() + user.role.slice(1)
                  )}
                </td>
                <td className="py-2 flex gap-2">
                  {editingId === user.id ? (
                    <>
                      <button className="text-green-700 font-semibold hover:underline" onClick={() => handleSave(user.id)}>Save</button>
                      <button className="text-gray-600 hover:underline" onClick={() => setEditingId(null)}>Cancel</button>
                    </>
                  ) : (
                    <button className="text-gray-600 hover:underline" onClick={() => handleEdit(user)}>Edit</button>
                  )}
                  <button className="text-red-600 hover:underline" onClick={() => handleDelete(user.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;
