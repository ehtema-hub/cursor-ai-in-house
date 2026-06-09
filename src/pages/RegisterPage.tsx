import { useState, type ReactNode } from 'react'
import { useAuth } from '@/context/AuthContext'
import {
  validateStep1,
  validateStep2,
  validateStep3,
  type RegistrationFieldErrors,
} from '@/lib/registrationValidation'

const REGISTRATION_SUCCESS_KEY = 'taskflow_registration_success'

interface RegisterPageProps {
  onSwitchToLogin: () => void
}

type Step = 1 | 2 | 3

const inputClassName =
  'mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white'

const labelClassName =
  'block text-sm font-medium text-gray-700 dark:text-gray-300'

function FieldError({
  field,
  message,
}: {
  field: string
  message: string
}) {
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

export function RegisterPage({ onSwitchToLogin }: RegisterPageProps) {
  const { register } = useAuth()
  const [step, setStep] = useState<Step>(1)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [company, setCompany] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<RegistrationFieldErrors>({})
  const [submitError, setSubmitError] = useState('')

  const clearFieldError = (field: keyof RegistrationFieldErrors) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const fieldAria = (field: keyof RegistrationFieldErrors, testId: string) => {
    const error = fieldErrors[field]
    const errorId = `register-error-${field}`
    return {
      'data-testid': testId,
      id: testId,
      'aria-invalid': error ? ('true' as const) : undefined,
      'aria-describedby': error ? errorId : undefined,
      'aria-required': true as const,
      required: true as const,
    }
  }

  const handleNext = () => {
    setSubmitError('')

    if (step === 1) {
      const errors = validateStep1({ firstName, lastName, email, phone })
      setFieldErrors(errors)
      if (Object.keys(errors).length > 0) return
      setStep(2)
      return
    }

    if (step === 2) {
      const errors = validateStep2({ password, confirmPassword })
      setFieldErrors(errors)
      if (Object.keys(errors).length > 0) return
      setStep(3)
    }
  }

  const handlePrevious = () => {
    setFieldErrors({})
    setSubmitError('')
    if (step > 1) setStep((current) => (current - 1) as Step)
  }

  const handleSubmit = () => {
    setSubmitError('')
    const errors = validateStep3({ acceptTerms })
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    const fullName = `${firstName.trim()} ${lastName.trim()}`
    const registerError = register(fullName, email, password)
    if (registerError) {
      setSubmitError(registerError)
      return
    }

    sessionStorage.setItem(REGISTRATION_SUCCESS_KEY, 'true')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
      <div
        className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-900"
        data-testid="multi-step-register"
      >
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Create your account
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Step {step} of 3 — Join TaskFlow and start managing tasks today.
        </p>

        <div className="mt-8 space-y-5">
          {submitError && (
            <p
              role="alert"
              data-testid="register-submit-error"
              className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400"
            >
              {submitError}
            </p>
          )}

          {step === 1 && (
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
                  onChange={(e) => {
                    setFirstName(e.target.value)
                    clearFieldError('first-name')
                  }}
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
                  onChange={(e) => {
                    setLastName(e.target.value)
                    clearFieldError('last-name')
                  }}
                  className={inputClassName}
                  {...fieldAria('last-name', 'register-last-name')}
                />
              </FormField>

              <FormField
                id="register-email"
                label="Email"
                required
                error={fieldErrors.email}
              >
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    clearFieldError('email')
                  }}
                  className={inputClassName}
                  {...fieldAria('email', 'register-email')}
                />
              </FormField>

              <FormField
                id="register-phone"
                label="Phone"
                required
                error={fieldErrors.phone}
              >
                <input
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value)
                    clearFieldError('phone')
                  }}
                  className={inputClassName}
                  {...fieldAria('phone', 'register-phone')}
                />
              </FormField>
            </div>
          )}

          {step === 2 && (
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
                  onChange={(e) => {
                    setPassword(e.target.value)
                    clearFieldError('password')
                  }}
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
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    clearFieldError('confirm-password')
                  }}
                  className={inputClassName}
                  {...fieldAria('confirm-password', 'register-confirm-password')}
                />
              </FormField>
            </div>
          )}

          {step === 3 && (
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
                  onChange={(e) => setCompany(e.target.value)}
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
                    onChange={(e) => {
                      setAcceptTerms(e.target.checked)
                      clearFieldError('terms')
                    }}
                    aria-invalid={fieldErrors.terms ? 'true' : undefined}
                    aria-describedby={
                      fieldErrors.terms ? 'register-error-terms' : undefined
                    }
                    aria-required="true"
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label
                    htmlFor="register-terms"
                    className="text-sm text-gray-700 dark:text-gray-300"
                  >
                    I accept the terms and conditions
                  </label>
                </div>
                {fieldErrors.terms && (
                  <FieldError field="terms" message={fieldErrors.terms} />
                )}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            {step > 1 && (
              <button
                type="button"
                data-testid="register-previous"
                onClick={handlePrevious}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 dark:focus:ring-offset-gray-900"
              >
                Previous
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                data-testid="register-next"
                onClick={handleNext}
                className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                data-testid="register-submit"
                onClick={handleSubmit}
                className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
              >
                Create account
              </button>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
          <button
            type="button"
            data-testid="go-to-login"
            onClick={onSwitchToLogin}
            className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  )
}

export { REGISTRATION_SUCCESS_KEY }
