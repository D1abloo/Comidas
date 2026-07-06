import { useEffect } from 'react'
import { dispatchMobileSync } from './mobile-sync'

export const ORDERS_CHANGED_EVENT = 'bocado-orders-changed'

export type OrderStreamEvent = {
  type: string
  order_id?: string
  status?: string
  courier_id?: string | null
  courier_name?: string | null
}

export function onOrdersChanged(handler: () => void) {
  window.addEventListener(ORDERS_CHANGED_EVENT, handler)
  return () => window.removeEventListener(ORDERS_CHANGED_EVENT, handler)
}

export function useOrderStream(enabled = true) {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return

    let es: EventSource | null = null
    let retryTimer: ReturnType<typeof setTimeout> | undefined
    let closed = false

    const connect = () => {
      if (closed) return
      es?.close()
      es = new EventSource('/api/events/orders', { withCredentials: true })

      es.onmessage = (msg) => {
        try {
          const data = JSON.parse(msg.data) as OrderStreamEvent
          if (data.type === 'connected') return

          dispatchMobileSync()
          window.dispatchEvent(new CustomEvent(ORDERS_CHANGED_EVENT, { detail: data }))

          if (data.order_id) {
            window.dispatchEvent(
              new CustomEvent('bocado-admin-order-update', {
                detail: {
                  order_id: data.order_id,
                  status: data.status,
                  courier_name: data.courier_name,
                },
              }),
            )
          }
        } catch {
          /* ignore */
        }
      }

      es.onerror = () => {
        es?.close()
        if (!closed) retryTimer = setTimeout(connect, 2500)
      }
    }

    connect()
    return () => {
      closed = true
      es?.close()
      if (retryTimer) clearTimeout(retryTimer)
    }
  }, [enabled])
}
