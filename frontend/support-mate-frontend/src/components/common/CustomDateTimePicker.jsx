import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

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
  .custom-input.error {
    border-color: #d32f2f;
    background: #fff5f5;
  }
  .custom-helper-text {
    margin-top: 0.25rem;
    font-size: 0.75rem;
    color: #666;
    font-style: italic;
  }
  .custom-error-text {
    margin-top: 0.25rem;
    font-size: 0.75rem;
    color: #d32f2f;
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

export default function CustomDateTimePicker({ 
  value, 
  onChange, 
  name, 
  label, 
  required, 
  disabled, 
  min, 
  max, 
  placeholder, 
  helperText,
  showValidation = true 
}) {
  const { t } = useTranslation();
  const [error, setError] = useState('');
  const [isValid, setIsValid] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Varsayılan placeholder ve helper text
  const defaultPlaceholder = placeholder || t('components.customDateTimePicker.placeholder.selectDateTime');
  const defaultHelperText = helperText || (required ? t('components.customDateTimePicker.helperText.required') : t('components.customDateTimePicker.helperText.optional'));

  // Validasyon fonksiyonu
  const validateDateTime = (dateTimeValue) => {
    if (!dateTimeValue) {
      if (required && hasInteracted) {
        setError(t('components.customDateTimePicker.validation.required'));
        setIsValid(false);
        return false;
      }
      setError('');
      setIsValid(true);
      return true;
    }

    const selectedDate = new Date(dateTimeValue);
    const currentDate = new Date();

    // Geçersiz tarih kontrolü
    if (isNaN(selectedDate.getTime())) {
      setError(t('components.customDateTimePicker.validation.invalidDate'));
      setIsValid(false);
      return false;
    }

    // Geçmiş tarih kontrolü (min prop varsa)
    if (min) {
      const minDate = new Date(min);
      if (selectedDate < minDate) {
        setError(t('components.customDateTimePicker.validation.pastDate'));
        setIsValid(false);
        return false;
      }
    }

    // Gelecek tarih kontrolü (max prop varsa)
    if (max) {
      const maxDate = new Date(max);
      if (selectedDate > maxDate) {
        setError(t('components.customDateTimePicker.validation.maxDate', { maxDate: maxDate.toLocaleDateString() }));
        setIsValid(false);
        return false;
      }
    }

    setError('');
    setIsValid(true);
    return true;
  };

  // Değer değiştiğinde validasyon yap (sadece etkileşim sonrası)
  useEffect(() => {
    if (showValidation && hasInteracted) {
      validateDateTime(value);
    }
  }, [value, min, max, required, showValidation, hasInteracted]);

  // Input değişiklik handler'ı
  const handleChange = (e) => {
    const newValue = e.target.value;
    
    // İlk etkileşimi işaretle
    if (!hasInteracted) {
      setHasInteracted(true);
    }
    
    if (showValidation) {
      validateDateTime(newValue);
    }
    
    onChange(e);
  };

  // Input'a focus olduğunda da etkileşimi işaretle
  const handleFocus = () => {
    if (!hasInteracted) {
      setHasInteracted(true);
    }
  };

  return (
    <>
      <style>{customInputStyle}</style>
      <div className="custom-input-group">
        {label && <label className="custom-label" htmlFor={name}>{label}{required && ' *'}</label>}
        <input
          className={`custom-input ${!isValid && hasInteracted ? 'error' : ''}`}
          type="datetime-local"
          id={name}
          name={name}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          required={required}
          disabled={disabled}
          min={min}
          max={max}
          placeholder={defaultPlaceholder}
        />
        {error && showValidation && hasInteracted && <div className="custom-error-text">{error}</div>}
        {!error && defaultHelperText && <div className="custom-helper-text">{defaultHelperText}</div>}
      </div>
    </>
  );
} 