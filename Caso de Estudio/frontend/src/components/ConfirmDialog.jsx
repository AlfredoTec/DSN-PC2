import React from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'

function ConfirmDialog({ open, title = 'Confirmar', description = '¿Seguro?', confirmText = 'Confirmar', cancelText = 'Cancelar', onClose }) {
  return (
    <Dialog open={open} onClose={() => onClose(false)} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{description}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose(false)}>{cancelText}</Button>
        <Button color="error" variant="contained" onClick={() => onClose(true)}>{confirmText}</Button>
      </DialogActions>
    </Dialog>
  )
}

export default ConfirmDialog
