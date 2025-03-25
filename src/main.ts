import { createApp } from 'vue'
import App from './App.vue'
import './style.css'
import { useDarkMode } from './composables/useDarkMode'
import plugins from './plugins'
import Toast, { POSITION, type PluginOptions } from 'vue-toastification'
import 'vue-toastification/dist/index.css'
import './styles/toast.css'

// Opciones por defecto para las notificaciones
const toastOptions: PluginOptions = {
  position: POSITION.TOP_RIGHT,
  timeout: 5000,
  closeOnClick: true,
  pauseOnFocusLoss: true,
  pauseOnHover: true,
  draggable: true,
  draggablePercent: 0.6,
  showCloseButtonOnHover: false,
  hideProgressBar: true,
  closeButton: 'button',
  icon: true,
  rtl: false
}

// Inicializar el tema oscuro
useDarkMode()

const app = createApp(App)

// Registrar plugins globales
app.use(plugins)
app.use(Toast, toastOptions)

app.mount('#app')
