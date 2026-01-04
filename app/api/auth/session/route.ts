import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SessionManager } from '@/server/SessionManager';
import { PlayerManager } from '@/server/PlayerManager';

const sessionManager = new SessionManager();
const playerManager = new PlayerManager();

const COOKIE_NAME = 'fishing_session';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days in seconds

/**
 * GET: Validate session and return player info + token
 * Used on page load to check if user has valid session
 * Returns token so client can use it for WebSocket SESSION_RESTORE
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const session = await sessionManager.validateSession(token);
    if (!session) {
      // Clear invalid/expired cookie
      const response = NextResponse.json({ authenticated: false }, { status: 401 });
      response.cookies.delete(COOKIE_NAME);
      return response;
    }

    // Get player's last scene for session restoration
    const player = await playerManager.get(session.playerName);
    if (!player) {
      const response = NextResponse.json({ authenticated: false }, { status: 401 });
      response.cookies.delete(COOKIE_NAME);
      return response;
    }

    return NextResponse.json({
      authenticated: true,
      token, // Include token so client can send via WebSocket
      playerName: session.playerName,
      lastScene: player.lastScene,
    });
  } catch (error) {
    console.error('[Session API] GET error:', error);
    return NextResponse.json({ authenticated: false, error: 'Internal error' }, { status: 500 });
  }
}

/**
 * POST: Set session cookie (called after WebSocket login success)
 * The session is already created by the server - this just sets the httpOnly cookie
 * Validates the token before setting the cookie for security
 */
export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }

    // Validate the token exists and is valid (prevents arbitrary token injection)
    const session = await sessionManager.validateSession(token);
    if (!session) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('[Session API] POST error:', error);
    return NextResponse.json({ error: 'Failed to set session cookie' }, { status: 500 });
  }
}

/**
 * DELETE: Logout (delete session and clear cookie)
 */
export async function DELETE() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (token) {
      await sessionManager.deleteSession(token);
    }

    const response = NextResponse.json({ success: true });
    response.cookies.delete(COOKIE_NAME);
    return response;
  } catch (error) {
    console.error('[Session API] DELETE error:', error);
    // Still try to clear cookie even on error
    const response = NextResponse.json({ success: true });
    response.cookies.delete(COOKIE_NAME);
    return response;
  }
}
