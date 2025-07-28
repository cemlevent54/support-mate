import React from 'react';
import { useTranslation } from 'react-i18next';
import CustomButton from './CustomButton';

export default function ConfirmModal({
  open,
  translationKey,
  onConfirm,
  onCancel,
  confirmColor = 'danger',
  cancelColor = 'secondary',
  title,
  description,
  confirmText,
  cancelText,
  ...props
}) {
  const { t } = useTranslation();
  const dialogTitle = translationKey ? t(`confirm.${translationKey}Title`) : title;
  const dialogDesc = translationKey ? t(`confirm.${translationKey}Desc`) : description;
  const dialogNo = translationKey ? t(`confirm.${translationKey}No`) : (cancelText || 'Hayır');
  const dialogYes = translationKey ? t(`confirm.${translationKey}Yes`) : (confirmText || 'Evet');

  if (!open) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1300,
      padding: '16px'
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '400px',
        width: '100%',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{
          marginBottom: '16px',
          textAlign: 'center'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: 600,
            color: '#1f2937',
            margin: 0,
            marginBottom: '8px'
          }}>
            {dialogTitle}
          </h2>
          <p style={{
            fontSize: '14px',
            color: '#6b7280',
            margin: 0,
            lineHeight: '1.5'
          }}>
            {dialogDesc}
          </p>
        </div>

        {/* Actions */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
          marginTop: '24px'
        }}>
          <CustomButton
            variant={cancelColor}
            onClick={onCancel}
            style={{
              minWidth: '100px'
            }}
          >
            {dialogNo}
          </CustomButton>
          
          <CustomButton
            variant={confirmColor}
            onClick={onConfirm}
            style={{
              minWidth: '100px'
            }}
          >
            {dialogYes}
          </CustomButton>
        </div>
      </div>
    </div>
  );
} 