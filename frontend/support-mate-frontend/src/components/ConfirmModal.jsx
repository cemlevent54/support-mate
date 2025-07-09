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
  ...props
}) {
  const { t } = useTranslation();
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
      <DialogTitle id="confirm-dialog-title">{t(`confirm.${translationKey}Title`)}</DialogTitle>
      <DialogContent>
        <DialogContentText id="confirm-dialog-description">
          {t(`confirm.${translationKey}Desc`)}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
        <Button onClick={onCancel} color={cancelColor} variant="outlined">
          {t(`confirm.${translationKey}No`)}
        </Button>
        <Button onClick={onConfirm} color={confirmColor} variant="contained" autoFocus>
          {t(`confirm.${translationKey}Yes`)}
        </Button>
      </DialogActions>
    </Dialog>
  );
} 