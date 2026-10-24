type AuthFailure = { code?: string; name?: string; status?: number };

export function signInErrorMessage(error: AuthFailure) {
  if (error.code === "invalid_credentials") return "The email or password is incorrect. Please try again.";
  if (error.code === "email_not_confirmed") return "Your email hasn’t been confirmed yet. Confirm it before signing in.";
  if (error.code === "email_provider_disabled") return "Email sign-in is disabled for this space. Please ask the person who set it up to enable it.";
  if (error.status === 429 || error.code === "over_request_rate_limit") return "Too many sign-in attempts. Please wait a few minutes and try again.";
  if (error.status && error.status >= 500) return "The sign-in service is temporarily unavailable. Please try again shortly.";
  if (error.name === "AuthRetryableFetchError" || error.name === "TypeError" || error.status === 0) return "We couldn’t reach the sign-in service. Please check your connection and try again.";
  if (error.status === 401) return "The sign-in connection is not configured correctly. Check the project URL and publishable key.";
  return "We couldn’t complete sign-in. Please try again or check the account’s sign-in settings.";
}
