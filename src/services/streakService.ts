import AsyncStorage from '@react-native-async-storage/async-storage';

const STREAK_KEY = 'daily_streak';
const LAST_ACTIVITY_KEY = 'last_activity_date';

export class StreakService {
  private static instance: StreakService;

  public static getInstance(): StreakService {
    if (!StreakService.instance) {
      StreakService.instance = new StreakService();
    }
    return StreakService.instance;
  }

  /**
   * Get the current streak count
   */
  async getStreak(): Promise<number> {
    try {
      const streak = await AsyncStorage.getItem(STREAK_KEY);
      return streak ? parseInt(streak, 10) : 0;
    } catch (error) {
      console.error('Error getting streak:', error);
      return 0;
    }
  }

  /**
   * Update the streak when user opens the app
   */
  async updateStreak(): Promise<number> {
    try {
      const today = this.getTodayString();
      const lastActivity = await AsyncStorage.getItem(LAST_ACTIVITY_KEY);
      const currentStreak = await this.getStreak();

      // If no last activity, start streak at 1
      if (!lastActivity) {
        await AsyncStorage.setItem(LAST_ACTIVITY_KEY, today);
        await AsyncStorage.setItem(STREAK_KEY, '1');
        return 1;
      }

      // If already updated today, return current streak
      if (lastActivity === today) {
        return currentStreak;
      }

      const yesterday = this.getYesterdayString();
      let newStreak: number;

      if (lastActivity === yesterday) {
        // Consecutive day - increment streak
        newStreak = currentStreak + 1;
      } else {
        // Streak broken - reset to 1
        newStreak = 1;
      }

      // Update storage
      await AsyncStorage.setItem(LAST_ACTIVITY_KEY, today);
      await AsyncStorage.setItem(STREAK_KEY, newStreak.toString());

      return newStreak;
    } catch (error) {
      console.error('Error updating streak:', error);
      return 0;
    }
  }

  /**
   * Get today's date as YYYY-MM-DD string
   */
  private getTodayString(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  /**
   * Get yesterday's date as YYYY-MM-DD string
   */
  private getYesterdayString(): string {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  }

  /**
   * Reset streak (for testing or if needed)
   */
  async resetStreak(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STREAK_KEY);
      await AsyncStorage.removeItem(LAST_ACTIVITY_KEY);
    } catch (error) {
      console.error('Error resetting streak:', error);
    }
  }
}
