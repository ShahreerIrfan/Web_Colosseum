export function validateNewUser(user: {
  name: string;
  email: string;
  password: string;
  role: string;
}): string | null {
  if (user.name.trim() && user.name.trim().length < 2) {
    return 'Name must contain at least 2 characters.';
  }
  // Match the email rule used by the backend's Zod schema.
  if (
    !/^(?:[A-Za-z0-9_'+-]+\.)*[A-Za-z0-9_'+-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9-]*\.)+[A-Za-z]{2,}$/.test(
      user.email
    )
  ) {
    return 'Enter a valid email address.';
  }
  const passwordRules: [boolean, string][] = [
    [user.password.length >= 8, 'Password must contain at least 8 characters.'],
    [user.password.length <= 32, 'Password must contain at most 32 characters.'],
    [/[A-Z]/.test(user.password), 'Password must contain at least one uppercase letter.'],
    [/[a-z]/.test(user.password), 'Password must contain at least one lowercase letter.'],
    [/[0-9]/.test(user.password), 'Password must contain at least one number.'],
    [/[^A-Za-z0-9]/.test(user.password), 'Password must contain at least one special character.'],
  ];
  const errors = passwordRules.filter(([valid]) => !valid).map(([, message]) => message);
  if (errors.length) return errors.join(' ');
  if (
    !['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'USER'].includes(user.role) &&
    !/^CUSTOM_[a-f0-9]{24}$/.test(user.role)
  )
    return 'Select a valid role.';
  return null;
}
