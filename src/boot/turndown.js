import { boot } from 'quasar/wrappers'
import TurndownService from 'turndown'

let htmlToMdRenderer;
export default boot(({ app }) => {
  htmlToMdRenderer = new TurndownService();

})

export { htmlToMdRenderer }
