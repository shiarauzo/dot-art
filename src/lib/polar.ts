const PRODUCT_ID = import.meta.env.VITE_POLAR_PRODUCT_ID || ''

export function getCheckoutUrl(email: string): string {
  const params = new URLSearchParams({
    email,
    metadata: JSON.stringify({ user_email: email }),
  })

  return `https://polar.sh/checkout/${PRODUCT_ID}?${params.toString()}`
}
