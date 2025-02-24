import { boot } from 'quasar/wrappers'
import markdownit from 'markdown-it'


let mdRenderer;
export default boot(({ app }) => {
  mdRenderer = markdownit({

  });

})

export { mdRenderer }
