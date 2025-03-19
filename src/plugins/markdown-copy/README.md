# Markdown Copy Button Plugin

Este plugin para Vue 3 añade botones de copiar a los bloques de código en contenido Markdown renderizado.

## Características

- Añade botones de copiar automáticamente a todos los bloques de código
- Los botones son invisibles hasta que se pasa el ratón por encima
- Proporciona feedback visual cuando se copia el contenido
- Totalmente personalizable mediante opciones
- Compatible con temas claros y oscuros

## Uso

### Como plugin de Vue

```typescript
// En main.ts o main.js
import { createApp } from 'vue'
import App from './App.vue'
import plugins from './plugins'

const app = createApp(App)
app.use(plugins) // Esto registra la directiva v-copy-code
app.mount('#app')
```

```html
<!-- En un componente Vue -->
<div v-copy-code>
  <!-- Contenido con bloques de código -->
  <pre><code>console.log('Hola mundo')</code></pre>
</div>
```

### Como plugin de markdown-it

```typescript
import MarkdownIt from 'markdown-it'
import { markdownItCopy } from './plugins/markdown-copy'

const md = new MarkdownIt()
md.use(markdownItCopy)

const html = md.render('```js\nconsole.log("Hola mundo")\n```')
```

### Como función utilitaria

```typescript
import { addCopyButtonsToElement } from './plugins/markdown-copy'

// Después de que el contenido esté en el DOM
const container = document.querySelector('.markdown-content')
if (container) {
  addCopyButtonsToElement(container)
}
```

## Opciones personalizables

Puedes personalizar el comportamiento pasando opciones:

```typescript
// Al usar la directiva
<div v-copy-code="{
  selector: '.code-block',
  buttonClass: 'mi-boton',
  successDuration: 1000
}">
  <!-- Contenido -->
</div>

// Al usar la función utilitaria
addCopyButtonsToElement(container, {
  selector: '.code-block',
  buttonClass: 'mi-boton',
  successDuration: 1000
})
```

## Licencia

MIT
