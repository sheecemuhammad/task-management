export function teamInvitationTemplate(
  teamName: string,
  invitationUrl: string,
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>Team Invitation</title>
      </head>

      <body>
        <h2>You've been invited to join ${teamName}</h2>

        <p>
          You have been invited to join the
          <strong>${teamName}</strong> team on Task Management.
        </p>

        <p>
          Click the button below to accept your invitation:
        </p>

        <p>
          <a
            href="${invitationUrl}"
            style="
              display: inline-block;
              padding: 10px 20px;
              background-color: #1c5632;
              color: white;
              text-decoration: none;
              border-radius: 5px;
            "
          >
            Accept Invitation
          </a>
        </p>

        <p>
          This invitation will expire in 7 days.
        </p>

        <p>
          If you did not expect this invitation,
          you can safely ignore this email.
        </p>
      </body>
    </html>
  `;
}