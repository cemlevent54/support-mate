import React from 'react';

const customInputStyle = `
  .custom-input-group {
    display: flex;
    flex-direction: column;
    margin-bottom: 1.1rem;
    width: 100%;
    max-width: 100%;
  }
  .custom-label {
    margin-bottom: 0.28em;
    font-weight: 500;
    font-size: 0.98rem;
    color: #666;
    transition: color 0.2s;
  }
  .custom-input:focus + .custom-label,
  .custom-input-group:focus-within .custom-label {
    color: #1976d2;
  }
  .custom-input {
    font-size: 1.07rem;
    padding: 0.7em 1em;
    border: 1.5px solid #d1d5db;
    border-radius: 8px;
    outline: none;
    background: #fff;
    transition: border-color 0.2s, box-shadow 0.2s;
    width: 100%;
    box-sizing: border-box;
    box-shadow: 0 1px 2px rgba(60,60,60,0.03);
  }
  .custom-input:focus {
    border-color: #1976d2;
    box-shadow: 0 2px 8px 0 rgba(25,118,210,0.08);
    background: #f7fbff;
  }
  .custom-input:disabled {
    background: #f5f5f5;
    color: #aaa;
    border-color: #eee;
  }
  @media (max-width: 600px) {
    .custom-input-group {
      margin-bottom: 0.7rem;
    }
    .custom-input {
      font-size: 0.98rem;
      padding: 0.6em 0.8em;
    }
  }
`;

export default function CustomDateTimePicker({ value, onChange, name, label, required, disabled, min, max }) {
  return (
    <>
      <style>{customInputStyle}</style>
      <div className="custom-input-group">
        {label && <label className="custom-label" htmlFor={name}>{label}{required && ' *'}</label>}
        <input
          className="custom-input"
          type="datetime-local"
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          min={min}
          max={max}
        />
      </div>
    </>
  );
} 