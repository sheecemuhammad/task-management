export function welcomeTemplate(
  name: string,
): string {
  return `
    <!DOCTYPE html>
    <html>
      <body>
        <h2>Welcome, ${name}!</h2>

        <p>
          Your Task Management account has been
          successfully created.
        </p>

        <p>
          You can now log in and start managing
          your tasks and projects.
        </p>

        <p>
          Thanks,<br />
          Task Management Team
        </p>
      </body>
    </html>
  `;
}