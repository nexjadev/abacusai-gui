import MarkdownIt from 'markdown-it'
import Token from 'markdown-it/lib/token'

// Plugin para MarkdownIt que prepara los bloques de código para tener botones de copiar
export default function markdownItCopy(md: MarkdownIt): void {
  // Guardar la función original de renderizado de código
  const originalFence = md.renderer.rules.fence!

  // Reemplazar con nuestra función personalizada
  md.renderer.rules.fence = (tokens: Token[], idx: number, options, env, slf) => {
    // Renderizar el bloque de código como lo haría normalmente
    const originalRendered = originalFence(tokens, idx, options, env, slf)

    // Añadir un atributo para identificar los bloques de código que necesitan botones de copiar
    return originalRendered.replace('<pre>', '<pre data-copy-target="true">')
  }
}
