import {
  createServer,
  RequestListener,
  Server,
  IncomingMessage,
  ServerResponse
} from 'http'

export interface Context {
  req: IncomingMessage;
  res: ServerResponse;
}
type NextFunction = () => Promise<void>
type MiddlewareArgs = [Context, NextFunction]

type SyncMiddleware = (...args: MiddlewareArgs) => void
type AsyncMiddleware = (...args: MiddlewareArgs) => Promise<void>
export type Middleware = SyncMiddleware | AsyncMiddleware

export const compose = (...middleware: Middleware[]): AsyncMiddleware => (
  ctx,
  next
): Promise<void> =>
  middleware.reduceRight<NextFunction>(
    (next, middleware): NextFunction => (): Promise<void> => {
      try {
        return Promise.resolve(middleware(ctx, next))
      } catch (e) {
        return Promise.reject(e)
      }
    },
    next
  )()

export default class TypeKoa {
  middleware: Middleware[] = []

  use(middleware: Middleware): this {
    this.middleware.push(middleware)

    return this
  }

  callback(): RequestListener {
    const fn = compose(...this.middleware)

    const handler: RequestListener = async (req, res) => {
      const ctx: Context = { req, res }

      try {
        await fn(ctx, () => Promise.resolve())

        if (!res.finished) res.end()
      } catch (e) {
        res.flushHeaders()
        res.statusCode = 400
        res.end(String(e))
      }
    }

    return handler
  }

  listen(...args: Parameters<Server['listen']>): this {
    createServer(this.callback()).listen(...args)

    return this
  }
}
