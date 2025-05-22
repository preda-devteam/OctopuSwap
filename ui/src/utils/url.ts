export const linkHome = () => {
  return '/'
}

export const linkSwap = (token?: string) => {
  return `/swap${token ? `?token=${token}` : ''}`
}
