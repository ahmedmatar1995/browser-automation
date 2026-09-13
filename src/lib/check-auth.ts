import { auth } from '@clerk/tanstack-react-start/server'
import { createServerFn } from '@tanstack/react-start'
import { redirect } from '@tanstack/react-router'

export const checkUser = createServerFn().handler(async () => {
  const { userId } = await auth()
  if (!userId) throw redirect({ to: '/sign-in/$' })
  return { userId }
})

export const checkOrg = createServerFn().handler(async () => {
  const { userId, orgId } = await auth()
  if (!userId) throw redirect({ to: '/sign-in/$' })
  if (!orgId) throw redirect({ to: '/org-selection' })
  return { userId, orgId }
})
