import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


def send_invite_email(
    to_email: str,
    tenant_name: str,
    inviter_name: str,
    invite_link: str,
) -> bool:
    smtp_host = os.getenv("SMTP_HOST", "smtp.zoho.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER", "")
    smtp_password = os.getenv("SMTP_PASSWORD", "")
    smtp_from = os.getenv("SMTP_FROM", smtp_user)

    if not smtp_user or not smtp_password:
        # SMTP not configured — skip sending
        return False

    msg = MIMEMultipart("alternative")
    msg["From"] = f"StockSeer <{smtp_from}>"
    msg["To"] = to_email
    msg["Subject"] = f"You've been invited to {tenant_name} on StockSeer"

    text = f"""Hi,

{inviter_name} has invited you to join "{tenant_name}" on StockSeer.

Click the link below to accept the invitation:
{invite_link}

If you don't have an account yet, you'll be able to create one when you click the link.

— The StockSeer Team
"""

    html = f"""<html>
<body style="font-family: Inter, sans-serif; color: #1a1a2e; max-width: 560px; margin: 0 auto; padding: 24px;">
  <h2 style="color: #2563eb;">You've been invited to StockSeer</h2>
  <p><strong>{inviter_name}</strong> has invited you to join <strong>{tenant_name}</strong> on StockSeer.</p>
  <p style="margin: 24px 0;">
    <a href="{invite_link}" style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
      Accept Invitation
    </a>
  </p>
  <p style="color: #666; font-size: 13px;">If you don't have an account yet, you'll be able to create one when you click the link.</p>
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
  <p style="color: #999; font-size: 12px;">StockSeer — Demand Intelligence</p>
</body>
</html>"""

    msg.attach(MIMEText(text, "plain"))
    msg.attach(MIMEText(html, "html"))

    try:
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.sendmail(smtp_from, to_email, msg.as_string())
        return True
    except Exception as e:
        print(f"Failed to send invite email to {to_email}: {e}")
        return False
