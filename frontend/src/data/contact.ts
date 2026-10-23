/**
 * Public contact configuration. The WhatsApp number is intentionally public
 * (it's already what `wa.me` links expose) — never put secrets behind a
 * VITE_* variable.
 */

const DEFAULT_WHATSAPP_NUMBER = "917382016152"

export const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER || DEFAULT_WHATSAPP_NUMBER

export const whatsappUrl = `https://wa.me/${whatsappNumber}`
