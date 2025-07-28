import React, { useState } from 'react';

const customInputStyle = `
  .custom-input-group {
    display: flex;
    flex-direction: column;
    margin-bottom: 0.6rem;
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
  .custom-input.error {
    border-color: #d32f2f;
    background: #fff5f5;
  }
  .custom-char-counter {
    margin-top: 0.25rem;
    font-size: 0.75rem;
    color: #666;
    text-align: right;
  }
  .custom-char-counter.error {
    color: #d32f2f;
  }
  
  /* Size variants */
  .custom-input-group.small .custom-label {
    font-size: 0.85rem;
  }
  .custom-input-group.small .custom-input {
    font-size: 0.9rem;
    padding: 0.5em 0.8em;
  }
  .custom-input-group.small .custom-char-counter {
    font-size: 0.7rem;
  }
  
  .custom-input-group.medium .custom-label {
    font-size: 0.98rem;
  }
  .custom-input-group.medium .custom-input {
    font-size: 1.07rem;
    padding: 0.7em 1em;
  }
  .custom-input-group.medium .custom-char-counter {
    font-size: 0.75rem;
  }
  
  .custom-input-group.large .custom-label {
    font-size: 1.1rem;
  }
  .custom-input-group.large .custom-input {
    font-size: 1.2rem;
    padding: 0.8em 1.2em;
  }
  .custom-input-group.large .custom-char-counter {
    font-size: 0.8rem;
  }
  
  @media (max-width: 600px) {
    .custom-input-group {
      margin-bottom: 0.5rem;
    }
    .custom-input {
      font-size: 0.98rem;
      padding: 0.6em 0.8em;
    }
  }
`;

export default function CustomSingleLineTextArea({ 
  value, 
  onChange, 
  name, 
  placeholder, 
  label, 
  required, 
  disabled,
  minLength,
  maxLength,
  showCharCounter = false,
  size = 'medium'
}) {
  const [hasInteracted, setHasInteracted] = useState(false);
  
  const currentLength = value ? value.length : 0;
  const isOverLimit = maxLength && currentLength > maxLength;
  const isUnderLimit = minLength && currentLength < minLength;
  const hasError = hasInteracted && (isOverLimit || isUnderLimit);

  const handleChange = (e) => {
    if (!hasInteracted) {
      setHasInteracted(true);
    }
    onChange(e);
  };

  const handleFocus = () => {
    if (!hasInteracted) {
      setHasInteracted(true);
    }
  };

  return (
    <>
      <style>{customInputStyle}</style>
      <div className={`custom-input-group ${size}`}>
        {label && <label className="custom-label" htmlFor={name}>{label}{required && ' *'}</label>}
        <input
          className={`custom-input ${hasError ? 'error' : ''}`}
          type="text"
          id={name}
          name={name}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete="off"
          minLength={minLength}
          maxLength={maxLength}
        />
        {showCharCounter && (minLength || maxLength) && (
          <div className={`custom-char-counter ${hasError ? 'error' : ''}`}>
            {currentLength}
            {minLength && maxLength && ` / ${minLength}-${maxLength}`}
            {!minLength && maxLength && ` / ${maxLength}`}
            {minLength && !maxLength && ` / min ${minLength}`}
          </div>
        )}
      </div>
    </>
  );
} 