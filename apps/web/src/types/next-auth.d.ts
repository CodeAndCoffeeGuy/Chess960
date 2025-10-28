import { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  /**
   * Extends the built-in session types to include custom fields
   */
  interface Session {
    user: {
      id: string;
      handle?: string | null;
      ratings?: any[];
    } & DefaultSession["user"];
  }

  /**
   * Extends the built-in user types to include custom fields
   */
  interface User extends DefaultUser {
    id: string;
    handle?: string | null;
    ratings?: any[];
  }
}

declare module "next-auth/jwt" {
  /**
   * Extends the built-in JWT types
   */
  interface JWT extends DefaultJWT {
    id?: string;
    handle?: string | null;
  }
}
