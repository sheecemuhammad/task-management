export default () => ({
  auth: {
    jwtSecret: process.env.JWT_SECRET,

    accessTokenExpiresIn:
      process.env.JWT_ACCESS_TOKEN_EXPIRES_IN ?? '15m',

    refreshTokenExpiresIn:
      process.env.JWT_REFRESH_TOKEN_EXPIRES_IN ?? '7d',

    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackUrl:
        process.env.GOOGLE_CALLBACK_URL ??
        'http://localhost:3000/auth/google/callback',
    },

    github: {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackUrl:
        process.env.GITHUB_CALLBACK_URL ??
        'http://localhost:3000/auth/github/callback',
    },
  },
});