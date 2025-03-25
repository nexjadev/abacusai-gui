import { useToast } from 'vue-toastification'

export function useNotification() {
  const toast = useToast()

  const showSuccess = (message: string, title?: string) => {
    toast.success(title ? `${title}\n${message}` : message, {
      timeout: 3000, // más rápido para mensajes de éxito
      icon: '✅'
    })
  }

  const showError = (message: string, title?: string) => {
    toast.error(title ? `${title}\n${message}` : message, {
      timeout: 8000, // más tiempo para errores
    })
  }

  const showWarning = (message: string, title?: string) => {
    toast.warning(title ? `${title}\n${message}` : message, {
      timeout: 6000,
      icon: '⚠️'
    })
  }

  const showInfo = (message: string, title?: string) => {
    toast.info(title ? `${title}\n${message}` : message, {
      timeout: 4000,
      icon: 'ℹ️'
    })
  }

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo
  }
}
