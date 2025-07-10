import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import { useTranslation } from 'react-i18next';

export default function ConfirmModal({
  open,
  translationKey,
  onConfirm,
  onCancel,
  confirmColor = 'error',
  cancelColor = 'inherit',
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
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
      maxWidth="xs"
      fullWidth
      {...props}
    >
      <DialogTitle id="confirm-dialog-title">{dialogTitle}</DialogTitle>
      <DialogContent>
        <DialogContentText id="confirm-dialog-description">
          {dialogDesc}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
        <Button onClick={onCancel} color={cancelColor} variant="outlined">
          {dialogNo}
        </Button>
        <Button onClick={onConfirm} color={confirmColor} variant="contained" autoFocus>
          {dialogYes}
        </Button>
      </DialogActions>
    </Dialog>
  );
} 