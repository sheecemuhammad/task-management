export default () => ({
  app: {
    port: parseInt(process.env.PORT ?? '3000', 10),
    environment: process.env.NODE_ENV ?? 'development',

    frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  },
});
