import { test } from "node:test";
import assert from "node:assert/strict";
import { signInErrorMessage } from "../lib/auth-errors.ts";

test("auth failures distinguish credentials, confirmation and configuration", () => {
  assert.match(signInErrorMessage({ code: "invalid_credentials", status: 400 }), /email or password is incorrect/);
  assert.match(signInErrorMessage({ code: "email_not_confirmed", status: 400 }), /hasn’t been confirmed/);
  assert.match(signInErrorMessage({ status: 401 }), /publishable key/);
  assert.match(signInErrorMessage({ code: "email_provider_disabled" }), /Email sign-in is disabled/);
});
test("transient failures guide retries without exposing raw errors", () => {
  assert.match(signInErrorMessage({ status: 429 }), /wait a few minutes/);
  assert.match(signInErrorMessage({ name: "AuthRetryableFetchError", status: 0 }), /couldn’t reach/);
  assert.match(signInErrorMessage({ status: 503 }), /temporarily unavailable/);
  assert.doesNotMatch(signInErrorMessage({ code: "unknown_private_detail" }), /unknown_private_detail/);
});
