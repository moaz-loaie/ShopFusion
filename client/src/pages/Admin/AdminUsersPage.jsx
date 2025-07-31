import React, { useEffect, useState, useCallback } from 'react';
import { adminGetAllUsers, adminDeleteUser } from '../../services/api';
import Pagination from '../../components/Common/Pagination';
import styles from './AdminUsersPage.module.css';

const roleBadgeClass = (role) => `${styles.roleBadge} ${styles[role] || ''}`;

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
    limit: 10,
  });
  const [deletingId, setDeletingId] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');

  const fetchUsers = useCallback(
    async (page = 1) => {
      setLoading(true);
      setError(null);
      setStatusMsg('');
      try {
        const params = {
          page,
          limit: pagination.limit,
          ...(searchTerm && { search: searchTerm }),
        };
        const res = await adminGetAllUsers(params);
        setUsers(res.data.data.users);
        setPagination({
          currentPage: res.data.currentPage,
          totalPages: res.data.totalPages,
          totalUsers: res.data.totalUsers,
          limit: params.limit,
        });
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load users.');
        setUsers([]);
      } finally {
        setLoading(false);
      }
    },
    [pagination.limit, searchTerm],
  );

  useEffect(() => {
    fetchUsers(1);
  }, [fetchUsers]);

  const handlePageChange = (page) => {
    fetchUsers(page);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers(1);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    setDeletingId(userId);
    setStatusMsg('');
    try {
      await adminDeleteUser(userId);
      setStatusMsg('User deleted successfully.');
      fetchUsers(pagination.currentPage);
    } catch (err) {
      setStatusMsg(err.response?.data?.message || 'Failed to delete user.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.header}>Manage Users</h1>

      <div className={styles.searchContainer}>
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <input
            type="search"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={handleSearchChange}
            className={styles.searchInput}
            aria-label="Search users"
          />
          <button type="submit" className={styles.searchButton}>
            Search
          </button>
        </form>
      </div>

      <div className={styles.tableWrapper}>
        {loading ? (
          <div>Loading users...</div>
        ) : error ? (
          <div className={styles.statusMsg}>{error}</div>
        ) : (
          <>
            {statusMsg && <div className={styles.statusMsg}>{statusMsg}</div>}
            <table className={styles.userTable}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.full_name}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className={roleBadgeClass(user.role)}>{user.role}</span>
                    </td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button
                        className={styles.actionBtn}
                        onClick={() => handleDelete(user.id)}
                        disabled={deletingId === user.id}
                        title="Delete user"
                      >
                        {deletingId === user.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default AdminUsersPage;
