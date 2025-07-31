import React, { useEffect, useState } from 'react';
import api, { updateUserProfile } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import styles from './AccountPage.module.css';

const AccountPage = () => {
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ full_name: '', email: '' });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
  const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      setSuccess(null);
      try {
        // Use the api instance method
        const response = await api.getCurrentUserProfile();
        const userData = response.data.data.user;
        setProfile(userData);
        setForm({
          full_name: userData.full_name,
          email: userData.email,
        });
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load account info.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await updateUserProfile(form);
      setProfile({ ...profile, ...form });
      setEditMode(false);
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className={styles.accountContainer}>Loading account...</div>;
  if (error) return <div className={styles.accountContainer}>{error}</div>;
  if (!profile) return null;

  return (
    <div className={styles.accountContainer}>
      <h1 className={styles.accountTitle}>My Account</h1>
      <div className={styles.accountInfoBox}>
        <div className={styles.avatarSection}>
          <div className={styles.avatar}>{profile.full_name?.[0] || 'U'}</div>
          <div className={styles.roleBadge}>{profile.role}</div>
        </div>
        <div className={styles.accountInfo}>
          {editMode ? (
            <form onSubmit={handleSave} className={styles.editForm}>
              <div className={styles.accountSection}>
                <label className={styles.sectionTitle}>Full Name</label>
                <input
                  className={styles.sectionContent}
                  name="full_name"
                  value={form.full_name}
                  onChange={handleChange}
                  disabled={saving}
                  autoComplete="name"
                  required
                />
              </div>
              <div className={styles.accountSection}>
                <label className={styles.sectionTitle}>Email</label>
                <input
                  className={styles.sectionContent}
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  disabled={saving}
                  autoComplete="email"
                  required
                />
              </div>
              <div className={styles.buttonRow}>
                <button className={styles.editButton} type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  className={styles.editButton}
                  type="button"
                  onClick={() => setEditMode(false)}
                  disabled={saving}
                  style={{ marginLeft: 8 }}
                >
                  Cancel
                </button>
              </div>
              {success && <div className={styles.successMsg}>{success}</div>}
              {error && <div className={styles.errorMsg}>{error}</div>}
            </form>
          ) : (
            <>
              <div className={styles.accountSection}>
                <div className={styles.sectionTitle}>Full Name</div>
                <div className={styles.sectionContent}>{profile.full_name}</div>
              </div>
              <div className={styles.accountSection}>
                <div className={styles.sectionTitle}>Email</div>
                <div className={styles.sectionContent}>{profile.email}</div>
              </div>
              <div className={styles.accountSection}>
                <div className={styles.sectionTitle}>Role</div>
                <div className={styles.sectionContent}>{profile.role}</div>
              </div>
              <div className={styles.accountSection}>
                <div className={styles.sectionTitle}>Joined</div>
                <div className={styles.sectionContent}>
                  {new Date(profile.createdAt).toLocaleDateString()}
                </div>
              </div>
              <button className={styles.editButton} onClick={() => setEditMode(true)}>
                Edit Profile
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountPage;
