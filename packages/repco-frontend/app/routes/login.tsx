import { GitHubLogoIcon } from '@radix-ui/react-icons'
import { LoaderArgs, redirect } from '@remix-run/node'
import { Form } from '@remix-run/react'
import { SocialsProvider } from 'remix-auth-socials'
import { IconButton } from '~/components/ui/primitives/Button'
import { authenticator } from '~/services/auth.server'

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
  const user = await authenticator.isAuthenticated(request)
  if (user) {
    console.log('USER: ')
    return redirect('/')
  }
  console.log('NO USER')
  return {}
}

export default function Login() {
  return (
    <div className="flex h-screen w-full justify-center items-center">
      <GitHubLoginButton />
    </div>
  )
}
