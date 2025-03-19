import { App } from 'vue'
import { vCopyCode } from './markdown-copy'

// Importar estilos de plugins
import './markdown-copy/styles.css'

// Plugin global para Vue
export default {
  install(app: App) {
    // Registrar directivas
    app.directive('copy-code', vCopyCode)

    // Aquí se pueden registrar otros plugins en el futuro
  }
}
