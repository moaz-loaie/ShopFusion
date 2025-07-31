import React from 'react';
import styles from './Settings.module.css';

export const SettingsCard = ({ title, icon, children }) => (
  <div className={styles.settingsCard}>
    <h2>{icon} {title}</h2>
    {children}
  </div>
);

export const SettingsToggle = ({ label, checked, onChange }) => (
  <div className={styles.formGroup}>
    <label className={styles.switch}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
      />
      <span className={styles.slider}></span>
    </label>
    <span>{label}</span>
  </div>
);

export const SettingsSelect = ({ label, value, options, onChange }) => (
  <div className={styles.formGroup}>
    <label>{label}</label>
    <select 
      className={styles.select}
      value={value}
      onChange={onChange}
    >
      {options.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
);

export const SettingsInput = ({ label, type = "text", value, onChange, ...props }) => (
  <div className={styles.formGroup}>
    <label>{label}</label>
    <input
      className={styles.numberInput}
      type={type}
      value={value}
      onChange={onChange}
      {...props}
    />
  </div>
);

export const SettingsButton = ({ children, onClick, disabled }) => (
  <button
    className={styles.saveButton}
    onClick={onClick}
    disabled={disabled}
  >
    {children}
  </button>
);

export const SettingsMessage = ({ type, children }) => (
  <div className={`${styles.message} ${styles[type]}`}>
    {children}
  </div>
);

export const SettingsGrid = ({ children }) => (
  <div className={styles.settingsGrid}>
    {children}
  </div>
);

export const SettingsPage = ({ title, children }) => (
  <div className={styles.settingsPage}>
    <h1 className={styles.pageTitle}>{title}</h1>
    {children}
  </div>
);
