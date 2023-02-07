import { Authenticator } from 'remix-auth'
import { GitHubStrategy, SocialsProvider } from 'remix-auth-socials'
import { sessionStorage } from './session.server'

const BASE_URL = process.env.BASE_URL || window.location.origin
const CALLBACK_URL =
  BASE_URL + BASE_URL.endsWith('/')
    ? ''
    : '/' + SocialsProvider.GITHUB + '/callback'

export const authenticator = new Authenticator(sessionStorage, {
  sessionKey: '_session',
})

interface GitHubProfileProps {
  profile: GitHubProfile
}
interface GitHubProfile {
  provider: string
  id: string
  displayName: string
  photos: Record<string, string>[]
}

async function handleSocialAuthCallback({ profile }: GitHubProfileProps) {
  return profile
}

authenticator.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
      callbackURL: CALLBACK_URL
    },
    handleSocialAuthCallback,
  ),
)
