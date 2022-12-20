import { Form } from '@remix-run/react'
import { SocialsProvider } from 'remix-auth-socials'

interface SocialButtonProps {
  provider: SocialsProvider
  label: string
}

const SocialButton: React.FC<SocialButtonProps> = ({ provider, label }) => (
  <Form action={`/auth/${provider}`} method="post">
    <button>{label}</button>
  </Form>
)

export default function Login() {
  return (
    <>
      <SocialButton
        provider={SocialsProvider.GITHUB}
        label="Login with Github"
      />
    </>
  )
}
