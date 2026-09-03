import { connectToDatabase } from '@/lib/db'
import { Lesson } from '@/models/Curriculum'

/**
 * Automatically mark lessons as ended if their scheduled date has passed
 * This should be called periodically (e.g., via cron job or on page load)
 */
export async function markEndedLessons() {
  try {
    await connectToDatabase()
    
    const now = new Date()
    
    // Find all lessons that have a scheduled date in the past and are not yet marked as ended
    // Also unmark lessons that are marked as ended but have future scheduled dates
    const [pastLessons, futureLessons] = await Promise.all([
      Lesson.updateMany(
        {
          scheduledDate: { $lt: now },
          ended: { $ne: true },
        },
        {
          $set: {
            ended: true,
            endedAt: now,
          },
        }
      ),
      Lesson.updateMany(
        {
          scheduledDate: { $gt: now },
          ended: true,
        },
        {
          $set: {
            ended: false,
            endedAt: undefined,
          },
        }
      ),
    ])
    
    console.log(`Marked ${pastLessons.modifiedCount} lessons as ended, unmarked ${futureLessons.modifiedCount} future lessons`)
    return pastLessons.modifiedCount
  } catch (error) {
    console.error('Error marking ended lessons:', error)
    return 0
  }
}

/**
 * Check if a lesson is currently live (has started but not ended)
 */
export function isLessonLive(scheduledDate: Date | string | null, ended: boolean = false): boolean {
  if (!scheduledDate || ended) return false
  
  const now = new Date()
  const scheduled = new Date(scheduledDate)
  
  // Consider a class "live" for 2 hours after scheduled time
  const liveEnd = new Date(scheduled.getTime() + 2 * 60 * 60 * 1000)
  
  return now >= scheduled && now <= liveEnd
}

/**
 * Check if a lesson can be joined (hasn't ended yet)
 */
export function canJoinLesson(scheduledDate: Date | string | null, ended: boolean = false): boolean {
  if (!scheduledDate || ended) return false
  
  const now = new Date()
  const scheduled = new Date(scheduledDate)
  
  // Can join up to 30 minutes before scheduled time
  const joinStart = new Date(scheduled.getTime() - 30 * 60 * 1000)
  const liveEnd = new Date(scheduled.getTime() + 2 * 60 * 60 * 1000)
  
  return now >= joinStart && now <= liveEnd
}
