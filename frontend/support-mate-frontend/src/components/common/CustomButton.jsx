import React from 'react';

const customButtonStyle = `
  .custom-btn {
    display: inline-block;
    font-size: 1.05rem;
    font-weight: 500;
    padding: 0.62em 1.5em;
    border-radius: 7px;
    border: none;
    outline: none;
    cursor: pointer;
    transition: background 0.18s, color 0.18s, box-shadow 0.18s, border-color 0.18s;
    box-shadow: 0 1px 2px rgba(60,60,60,0.04);
    margin: 0;
    min-width: 90px;
  }
  
  /* Size variants */
  .custom-btn.small {
    font-size: 0.9rem;
    padding: 0.4em 1em;
    min-width: 70px;
  }
  
  .custom-btn.medium {
    font-size: 1.05rem;
    padding: 0.62em 1.5em;
    min-width: 90px;
  }
  
  .custom-btn.large {
    font-size: 1.2rem;
    padding: 0.8em 2em;
    min-width: 110px;
  }
  .custom-btn.primary {
    background: #1976d2;
    color: #fff;
    border: 1.5px solid #1976d2;
  }
  .custom-btn.primary:hover:not(:disabled), .custom-btn.primary:focus-visible:not(:disabled) {
    background: #1251a3;
    border-color: #1251a3;
    box-shadow: 0 2px 8px 0 rgba(25,118,210,0.13);
  }
  .custom-btn.secondary {
    background: #fff;
    color: #1976d2;
    border: 1.5px solid #1976d2;
  }
  .custom-btn.secondary:hover:not(:disabled), .custom-btn.secondary:focus-visible:not(:disabled) {
    background: #e3f0fd;
    color: #1251a3;
    border-color: #1251a3;
    box-shadow: 0 2px 8px 0 rgba(25,118,210,0.10);
  }
  .custom-btn.danger {
    background: #e53935;
    color: #fff;
    border: 1.5px solid #e53935;
  }
  .custom-btn.danger:hover:not(:disabled), .custom-btn.danger:focus-visible:not(:disabled) {
    background: #b71c1c;
    border-color: #b71c1c;
    box-shadow: 0 2px 8px 0 rgba(229,57,53,0.13);
  }
  .custom-btn.outline {
    background: #fff;
    color: #444;
    border: 1.5px solid #bbb;
  }
  .custom-btn.outline:hover:not(:disabled), .custom-btn.outline:focus-visible:not(:disabled) {
    background: #f5f5f5;
    color: #1976d2;
    border-color: #1976d2;
    box-shadow: 0 2px 8px 0 rgba(25,118,210,0.07);
  }
  .custom-btn:disabled {
    opacity: 0.55;
    cursor: not-allowed;
    background: #f5f5f5 !important;
    color: #aaa !important;
    border-color: #eee !important;
    box-shadow: none !important;
  }
  @media (max-width: 600px) {
    .custom-btn {
      font-size: 0.97rem;
      padding: 0.5em 1em;
      min-width: 70px;
    }
  }
`;

export default function CustomButton({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  disabled = false,
  style = {},
  className = '',
  size = 'medium',
  ...rest
}) {
  return (
    <>
      <style>{customButtonStyle}</style>
      <button
        type={type}
        className={`custom-btn ${variant} ${size} ${className}`}
        onClick={onClick}
        disabled={disabled}
        style={style}
        {...rest}
      >
        {children}
      </button>
    </>
  );
}
