import { createApp } from 'vue'
import App from './App.vue'
import './style.css'
import { useDarkMode } from './composables/useDarkMode'
import plugins from './plugins'

// Inicializar el tema oscuro
useDarkMode()

const app = createApp(App)

// Registrar plugins globales
app.use(plugins)

app.mount('#app')
