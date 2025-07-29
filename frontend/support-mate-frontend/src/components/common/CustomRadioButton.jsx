import React from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Typography from '@mui/material/Typography';
import FormHelperText from '@mui/material/FormHelperText';

const CustomRadioButton = ({
  label,
  name,
  value,
  onChange,
  options = [],
  required = false,
  disabled = false,
  error = false,
  helperText = '',
  placeholder = '',
  minLength,
  maxLength,
  showCharCounter = false,
  sx = {},
  ...props
}) => {
  const { t } = useTranslation();

  const handleChange = (event) => {
    const newValue = event.target.value;
    onChange({
      target: {
        name,
        value: newValue
      }
    });
  };

  const getErrorText = () => {
    if (error) {
      return typeof error === 'string' ? error : t('components.customTextInput.validation.required');
    }
    if (required && !value) {
      return t('components.customTextInput.validation.required');
    }
    if (minLength && value && value.length < minLength) {
      return t('components.customTextInput.validation.minLength', { minLength });
    }
    if (maxLength && value && value.length > maxLength) {
      return t('components.customTextInput.validation.maxLength', { maxLength });
    }
    return helperText;
  };

  const hasError = error || (required && !value) || 
    (minLength && value && value.length < minLength) || 
    (maxLength && value && value.length > maxLength);

  return (
    <Box sx={{ mb: 2, ...sx }}>
      {label && (
        <Typography 
          variant="body2" 
          sx={{ 
            mb: 1, 
            fontWeight: 500, 
            fontSize: '14px',
            color: hasError ? '#d32f2f' : 'inherit'
          }}
        >
          {label}
          {required && <span style={{ color: '#d32f2f' }}> *</span>}
        </Typography>
      )}
      
      <FormControl 
        component="fieldset" 
        error={hasError}
        disabled={disabled}
        sx={{ width: '100%' }}
      >
        <RadioGroup
          name={name}
          value={value || ''}
          onChange={handleChange}
          sx={{
            '& .MuiFormControlLabel-root': {
              margin: '4px 0',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid transparent',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                backgroundColor: '#f5f5f5',
                borderColor: '#e0e0e0'
              },
              '&.Mui-checked': {
                backgroundColor: '#e3f2fd',
                borderColor: '#1976d2'
              }
            },
            '& .MuiRadio-root': {
              color: '#666',
              '&.Mui-checked': {
                color: '#1976d2'
              }
            },
            '& .MuiFormControlLabel-label': {
              fontSize: '14px',
              fontWeight: 400,
              color: '#333'
            }
          }}
        >
          {options.map((option, index) => (
            <FormControlLabel
              key={option.value || index}
              value={option.value}
              control={<Radio />}
              label={option.label}
              disabled={disabled || option.disabled}
            />
          ))}
        </RadioGroup>
        
        {getErrorText() && (
          <FormHelperText 
            sx={{ 
              mt: 0.5, 
              fontSize: '12px',
              color: hasError ? '#d32f2f' : '#666'
            }}
          >
            {getErrorText()}
          </FormHelperText>
        )}
        
        {showCharCounter && maxLength && (
          <Typography 
            variant="caption" 
            sx={{ 
              mt: 0.5, 
              color: '#666',
              fontSize: '12px',
              textAlign: 'right',
              display: 'block'
            }}
          >
            {value ? value.length : 0} / {maxLength}
          </Typography>
        )}
      </FormControl>
    </Box>
  );
};

export default CustomRadioButton; 