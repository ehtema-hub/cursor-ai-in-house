import type { ReactNode } from 'react'
import type { RegistrationFieldErrors } from '@/lib/registrationValidation'

const inputClassName =
  'mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white'

const labelClassName =
  'block text-sm font-medium text-gray-700 dark:text-gray-300'

function FieldError({ field, message }: { field: string; message: string }) {
  const errorId = `register-error-${field}`
  return (
    <p
      id={errorId}
      role="alert"
      aria-live="polite"
      data-testid={errorId}
      className="mt-1 text-sm text-red-600 dark:text-red-400"
    >
      {message}
    </p>
  )
}

function FormField({
  id,
  label,
  required,
  error,
  children,
}: {
  id: string
  label: string
  required?: boolean
  error?: string
  children: ReactNode
}) {
  return (
    <div>
      <label htmlFor={id} className={labelClassName}>
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {children}
      {error && <FieldError field={id.replace('register-', '')} message={error} />}
    </div>
  )
}

interface StepOneProps {
  firstName: string
  lastName: string
  email: string
  phone: string
  fieldErrors: RegistrationFieldErrors
  fieldAria: (
    field: keyof RegistrationFieldErrors,
    testId: string,
  ) => Record<string, string | boolean | undefined>
  onFirstNameChange: (value: string) => void
  onLastNameChange: (value: string) => void
  onEmailChange: (value: string) => void
  onPhoneChange: (value: string) => void
}

export function RegisterStepOne({
  firstName,
  lastName,
  email,
  phone,
  fieldErrors,
  fieldAria,
  onFirstNameChange,
  onLastNameChange,
  onEmailChange,
  onPhoneChange,
}: StepOneProps) {
  return (
    <div data-testid="register-step-panel-1" className="space-y-5">
      <FormField
        id="register-first-name"
        label="First name"
        required
        error={fieldErrors['first-name']}
      >
        <input
          type="text"
          autoComplete="given-name"
          value={firstName}
          onChange={(e) => onFirstNameChange(e.target.value)}
          className={inputClassName}
          {...fieldAria('first-name', 'register-first-name')}
        />
      </FormField>

      <FormField
        id="register-last-name"
        label="Last name"
        required
        error={fieldErrors['last-name']}
      >
        <input
          type="text"
          autoComplete="family-name"
          value={lastName}
          onChange={(e) => onLastNameChange(e.target.value)}
          className={inputClassName}
          {...fieldAria('last-name', 'register-last-name')}
        />
      </FormField>

      <FormField id="register-email" label="Email" required error={fieldErrors.email}>
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          className={inputClassName}
          {...fieldAria('email', 'register-email')}
        />
      </FormField>

      <FormField id="register-phone" label="Phone" required error={fieldErrors.phone}>
        <input
          type="tel"
          autoComplete="tel"
          value={phone}
          onChange={(e) => onPhoneChange(e.target.value)}
          className={inputClassName}
          {...fieldAria('phone', 'register-phone')}
        />
      </FormField>
    </div>
  )
}

interface StepTwoProps {
  password: string
  confirmPassword: string
  fieldErrors: RegistrationFieldErrors
  fieldAria: (
    field: keyof RegistrationFieldErrors,
    testId: string,
  ) => Record<string, string | boolean | undefined>
  onPasswordChange: (value: string) => void
  onConfirmPasswordChange: (value: string) => void
}

export function RegisterStepTwo({
  password,
  confirmPassword,
  fieldErrors,
  fieldAria,
  onPasswordChange,
  onConfirmPasswordChange,
}: StepTwoProps) {
  return (
    <div data-testid="register-step-panel-2" className="space-y-5">
      <FormField
        id="register-password"
        label="Password"
        required
        error={fieldErrors.password}
      >
        <input
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          className={inputClassName}
          {...fieldAria('password', 'register-password')}
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Must be at least 8 characters.
        </p>
      </FormField>

      <FormField
        id="register-confirm-password"
        label="Confirm password"
        required
        error={fieldErrors['confirm-password']}
      >
        <input
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => onConfirmPasswordChange(e.target.value)}
          className={inputClassName}
          {...fieldAria('confirm-password', 'register-confirm-password')}
        />
      </FormField>
    </div>
  )
}

interface StepThreeProps {
  company: string
  acceptTerms: boolean
  fieldErrors: RegistrationFieldErrors
  onCompanyChange: (value: string) => void
  onAcceptTermsChange: (checked: boolean) => void
}

export function RegisterStepThree({
  company,
  acceptTerms,
  fieldErrors,
  onCompanyChange,
  onAcceptTermsChange,
}: StepThreeProps) {
  return (
    <div data-testid="register-step-panel-3" className="space-y-5">
      <div>
        <label htmlFor="register-company" className={labelClassName}>
          Company <span className="text-gray-400">(optional)</span>
        </label>
        <input
          id="register-company"
          data-testid="register-company"
          type="text"
          autoComplete="organization"
          value={company}
          onChange={(e) => onCompanyChange(e.target.value)}
          className={inputClassName}
        />
      </div>

      <div>
        <div className="flex items-start gap-3">
          <input
            id="register-terms"
            data-testid="register-terms"
            type="checkbox"
            checked={acceptTerms}
            onChange={(e) => onAcceptTermsChange(e.target.checked)}
            aria-invalid={fieldErrors.terms ? 'true' : undefined}
            aria-describedby={fieldErrors.terms ? 'register-error-terms' : undefined}
            aria-required="true"
            className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <label htmlFor="register-terms" className="text-sm text-gray-700 dark:text-gray-300">
            I accept the terms and conditions
          </label>
        </div>
        {fieldErrors.terms && <FieldError field="terms" message={fieldErrors.terms} />}
      </div>
    </div>
  )
}
