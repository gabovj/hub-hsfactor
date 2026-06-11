import resend
from app.core.config import settings

resend.api_key = settings.RESEND_API_KEY

FROM_ADDRESS = "HS Factor Hub <no-reply@hsfactor.com>"


def send_reset_password_email(to_email: str, reset_url: str) -> None:
    resend.Emails.send({
        "from": FROM_ADDRESS,
        "to": to_email,
        "subject": "Recupera tu contraseña — HS Factor Hub",
        "html": f"""
        <p>Recibimos una solicitud para restablecer tu contraseña.</p>
        <p><a href="{reset_url}">Haz clic aquí para crear una nueva contraseña</a></p>
        <p>Este enlace expira en 1 hora. Si no solicitaste esto, ignora este correo.</p>
        """,
    })


def send_invite_email(to_email: str, invite_url: str, role: str) -> None:
    resend.Emails.send({
        "from": FROM_ADDRESS,
        "to": to_email,
        "subject": "Invitación al Hub — HS Factor",
        "html": f"""
        <p>Has sido invitado al HS Factor Hub con el rol <strong>{role}</strong>.</p>
        <p><a href="{invite_url}">Haz clic aquí para activar tu cuenta y crear tu contraseña</a></p>
        <p>Este enlace expira en 48 horas.</p>
        """,
    })
