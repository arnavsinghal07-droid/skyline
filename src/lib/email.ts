import { Resend } from 'resend'

export async function sendWelcomeEmail(to: string, plan: string) {
  if (!to || !process.env.RESEND_API_KEY) return

  const resend = new Resend(process.env.RESEND_API_KEY)

  const planLabel = plan === 'starter' ? 'Starter' : 'Pro'
  const limit = plan === 'starter' ? '10' : 'unlimited'
  const appUrl = process.env.NEXT_PUBLIC_URL ?? 'https://app.sightline.dev'

  try {
    await resend.emails.send({
      from: 'Sightline <onboarding@resend.dev>',
      to,
      subject: `Welcome to Sightline ${planLabel}`,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #111;">Welcome to Sightline ${planLabel}!</h2>
          <p style="color: #444; line-height: 1.6;">
            You now have access to <strong>${limit} briefs per month</strong>.
          </p>
          <p style="color: #444; line-height: 1.6;">
            Head to your <a href="${appUrl}/briefs" style="color: #2563eb;">Briefs</a> page to get started.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="color: #999; font-size: 12px;">
            Stripe will send a separate payment receipt to this email address.
          </p>
        </div>
      `,
    })
  } catch (err) {
    // Log but do not throw — email failure should not block subscription activation
    console.error('[Sightline] Failed to send welcome email:', err)
  }
}
