import { resend } from '@/lib/resend'

export async function sendMail({
  to,
  subject,
  body,
}: {
  to: string
  subject: string
  body: string
}) {
  const { data, error } = await resend.emails.send({
    from: 'onboarding@resend.dev',
    to,
    subject,
    html: body,
  })

  if (error || !data) {
    throw new Error(
      error instanceof Error ? error?.message : 'Resend returns no mail id',
    )
  }

  return { id: data.id }
}
