// Meta Pixel removed — client does not use Facebook Ads tracking.
// All functions are no-ops kept for backward compatibility with existing imports.

export function initMetaPixel() {}
export function trackEvent(_event: string, _params?: Record<string, unknown>) {}
export function trackViewContent(_product: { id: string; name: string; price: number; category?: string }) {}
export function trackAddToCart(_product: { id: string; name: string; price: number }, _qty?: number) {}
export function trackInitiateCheckout(_value: number, _numItems?: number) {}
export function trackPurchase(_value: number, _orderId?: string) {}
