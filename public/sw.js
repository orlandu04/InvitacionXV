/* eslint-disable no-undef */
import { clientsClaim } from 'workbox-core'
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { NetworkFirst } from 'workbox-strategies'

self.skipWaiting()
clientsClaim()

precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

const navigationHandler = async (context) => {
  const networkFirst = new NetworkFirst({
    cacheName: 'navigations',
    networkTimeoutSeconds: 4,
  })
  try {
    const response = await networkFirst.handle(context)
    if (response) return response
    throw new Error('No hay respuesta de red ni caché')
  } catch {
    return createHandlerBoundToURL('/index.html')(context)
  }
}

registerRoute(new NavigationRoute(navigationHandler))