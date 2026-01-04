import crypto from 'crypto';
import { eq, and, gt, lt } from 'drizzle-orm';
import { db, sessions, players } from '@/lib/db';

const SESSION_DURATION_DAYS = 7;

export class SessionManager {
  /**
   * Generate a cryptographically secure token
   */
  generateToken(): string {
    return crypto.randomBytes(32).toString('base64url');
  }

  /**
   * Create a new session for a player
   */
  async createSession(playerId: number): Promise<string> {
    const token = this.generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

    await db.insert(sessions).values({
      playerId,
      token,
      expiresAt,
    });

    return token;
  }

  /**
   * Validate a token and return player info if valid
   */
  async validateSession(token: string): Promise<{ playerId: number; playerName: string } | null> {
    const result = await db
      .select({
        playerId: sessions.playerId,
        playerName: players.name,
        expiresAt: sessions.expiresAt,
      })
      .from(sessions)
      .innerJoin(players, eq(sessions.playerId, players.id))
      .where(and(
        eq(sessions.token, token),
        gt(sessions.expiresAt, new Date())
      ))
      .limit(1);

    if (result.length === 0) return null;

    return {
      playerId: result[0].playerId,
      playerName: result[0].playerName,
    };
  }

  /**
   * Delete a session (logout)
   */
  async deleteSession(token: string): Promise<void> {
    await db.delete(sessions).where(eq(sessions.token, token));
  }

  /**
   * Delete all sessions for a player (logout everywhere)
   */
  async deleteAllPlayerSessions(playerId: number): Promise<void> {
    await db.delete(sessions).where(eq(sessions.playerId, playerId));
  }

  /**
   * Clean up expired sessions (should run periodically)
   */
  async cleanupExpiredSessions(): Promise<number> {
    const now = new Date();
    const result = await db.delete(sessions)
      .where(lt(sessions.expiresAt, now))
      .returning({ id: sessions.id });
    return result.length;
  }
}
