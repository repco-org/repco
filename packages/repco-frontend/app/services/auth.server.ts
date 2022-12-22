import { Authenticator } from 'remix-auth'
import { GitHubStrategy, SocialsProvider } from 'remix-auth-socials'
import { sessionStorage } from './session.server'

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
      callbackURL:
        'http://localhost:3000/auth/' + SocialsProvider.GITHUB + '/callback',
    },
    handleSocialAuthCallback,
  ),
)
