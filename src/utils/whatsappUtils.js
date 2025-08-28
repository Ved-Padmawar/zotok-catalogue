/**
 * Utility functions for WhatsApp link generation
 */

/**
 * Generates a WhatsApp link using the specified format
 * @param {string} phoneNumber - Phone number (digits only)
 * @param {string} skuCode - Product SKU code
 * @returns {string} WhatsApp link
 */
export function generateWhatsAppLink(phoneNumber, skuCode) {
  if (!phoneNumber || !skuCode) {
    return '';
  }
  
  // Remove all non-digit characters from phone number
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  
  if (!cleanPhone) {
    return '';
  }
  
  // Create the message text: "skuCode - <your quantity>"
  const messageText = `${skuCode} - <your quantity>`;
  
  // URL encode the message text
  const encodedMessage = encodeURIComponent(messageText);
  
  // Generate the WhatsApp link
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}

/**
 * Validates if a phone number is valid for WhatsApp
 * @param {string} phoneNumber - Phone number to validate
 * @returns {boolean} True if valid
 */
export function isValidPhoneNumber(phoneNumber) {
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return false;
  }
  
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  return cleanPhone.length >= 10 && cleanPhone.length <= 15;
}

/**
 * Formats phone number for display
 * @param {string} phoneNumber - Phone number to format
 * @returns {string} Formatted phone number
 */
export function formatPhoneNumber(phoneNumber) {
  if (!phoneNumber) {
    return '';
  }
  
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  
  if (cleanPhone.length === 10) {
    // Format as: (xxx) xxx-xxxx
    return `(${cleanPhone.slice(0, 3)}) ${cleanPhone.slice(3, 6)}-${cleanPhone.slice(6)}`;
  } else if (cleanPhone.length === 11) {
    // Format as: x (xxx) xxx-xxxx
    return `${cleanPhone[0]} (${cleanPhone.slice(1, 4)}) ${cleanPhone.slice(4, 7)}-${cleanPhone.slice(7)}`;
  } else {
    // For international numbers, just add spaces every 3 digits
    return cleanPhone.replace(/(\d{3})(?=\d)/g, '$1 ');
  }
}