export function validateRegisterInput(
  name: string,
  email: string,
  password: string,
): string | null {
  const trimmedEmail = email.trim().toLowerCase()

  if (!name.trim()) return 'Full name is required.'
  if (!trimmedEmail) return 'Email is required.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    return 'Please enter a valid email address.'
  }
  if (password.length < 8) {
    return 'Password must be at least 8 characters.'
  }
  return null
}

export function validateLoginInput(email: string, password: string): string | null {
  if (!email.trim() || !password) {
    return 'Email and password are required.'
  }
  return null
}
