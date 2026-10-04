/**
 * Centralized Checkout & Payment Configuration
 * Dual-Gateway Architecture:
 * - Domestic India (INR): Razorpay Payment Pages / UPI / Cards
 * - Global International (USD): Dodo Payments (Merchant of Record / Global Cards / Apple Pay)
 */

export const CHECKOUT_URLS = {
  INR: {
    PRO_MONTHLY: import.meta.env?.VITE_CHECKOUT_INR_MONTHLY || 'https://pages.razorpay.com/redactify-pro-monthly',
    LIFETIME: import.meta.env?.VITE_CHECKOUT_INR_LIFETIME || 'https://pages.razorpay.com/redactify-pro-lifetime',
    ENTERPRISE: 'mailto:sakthivel@daeq.in?subject=Redactify%20Enterprise%20INR%20Inquiry'
  },
  USD: {
    PRO_MONTHLY: import.meta.env?.VITE_CHECKOUT_USD_MONTHLY || 'https://checkout.dodopayments.com/buy/redactify-pro-monthly',
    LIFETIME: import.meta.env?.VITE_CHECKOUT_USD_LIFETIME || 'https://checkout.dodopayments.com/buy/redactify-pro-lifetime',
    ENTERPRISE: 'mailto:sakthivel@daeq.in?subject=Redactify%20Enterprise%20USD%20Inquiry'
  }
};

/**
 * Open external checkout URL in a new window or trigger mailto
 */
export function launchCheckout(currency = 'USD', planType = 'PRO_MONTHLY') {
  const currencyGroup = CHECKOUT_URLS[currency] || CHECKOUT_URLS.USD;
  const url = currencyGroup[planType] || currencyGroup.PRO_MONTHLY;

  if (url.startsWith('mailto:')) {
    window.location.href = url;
    return;
  }

  if (typeof window !== 'undefined') {
    const opened = window.open(url, '_blank', 'noopener,noreferrer');
    if (!opened) {
      window.location.href = url;
    }
  }
}
