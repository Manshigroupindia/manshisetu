// Firestore Data Sanitization & Utility Functions for Manshi Group Setu

/**
 * Deeply sanitizes an object payload destined for Firestore operations.
 * Omit properties with `undefined` values to prevent:
 * "FirebaseError: Function setDoc() called with invalid data. Unsupported field value: undefined"
 *
 * CRITICAL REQUIREMENTS:
 * 1. Omit all `undefined` values (at any depth in objects).
 * 2. Preserve valid falsey values:
 *    - 0 (number)
 *    - false (boolean)
 *    - "" (empty string)
 * 3. Preserve empty and non-empty arrays `[]`.
 * 4. Preserve intentional `null` values.
 * 5. Preserve Firestore FieldValues (such as serverTimestamp(), deleteField(), etc.).
 * 6. Preserve Date objects and Firestore Timestamps.
 */
export function sanitizeFirestorePayload<T>(input: T): T {
  if (input === null || input === undefined) {
    return input;
  }

  // Preserve primitive types (numbers, booleans, strings)
  if (typeof input !== 'object') {
    return input;
  }

  // Preserve Dates
  if (input instanceof Date) {
    return input;
  }

  // Preserve Firestore FieldValues (serverTimestamp, deleteField, etc.) and Timestamps
  const maybeFieldValue = input as any;
  if (
    maybeFieldValue._methodName ||
    maybeFieldValue.constructor?.name === 'FieldValue' ||
    maybeFieldValue.constructor?.name === 'Timestamp' ||
    typeof maybeFieldValue.toMillis === 'function'
  ) {
    return input;
  }

  // Recursively sanitize arrays while preserving empty arrays
  if (Array.isArray(input)) {
    return input.map((item) => sanitizeFirestorePayload(item)) as unknown as T;
  }

  // Process plain objects: copy properties omitting any with value === undefined
  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(input as Record<string, any>)) {
    if (value === undefined) {
      // OMIT completely
      continue;
    }
    sanitized[key] = sanitizeFirestorePayload(value);
  }

  return sanitized as T;
}
