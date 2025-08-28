import React, { useState, useCallback, useRef, useEffect } from "react";
import { validateCredentials } from "../types/index.jsx";
import { VALIDATION, ERROR_MESSAGES } from "../utils/constants.jsx";

/**
 * Enhanced Authentication Form Component with new design
 * @param {Object} props - Component props
 * @param {Function} props.onAuthSuccess - Success callback
 * @param {string} props.error - Error message
 */
export default function AuthForm({ onAuthSuccess, error }) {
  const [formData, setFormData] = useState({
    workspaceId: "",
    clientId: "",
    clientSecret: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  // Refs for focus management
  const workspaceIdRef = useRef(null);
  const clientIdRef = useRef(null);
  const clientSecretRef = useRef(null);

  // Auto-focus first field on mount
  useEffect(() => {
    if (workspaceIdRef.current) {
      workspaceIdRef.current.focus();
    }
  }, []);

  /**
   * Handles input field changes with real-time validation
   * @param {string} field - Field name
   * @param {string} value - Field value
   */
  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  }, [fieldErrors]);

  /**
   * Handles field blur events with validation
   * @param {string} field - Field name
   */
  const handleFieldBlur = useCallback((field) => {
    setTouched(prev => ({
      ...prev,
      [field]: true
    }));

    // Validate field on blur
    validateField(field, formData[field]);
  }, [formData]);

  /**
   * Validates individual field with enhanced rules
   * @param {string} field - Field name
   * @param {string} value - Field value
   */
  const validateField = useCallback((field, value) => {
    let error = '';

    if (!value?.trim()) {
      error = `${getFieldLabel(field)} is required`;
    } else if (value.length < VALIDATION.MIN_LENGTH) {
      error = `${getFieldLabel(field)} must be at least ${VALIDATION.MIN_LENGTH} characters`;
    } else if (value.length > VALIDATION.MAX_LENGTH) {
      error = `${getFieldLabel(field)} must be less than ${VALIDATION.MAX_LENGTH} characters`;
    } else {
      // Field-specific validation
      switch (field) {
        case 'workspaceId':
          if (!VALIDATION.WORKSPACE_ID.test(value)) {
            error = 'Workspace ID can only contain letters, numbers, and hyphens';
          }
          break;
        case 'clientId':
          if (!VALIDATION.CLIENT_ID.test(value)) {
            error = 'Client ID can only contain letters and numbers';
          }
          break;
        case 'clientSecret':
          if (value.length < 8) {
            error = 'Client Secret must be at least 8 characters';
          }
          break;
      }
    }

    setFieldErrors(prev => ({
      ...prev,
      [field]: error
    }));

    return !error;
  }, []);

  /**
   * Gets field label for display
   * @param {string} field - Field name
   * @returns {string} Field label
   */
  const getFieldLabel = useCallback((field) => {
    const labels = {
      workspaceId: 'Workspace ID',
      clientId: 'Client ID',
      clientSecret: 'Client Secret'
    };
    return labels[field] || field;
  }, []);

  /**
   * Validates entire form
   * @returns {boolean} Whether form is valid
   */
  const validateForm = useCallback(() => {
    const { isValid, errors } = validateCredentials(formData);
    
    // Also run field-level validation
    const fieldValidation = Object.keys(formData).every(field => 
      validateField(field, formData[field])
    );

    if (!isValid) {
      setFieldErrors(errors);
    }

    return isValid && fieldValidation;
  }, [formData, validateField]);

  /**
   * Handles form submission with loading state
   */
  const handleSubmit = useCallback(async (event) => {
    event?.preventDefault();

    if (!validateForm()) {
      // Mark all fields as touched to show errors
      setTouched({
        workspaceId: true,
        clientId: true,
        clientSecret: true
      });
      return;
    }

    setIsLoading(true);
    
    try {
      await onAuthSuccess(formData);
    } catch (err) {
      console.error('Authentication failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [formData, validateForm, onAuthSuccess]);

  /**
   * Handles Enter key press for form navigation
   * @param {React.KeyboardEvent} event - Keyboard event
   * @param {string} currentField - Current field name
   */
  const handleKeyPress = useCallback((event, currentField) => {
    if (event.key === 'Enter' && !isLoading) {
      event.preventDefault();
      
      // Navigate to next field or submit
      switch (currentField) {
        case 'workspaceId':
          if (clientIdRef.current) clientIdRef.current.focus();
          break;
        case 'clientId':
          if (clientSecretRef.current) clientSecretRef.current.focus();
          break;
        case 'clientSecret':
          handleSubmit();
          break;
      }
    }
  }, [handleSubmit, isLoading]);

  /**
   * Toggles password visibility for client secret
   */
  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  const hasErrors = Object.values(fieldErrors).some(error => error);
  const isFormValid = Object.values(formData).every(value => value?.trim()) && !hasErrors;

  return (
    <form onSubmit={handleSubmit} className="compact-form" noValidate>
      {/* Workspace ID Field */}
      <div className="form-field">
        <label htmlFor="workspaceId">
          Workspace ID <span style={{ color: 'var(--error-color)' }}>*</span>
        </label>
        <input
          ref={workspaceIdRef}
          id="workspaceId"
          type="text"
          className="form-input"
          placeholder="e.g., my-company-workspace"
          value={formData.workspaceId}
          onChange={(e) => handleInputChange('workspaceId', e.target.value)}
          onBlur={() => handleFieldBlur('workspaceId')}
          onKeyDown={(e) => handleKeyPress(e, 'workspaceId')}
          disabled={isLoading}
          autoComplete="organization"
          autoCapitalize="none"
          spellCheck="false"
          aria-invalid={touched.workspaceId && fieldErrors.workspaceId ? 'true' : 'false'}
          aria-describedby={fieldErrors.workspaceId ? 'workspaceId-error' : undefined}
        />
        {touched.workspaceId && fieldErrors.workspaceId && (
          <div 
            id="workspaceId-error"
            className="field-error"
            role="alert"
          >
            {fieldErrors.workspaceId}
          </div>
        )}
      </div>

      {/* Client ID Field */}
      <div className="form-field">
        <label htmlFor="clientId">
          Client ID <span style={{ color: 'var(--error-color)' }}>*</span>
        </label>
        <input
          ref={clientIdRef}
          id="clientId"
          type="text"
          className="form-input"
          placeholder="Enter your client ID"
          value={formData.clientId}
          onChange={(e) => handleInputChange('clientId', e.target.value)}
          onBlur={() => handleFieldBlur('clientId')}
          onKeyDown={(e) => handleKeyPress(e, 'clientId')}
          disabled={isLoading}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck="false"
          aria-invalid={touched.clientId && fieldErrors.clientId ? 'true' : 'false'}
          aria-describedby={fieldErrors.clientId ? 'clientId-error' : undefined}
        />
        {touched.clientId && fieldErrors.clientId && (
          <div 
            id="clientId-error"
            className="field-error"
            role="alert"
          >
            {fieldErrors.clientId}
          </div>
        )}
      </div>

      {/* Client Secret Field */}
      <div className="form-field">
        <label htmlFor="clientSecret">
          Client Secret <span style={{ color: 'var(--error-color)' }}>*</span>
        </label>
        <div style={{ position: 'relative' }}>
          <input
            ref={clientSecretRef}
            id="clientSecret"
            type={showPassword ? "text" : "password"}
            className="form-input"
            placeholder="Enter your client secret"
            value={formData.clientSecret}
            onChange={(e) => handleInputChange('clientSecret', e.target.value)}
            onBlur={() => handleFieldBlur('clientSecret')}
            onKeyDown={(e) => handleKeyPress(e, 'clientSecret')}
            disabled={isLoading}
            autoComplete="new-password"
            style={{ paddingRight: '40px' }}
            aria-invalid={touched.clientSecret && fieldErrors.clientSecret ? 'true' : 'false'}
            aria-describedby={fieldErrors.clientSecret ? 'clientSecret-error' : undefined}
          />
          <button
            type="button"
            onClick={togglePasswordVisibility}
            disabled={isLoading}
            className="password-toggle-btn"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            title={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? 
              <svg className="icon" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> : 
              <svg className="icon" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07l-5.27-5.27"/></svg>
            }
          </button>
        </div>
        {touched.clientSecret && fieldErrors.clientSecret && (
          <div 
            id="clientSecret-error"
            className="field-error"
            role="alert"
          >
            {fieldErrors.clientSecret}
          </div>
        )}
      </div>

      {/* General Error Message */}
      {error && (
        <div className="auth-error" role="alert">
          {error}
        </div>
      )}

      {/* Form Actions */}
      <div className="form-actions">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={!isFormValid || isLoading}
        >
          {isLoading ? 'Connecting...' : 'Connect to Zotok'}
        </button>
      </div>

      <style jsx>{`
        .password-toggle-btn {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: transparent;
          border: none;
          cursor: pointer;
          color: var(--text-secondary);
          padding: 4px;
          border-radius: var(--radius-sm);
          transition: all var(--transition-fast);
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .password-toggle-btn:hover {
          color: var(--text-primary);
          background: var(--bg-hover);
          transform: translateY(-50%);
        }

        .password-toggle-btn:focus {
          outline: none;
          color: var(--text-primary);
        }

        .field-error {
          font-size: var(--text-xs);
          color: var(--error-color);
          margin-top: var(--space-xs);
        }

        .auth-error {
          background: var(--error-light);
          border: 1px solid var(--error-color);
          border-radius: var(--radius-md);
          padding: var(--space-sm) var(--space-md);
          font-size: var(--text-sm);
          color: var(--error-color);
          text-align: center;
        }

        .form-actions {
          margin-top: var(--space-md);
        }
        
        .btn-primary {
            width: 100%;
        }

        .form-input:focus {
          border-color: var(--border-focus) !important;
          box-shadow: none !important;
          outline: none !important;
        }


      `}</style>
    </form>
  );
}
