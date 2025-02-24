import { boot } from 'quasar/wrappers'
import { createDirectus, rest, authentication  } from '@directus/sdk';

const directusClient = createDirectus('https://cms.inscriptor.io').with(authentication()).with(rest());

export default boot(({ app }) => {
})

export { directusClient }
