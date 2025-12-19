// Using Redis for sessions with 100k daily users = wasted memory
// JWT is stateless and persists in cookies (7-30 days)

export const checkSession = async (sessionId) => {
  // No-op: JWT tokens are handled by cookies and auth middleware
  return null;
};

export const createSession = async (userId, userData) => {
  // No-op: JWT creation is handled in authController
  return null;
};

export const deleteSession = async (sessionId) => {
  // No-op: JWT invalidation is handled server-side via refresh token
  return true;
};
