import { eq, desc, and, lt } from 'drizzle-orm';
import { db, chatMessages } from '@/lib/db';
import type { ChatMessage, SceneId } from '@/lib/types';

const MAX_MESSAGES_PER_SCENE = 1000;
const MESSAGES_TO_LOAD = 50;

export class ChatManager {
  // Get recent messages for a scene (last 50)
  async getRecentMessages(sceneId: SceneId): Promise<ChatMessage[]> {
    const messages = await db.select()
      .from(chatMessages)
      .where(eq(chatMessages.sceneId, sceneId))
      .orderBy(desc(chatMessages.createdAt))
      .limit(MESSAGES_TO_LOAD);

    // Return in chronological order (oldest first)
    return messages.reverse().map((msg) => ({
      id: msg.id,
      playerName: msg.playerName,
      message: msg.message,
      sceneId: msg.sceneId,
      createdAt: msg.createdAt.toISOString(),
    }));
  }

  // Add a new message and cleanup old ones beyond limit
  async addMessage(sceneId: SceneId, playerName: string, message: string): Promise<ChatMessage> {
    const [newMessage] = await db.insert(chatMessages)
      .values({ sceneId, playerName, message })
      .returning();

    // Cleanup: delete messages beyond limit for this scene
    await this.cleanupOldMessages(sceneId);

    return {
      id: newMessage.id,
      playerName: newMessage.playerName,
      message: newMessage.message,
      sceneId: newMessage.sceneId,
      createdAt: newMessage.createdAt.toISOString(),
    };
  }

  // Delete messages beyond the limit for a scene
  private async cleanupOldMessages(sceneId: SceneId): Promise<void> {
    // Get the ID of the message at the limit boundary
    const cutoffMessages = await db.select({ id: chatMessages.id })
      .from(chatMessages)
      .where(eq(chatMessages.sceneId, sceneId))
      .orderBy(desc(chatMessages.createdAt))
      .offset(MAX_MESSAGES_PER_SCENE)
      .limit(1);

    if (cutoffMessages.length > 0) {
      // Delete all messages older than the cutoff
      await db.delete(chatMessages)
        .where(and(
          eq(chatMessages.sceneId, sceneId),
          lt(chatMessages.id, cutoffMessages[0].id)
        ));
    }
  }
}
