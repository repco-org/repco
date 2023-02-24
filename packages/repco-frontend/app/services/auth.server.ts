import { Authenticator } from 'remix-auth'
import { GitHubStrategy, SocialsProvider } from 'remix-auth-socials'
import { sessionStorage } from './session.server'

function callbackURL() {
  let base = process.env.BASE_URL
  if (!base && typeof window !== 'undefined') base = window.location.origin
  if (!base) base = 'http://localhost:8765'
  if (!base.endsWith('/')) base += '/'
  return base + SocialsProvider.GITHUB + '/callback'
}

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
      callbackURL: callbackURL(),
    },
    handleSocialAuthCallback,
  ),
)
