import { GitHubLogoIcon } from '@radix-ui/react-icons'
import type { LoaderArgs } from '@remix-run/node'
import { json } from '@remix-run/node'
import { Form, useLoaderData } from '@remix-run/react'
import { SocialsProvider } from 'remix-auth-socials'
import { IconButton } from '~/components/ui/primitives/Button'
import { authenticator } from '~/services/auth.server'
import { getSession } from '~/services/session.server'

interface SocialButtonProps {
  provider: SocialsProvider
  label: string
  icon: JSX.Element
}

const SocialButton: React.FC<SocialButtonProps> = ({
  provider,
  label,
  icon,
}) => (
  <Form action={`/auth/${provider}`} method="post">
    <IconButton icon={icon}>{label}</IconButton>
  </Form>
)

export const GitHubLoginButton = () => (
  <SocialButton
    provider={SocialsProvider.GITHUB}
    label="Login with Github"
    icon={<GitHubLogoIcon />}
  />
)

export async function loader({ request }: LoaderArgs) {
  await authenticator.isAuthenticated(request, {
    successRedirect: '/playlists',
  })
  const session = await getSession(request.headers.get('cookie'))
  const error = session.get(authenticator.sessionErrorKey)
  console.log('NO USER: ', error)
  return json({ error })
}

export default function Login() {
  const { error } = useLoaderData()
  return (
    <div
      className="flex p-4
     w-full justify-center items-center"
    >
      {error && <div>{error}</div>}
      <GitHubLoginButton />
    </div>
  )
}
