/**
 * Centralized UPI Billing Configuration
 * 
 * Supports environment variables or default production fallbacks:
 * - UPI_ID / VITE_UPI_ID
 * - BUSINESS_NAME / VITE_BUSINESS_NAME
 * - UPI_QR_IMAGE / VITE_UPI_QR_IMAGE
 * 
 * Never hardcode these values across multiple components.
 */

export interface UpiBillingConfig {
  upiId: string;
  businessName: string;
  qrImage: string;
  currency: string;
}

export function getUpiBillingConfig(): UpiBillingConfig {
  const upiId = (
    (typeof process !== 'undefined' && process.env?.UPI_ID) ||
    (typeof process !== 'undefined' && process.env?.VITE_UPI_ID) ||
    'sohamkharat85@oksbi'
  ).trim();

  const businessName = (
    (typeof process !== 'undefined' && process.env?.BUSINESS_NAME) ||
    (typeof process !== 'undefined' && process.env?.VITE_BUSINESS_NAME) ||
    'SalesPilot CRM Technologies'
  ).trim();

  // Custom QR image URL provided by merchant (can be empty string or data URI)
  const qrImage = (
    (typeof process !== 'undefined' && process.env?.UPI_QR_IMAGE) ||
    (typeof process !== 'undefined' && process.env?.VITE_UPI_QR_IMAGE) ||
    ''
  ).trim();

  return {
    upiId,
    businessName,
    qrImage,
    currency: 'INR'
  };
}

/**
 * Standard NPCI UPI URI generator for Scan & Pay apps:
 * GPay, PhonePe, Paytm, BHIM, Cred, etc.
 */
export function generateUpiIntentUri(params: {
  upiId: string;
  businessName: string;
  amount: number;
  note: string;
}): string {
  const { upiId, businessName, amount, note } = params;
  const searchParams = new URLSearchParams();
  searchParams.set('pa', upiId);
  searchParams.set('pn', businessName);
  searchParams.set('am', amount.toFixed(2));
  searchParams.set('cu', 'INR');
  searchParams.set('tn', note);
  return `upi://pay?${searchParams.toString()}`;
}
