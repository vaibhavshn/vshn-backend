interface ValidationResult {
  valid: boolean;
  error?: Object;
}

/**
  Validates if any specified form field is empty.
*/
const validateFields = (
  data: Record<string, any>,
  fields: string[]
): ValidationResult => {
  const keys = Object.keys(data);

  if (keys.length === 0) return { valid: false, error: { code: 'emptyForm' } };

  // Check for empty or non existant fields
  const emptyFields = [];
  for (const field of fields) {
    if (!(field in data) || data[field].length === 0) emptyFields.push(field);
  }

  if (emptyFields.length === 0) return { valid: true };

  return {
    valid: false,
    error: { code: 'emptyFields', emptyFields },
  };
};

export { validateFields };
export type { ValidationResult };
