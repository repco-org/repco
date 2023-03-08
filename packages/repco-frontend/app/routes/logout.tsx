import { LockOpen2Icon } from '@radix-ui/react-icons'
import type { ActionArgs } from '@remix-run/node'
import { Form } from '@remix-run/react'
import { ButtonWithIcon } from '~/components/primitives/button'
import { authenticator } from '~/services/auth.server'

export async function action({ request }: ActionArgs) {
  await authenticator.logout(request, { redirectTo: '/' })
}

export const LogoutButton = () => (
  <Form action={`/logout`} method="post">
    <ButtonWithIcon icon={<LockOpen2Icon />}>logout</ButtonWithIcon>
  </Form>
)
