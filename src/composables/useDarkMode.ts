import { watch } from 'vue'
import { isDarkMode } from '../services/appConfig'

export function useDarkMode() {
  const updateTheme = (dark: boolean) => {
    if (dark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  // Inicializar el tema
  updateTheme(isDarkMode.value)

  // Observar cambios en isDarkMode
  watch(isDarkMode, (newValue) => {
    updateTheme(newValue)
  })
}
