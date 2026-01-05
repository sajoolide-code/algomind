export function createUxError({ code, title, detail, fix, raw } = {}) {
  return {
    code: code || 'unknown_error',
    title: title || 'Unexpected error',
    detail: detail || 'An unexpected error occurred.',
    fix: fix || 'Please retry or contact support.',
    raw: raw || null
  };
}
