export { RedisClient, getRedisClient } from './redis-client';
export { 
  AuthService, 
  getAuthService, 
  verifyGuestTokenClientSide, 
  verifyTokenClientSide, 
  getUserContextFromCookies,
  clearAuthToken,
  GHOST_USER_ID,
  GHOST_USERNAME,
  type AuthPayload, 
  type MagicLinkPayload,
  type UserContext
} from './auth';
// Email service is not exported by default to avoid bundling resend dependency
// export { EmailService, getEmailService, type MagicLinkEmailData, type VerificationEmailData } from './email';
export {
  generateRandomPosition,
  positionToBackRank,
  backRankToFEN,
  getChess960Position,
  getRandomChess960Position,
  getStandardPosition,
  isValidChess960Position,
  getCastlingRookFiles,
  type Chess960Position,
} from './chess960';