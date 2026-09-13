import { SignUp } from '@clerk/tanstack-react-start'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(auth)/sign-up/$')({
  component: Page,
})

function Page() {
  return (
    <SignUp
      appearance={{
        elements: {
          rootBox: 'w-full',
          card: [
            'w-full max-w-md border border-[var-(--line)] bg-[var-(--surface-strong)]rounded-2xl shadow-xl shadow-[#173a40]/10',
            'backdrop-blur-xl',
          ].join(' '),
          headerTitle:
            'text-2xl font-bold tracking-tight text-[var-(--sea-ink)]',
          headerSubTitle: 'mt-2 text-sm text-[var(--sea-ink-soft)]',
          socialButtons: 'gap-3',
          socialButtonsBlockButton: [
            'h-11 rounded-xl border border-[var-(--line) bg-white/70 text-[var(--sea-ink)]',
            'transition-colors hover:bg-white]',
          ].join(' '),
          socialButtonsBlockButtonText: 'font-semibold text-[var(--sea-ink)]',
          dividerLine: 'bg-[var(--line)]',
          dividerText: 'text-xs font-medium text-[var(--sea-ink-soft)]',
          formFieldLabel: 'mb-2 text-xs font-semibold text-[var(--sea-ink)]',
          formFieldInput: [
            'h-11 rounded-xl border-[var(--line)] bg-white/80 text-[var(--sea-ink)] placeholder:text-[var(--sea-ink-soft)] focus:border-[var(--lagoon)] focus:ring-4 focus:ring-[#4fb8b2]/20',
          ].join(' '),
          formButtonPrimary:
            'h-11 rounded-xl bg-[var(--lagoon-deep)] text-white shadow-md shadow-[#328f97]/20 transition-all hover:bg-[var(--lagoon)] hover:shadow-md',
        },
      }}
    />
  )
}
