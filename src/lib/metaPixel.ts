const PIXEL_ID = "933256558361153";
const CURRENCY = "DZD";

declare global {
	interface Window {
		fbq?: (...args: any[]) => void;
		_fbq?: (...args: any[]) => void;
		__metaPixelConsent?: boolean;
	}
}

let isInitialized = false;

function canTrack() {
	if (typeof window === "undefined") return false;
	if (window.__metaPixelConsent === false) return false;
	return true;
}

export function initMetaPixel() {
	if (!canTrack() || isInitialized) return;
	if (window.fbq) {
		isInitialized = true;
		return;
	}

	// Official Meta Pixel base code (async script load)
	((f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) => {
		if (f.fbq) return;
		n = f.fbq = function () {
			n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
		};
		if (!f._fbq) f._fbq = n;
		n.push = n;
		n.loaded = true;
		n.version = "2.0";
		n.queue = [];
		t = b.createElement(e);
		t.async = true;
		t.src = v;
		t.setAttribute("data-fb-pixel", PIXEL_ID);
		s = b.getElementsByTagName(e)[0];
		s.parentNode?.insertBefore(t, s);
	})(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");

	window.fbq?.("init", PIXEL_ID);
	isInitialized = true;
}

export function trackEvent(event: string, params?: Record<string, unknown>) {
	if (!canTrack()) return;
	if (!window.fbq) return;
	window.fbq("track", event, params);
}

export function trackPageView() {
	trackEvent("PageView");
}

export function trackViewContent(product: { id: string; name: string; price: number; category?: string }) {
	trackEvent("ViewContent", {
		content_ids: [product.id],
		content_name: product.name,
		content_category: product.category,
		content_type: "product",
		value: product.price,
		currency: CURRENCY,
	});
}

export function trackAddToCart(product: { id: string; name: string; price: number }, qty = 1) {
	trackEvent("AddToCart", {
		content_ids: [product.id],
		content_name: product.name,
		content_type: "product",
		value: product.price * qty,
		currency: CURRENCY,
		num_items: qty,
	});
}

export function trackInitiateCheckout(value: number, numItems = 0) {
	trackEvent("InitiateCheckout", {
		value,
		currency: CURRENCY,
		num_items: numItems,
	});
}

export function trackPurchase(value: number, orderId?: string) {
	trackEvent("Purchase", {
		value,
		currency: CURRENCY,
		order_id: orderId,
	});
}
