import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'

const ToastCtx = createContext({ toast: () => {} })

export function ToastProvider({ children }) {
  const [open, setOpen] = useState(false)
  const [opts, setOpts] = useState({ message: '', severity: 'info', duration: 3000 })

  const toast = useCallback(({ message, severity = 'info', duration = 3000 }) => {
    setOpts({ message, severity, duration })
    setOpen(true)
  }, [])

  const value = useMemo(()=>({ toast }), [toast])

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={opts.duration}
        onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setOpen(false)} severity={opts.severity} variant="filled" sx={{ width: '100%' }}>
          {opts.message}
        </Alert>
      </Snackbar>
    </ToastCtx.Provider>
  )
}

export function useToast() {
  return useContext(ToastCtx)
}
