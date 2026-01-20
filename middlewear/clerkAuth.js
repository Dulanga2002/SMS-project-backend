const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');

const clerkAuth = ClerkExpressRequireAuth({
  secretKey: process.env.CLERK_SECRET_KEY,
  onError: (error) => {
    console.error('Clerk Auth Error:', error);
  }
});

module.exports = clerkAuth;