/** Every "try Papyrus" path on the site ends at the Papyrus control plane, where teams sign up and deploy. */
export const PAPYRUS_URL = 'https://papyrus.beaglabs.com'
export const PAPYRUS_SIGNUP_URL = `${PAPYRUS_URL}/signup`

/** The signup page, with the work email already filled in when we have it. */
export const papyrusSignupUrl = (email?: string) =>
  email ? `${PAPYRUS_SIGNUP_URL}?email=${encodeURIComponent(email)}` : PAPYRUS_SIGNUP_URL
