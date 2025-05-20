import { TOKEN_TYPE } from '@/constants'

export const linkHome = () => {
  return '/'
}
export const linkVote = () => {
  return '/vote'
}
export const linkLaunch = () => {
  return '/launch'
}
export const linkUser = () => {
  return '/user'
}
export const linkDetail = (token: string, type: TOKEN_TYPE) => {
  return `/${type}/${token}`
}
export const linkSwap = (token?: string) => {
  return `/swap${token ? `?token=${token}` : ''}`
}
export const linkExplore = () => {
  return '/explore'
}
