export { RedisClient, getRedisClient } from './redis-client';
export { AuthService, getAuthService, type AuthPayload, type MagicLinkPayload } from './auth';
export { EmailService, getEmailService, type MagicLinkEmailData, type VerificationEmailData } from './email';
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