import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import {
  validateStep1,
  validateStep2,
  validateStep3,
  type RegistrationFieldErrors,
} from '@/lib/registrationValidation'
import {
  RegisterStepOne,
  RegisterStepThree,
  RegisterStepTwo,
} from '@/pages/RegisterStepPanels'

const REGISTRATION_SUCCESS_KEY = 'taskflow_registration_success'

interface RegisterPageProps {
  onSwitchToLogin: () => void
}

type Step = 1 | 2 | 3

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
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  const handleSubmit = async () => {
    setSubmitError('')
    const errors = validateStep3({ acceptTerms })
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    const fullName = `${firstName.trim()} ${lastName.trim()}`
    setIsSubmitting(true)
    const registerError = await register(fullName, email, password)
    setIsSubmitting(false)
    if (registerError) {
      setSubmitError(registerError)
    }
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
            <RegisterStepOne
              firstName={firstName}
              lastName={lastName}
              email={email}
              phone={phone}
              fieldErrors={fieldErrors}
              fieldAria={fieldAria}
              onFirstNameChange={(value) => {
                setFirstName(value)
                clearFieldError('first-name')
              }}
              onLastNameChange={(value) => {
                setLastName(value)
                clearFieldError('last-name')
              }}
              onEmailChange={(value) => {
                setEmail(value)
                clearFieldError('email')
              }}
              onPhoneChange={(value) => {
                setPhone(value)
                clearFieldError('phone')
              }}
            />
          )}

          {step === 2 && (
            <RegisterStepTwo
              password={password}
              confirmPassword={confirmPassword}
              fieldErrors={fieldErrors}
              fieldAria={fieldAria}
              onPasswordChange={(value) => {
                setPassword(value)
                clearFieldError('password')
              }}
              onConfirmPasswordChange={(value) => {
                setConfirmPassword(value)
                clearFieldError('confirm-password')
              }}
            />
          )}

          {step === 3 && (
            <RegisterStepThree
              company={company}
              acceptTerms={acceptTerms}
              fieldErrors={fieldErrors}
              onCompanyChange={setCompany}
              onAcceptTermsChange={(checked) => {
                setAcceptTerms(checked)
                clearFieldError('terms')
              }}
            />
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
                disabled={isSubmitting}
                className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60 dark:focus:ring-offset-gray-900"
              >
                {isSubmitting ? 'Creating account…' : 'Create account'}
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
