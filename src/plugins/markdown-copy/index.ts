import markdownItCopy from './markdownItCopy'
import { vCopyCode, addCopyButtonsToElement } from './CodeCopyButtonDirective'

export {
  markdownItCopy,   // Plugin para markdown-it
  vCopyCode,        // Directiva de Vue
  addCopyButtonsToElement  // Función utilitaria
}

// Exportar todo como un objeto
export default {
  markdownItCopy,
  vCopyCode,
  addCopyButtonsToElement
}
