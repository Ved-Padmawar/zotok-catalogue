import React, { useState, useCallback, useRef, useEffect } from "react";
import { Rows, FormField, TextInput, Button } from "@canva/app-ui-kit";
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
    const safeValue = value || '';
    setFormData(prev => ({
      ...prev,
      [field]: safeValue
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
      error = "You missed this one";
    } else if (value.length < VALIDATION.MIN_LENGTH) {
      error = `Invalid ${getFieldLabel(field)}. Please try again.`;
    } else if (value.length > VALIDATION.MAX_LENGTH) {
      error = `Invalid ${getFieldLabel(field)}. Please try again.`;
    } else {
      // Field-specific validation
      switch (field) {
        case 'workspaceId':
          if (!VALIDATION.WORKSPACE_ID.test(value)) {
            error = `Invalid ${getFieldLabel(field)}. Please try again.`;
          }
          break;
        case 'clientId':
          if (!VALIDATION.CLIENT_ID.test(value)) {
            error = `Invalid ${getFieldLabel(field)}. Please try again.`;
          }
          break;
        case 'clientSecret':
          if (value.length < 8) {
            error = `Invalid ${getFieldLabel(field)}. Please try again.`;
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
      workspaceId: 'Workspace id',
      clientId: 'Client id',
      clientSecret: 'Client secret'
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
      // Authentication error is handled by parent component
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
      <Rows spacing="2u">
        {/* Workspace ID Field */}
        <FormField
          label="Workspace id *"
          control={(props) => (
            <TextInput
              {...props}
              ref={workspaceIdRef}
              placeholder="e.g., my-company-workspace"
              value={formData.workspaceId || ''}
              onChange={(value) => handleInputChange('workspaceId', value)}
              onBlur={() => handleFieldBlur('workspaceId')}
              onKeyDown={(e) => handleKeyPress(e, 'workspaceId')}
              disabled={isLoading}
              autoComplete="organization"
            />
          )}
          error={touched.workspaceId && fieldErrors.workspaceId ? fieldErrors.workspaceId : undefined}
        />

        {/* Client ID Field */}
        <FormField
          label="Client id *"
          control={(props) => (
            <TextInput
              {...props}
              ref={clientIdRef}
              placeholder="Enter your client ID"
              value={formData.clientId || ''}
              onChange={(value) => handleInputChange('clientId', value)}
              onBlur={() => handleFieldBlur('clientId')}
              onKeyDown={(e) => handleKeyPress(e, 'clientId')}
              disabled={isLoading}
              autoComplete="username"
            />
          )}
          error={touched.clientId && fieldErrors.clientId ? fieldErrors.clientId : undefined}
        />

        {/* Client Secret Field */}
        <FormField
          label="Client secret *"
          control={(props) => (
            <TextInput
              {...props}
              ref={clientSecretRef}
              type={showPassword ? "text" : "password"}
              placeholder="Enter your client secret"
              value={formData.clientSecret || ''}
              onChange={(value) => handleInputChange('clientSecret', value)}
              onBlur={() => handleFieldBlur('clientSecret')}
              onKeyDown={(e) => handleKeyPress(e, 'clientSecret')}
              disabled={isLoading}
              autoComplete="new-password"
            />
          )}
          error={touched.clientSecret && fieldErrors.clientSecret ? fieldErrors.clientSecret : undefined}
        />

        {/* General Error Message */}
        {error && (
          <div className="auth-error" role="alert">
            {error}
          </div>
        )}

        {/* Form Actions */}
        <Button
          variant="primary"
          stretch
          onClick={handleSubmit}
          disabled={!isFormValid || isLoading}
        >
          {isLoading ? 'Connecting...' : 'Connect to zotok'}
        </Button>
      </Rows>

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
