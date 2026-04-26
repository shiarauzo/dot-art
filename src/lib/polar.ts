const CHECKOUT_LINK = import.meta.env.VITE_POLAR_CHECKOUT_LINK || ''

export function getCheckoutUrl(email: string): string {
  const params = new URLSearchParams({
    email,
    metadata: JSON.stringify({ user_email: email }),
  })

  return `https://buy.polar.sh/${CHECKOUT_LINK}?${params.toString()}`
}
