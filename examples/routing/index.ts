import axios from 'axios'
import TypeKoa from '../../src'

const countriesQuery = `
  query {
    countries {
      code
      name
    }
  }
`.replace(/\s+/g, ' ')

const app = new TypeKoa()

app
  .use(async (ctx, next) => {
    const start = Date.now()

    await next()

    const { url } = ctx.req
    const end = Date.now()
    const duration = end - start

    console.log(`Responded to ${url} in ${duration} milliseconds`)
  })
  .use((ctx, next) => {
    if (ctx.req.url !== '/') {
      return next()
    }

    const arr = [...Array(1000)].map(() => Math.random())

    ctx.res.setHeader('content-type', 'application/json')
    ctx.res.end(JSON.stringify(arr))
  })
  .use(async (ctx, next) => {
    if (ctx.req.url !== '/countries') {
      return next()
    }

    const { data } = await axios.post('https://countries.trevorblades.com/', {
      query: countriesQuery
    })

    ctx.res.setHeader('content-type', 'application/json')
    ctx.res.end(JSON.stringify(data))
  })
  .listen(3000, () => {
    console.log('TypeKoa listening on port 3000')
  })
