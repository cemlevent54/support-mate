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
  select.custom-input {
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    background-image: url('data:image/svg+xml;utf8,<svg fill="%231976d2" height="20" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg"><path d="M7 10l5 5 5-5z"/></svg>');
    background-repeat: no-repeat;
    background-position: right 0.9em center;
    background-size: 1.3em;
    padding-right: 2.5em;
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

export default function CustomDropdown({ value, onChange, name, label, required, disabled, options = [], placeholder }) {
  return (
    <>
      <style>{customInputStyle}</style>
      <div className="custom-input-group">
        {label && <label className="custom-label" htmlFor={name}>{label}{required && ' *'}</label>}
        <select
          className="custom-input"
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
        >
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    </>
  );
} 