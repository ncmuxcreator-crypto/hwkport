export function compactVerificationErrors(errors = []) {
  return [...new Set((errors || []).filter(Boolean).map(String))];
}
