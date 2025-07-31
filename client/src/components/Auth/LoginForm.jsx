// File: client/src/components/Auth/LoginForm.js
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import Input from '../Common/Input';
import Button from '../Common/Button';
import { validateEmail, validatePassword } from '../../utils/validators';
import styles from './AuthForm.module.css'; // Example CSS module

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState(''); // For API errors
  const { login } = useAuth();
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    if (emailError) newErrors.email = emailError;
    if (passwordError) newErrors.password = passwordError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // Return true if form is valid
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(''); // Clear previous server errors
    if (!validateForm()) {
      return; // Stop submission if validation fails
    }

    setLoading(true);
    const result = await login({ email, password });
    setLoading(false);

    if (result.success) {
      navigate('/'); // Redirect to home page or dashboard on successful login
    } else {
      // Display server-side error message
      setServerError(result.message || 'Login failed. Please check your credentials.');
      setErrors({}); // Clear field-specific errors if server error occurs
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.authForm} noValidate>
      <h2>Login</h2>
      {serverError && <p className={styles.serverError}>{serverError}</p>}

      <Input
        label="Email"
        type="email"
        id="login-email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
        required
        autoComplete="email"
      />

      <Input
        label="Password"
        type="password"
        id="login-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
        required
        autoComplete="current-password"
      />

      <Button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </Button>

      <p className={styles.linkText}>
        Don't have an account? <Link to="/register">Register here</Link>
      </p>
       {/* Add "Forgot Password" link here if implemented */}
    </form>
  );
};

export default LoginForm;