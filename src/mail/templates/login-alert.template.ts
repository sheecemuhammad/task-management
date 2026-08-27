export function loginAlertTemplate(
  name: string,
): string {
  return `
    <!DOCTYPE html>
    <html>
      <body>
        <h2>New Login Detected</h2>

        <p>Hello ${name},</p>

        <p>
          A successful login to your Task Management
          account was detected.
        </p>

        <p>
          If this was not you, please secure your
          account immediately.
        </p>

        <p>
          Thanks,<br />
          Task Management Team
        </p>
      </body>
    </html>
  `;
}