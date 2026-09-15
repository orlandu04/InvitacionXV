import type { NextFunction, Request, Response } from 'express'
import { config } from '../config'

export const ADMIN_COOKIE = 'admin_session'

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const cookies = (req.cookies ?? {}) as Record<string, unknown>
  if (cookies[ADMIN_COOKIE] === config.adminPassword) {
    next()
    return
  }
  if (req.get('x-admin-token') === config.adminPassword) {
    next()
    return
  }
  res.status(401).json({ error: 'No autorizado' })
}