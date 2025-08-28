import React, { useState, useCallback } from 'react';
import { generateWhatsAppLink, isValidPhoneNumber } from '../utils/whatsappUtils';

/**
 * WhatsApp Link component with copy functionality - integrated into detail field styling
 * @param {Object} props - Component props
 * @param {string} props.phoneNumber - User's phone number
 * @param {string} props.skuCode - Product SKU code
 */
export default function WhatsAppLink({ phoneNumber, skuCode }) {
  const [isCopied, setIsCopied] = useState(false);

  const whatsappLink = generateWhatsAppLink(phoneNumber, skuCode);
  const isValidLink = whatsappLink && isValidPhoneNumber(phoneNumber) && skuCode;

  const handleCopy = useCallback(async () => {
    if (!isValidLink) return;

    try {
      await navigator.clipboard.writeText(whatsappLink);
      setIsCopied(true);
      
      // Reset button state after 2 seconds
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy WhatsApp link:', error);
      // Fallback for browsers that don't support clipboard API
      try {
        const textArea = document.createElement('textarea');
        textArea.value = whatsappLink;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        setIsCopied(true);
        setTimeout(() => {
          setIsCopied(false);
        }, 2000);
      } catch (fallbackError) {
        console.error('Fallback copy failed:', fallbackError);
      }
    }
  }, [whatsappLink, isValidLink]);

  // Don't render if no valid link can be generated
  if (!isValidLink) {
    return null;
  }

  return (
    <>
      <div className="detail-field-label">
        WhatsApp Link
      </div>
      <div className="detail-field-value whatsapp-link-container">
        <input
          type="text"
          className="whatsapp-link-input"
          value={whatsappLink}
          readOnly
          aria-label="WhatsApp link for this product"
          title={`WhatsApp link: ${whatsappLink}`}
        />
        <button
          className={`whatsapp-copy-btn ${isCopied ? 'copied' : ''}`}
          onClick={handleCopy}
          disabled={isCopied}
          aria-label={isCopied ? 'Link copied' : 'Copy WhatsApp link'}
          title={isCopied ? 'Copied!' : 'Copy link'}
        >
          {isCopied ? (
            <svg className="copy-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20,6 9,17 4,12"></polyline>
            </svg>
          ) : (
            <svg className="copy-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5,15 L5,5 a2,2 0 0,1 2,-2 L15,3"></path>
            </svg>
          )}
        </button>
      </div>
    </>
  );
}