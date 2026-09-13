import { checkUser } from '@/lib/check-auth'
import { OrganizationList } from '@clerk/react'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(auth)/org-selection')({
  component: RouteComponent,
  beforeLoad: async () => await checkUser(),
})

function RouteComponent() {
  return (
    <OrganizationList
      afterCreateOrganizationUrl="/"
      afterSelectOrganizationUrl="/"
      hidePersonal
      appearance={{
        elements: {
          rootBox: 'w-full max-w-md',
          card: 'w-full border border-[var(--line)] rounded-2xl bg-[var((--surface-strong))] shadow-xl shadow-[#173a40]/10 backdrop-blue-xl',
          header: 'mb-6',
          headerTitle:
            'text-2xl font-bold tracking-tight text-[var(--sea-ink)]',
          headerSubTitle: 'mt-2 text-sm text-[var(--sea-ink-soft)]',
          main: 'space-y-3',
          organizationList: 'space-y-3',
        },
      }}
    />
  )
}
