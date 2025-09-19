import { supabase } from '../config/supabase';
import AuthService from './authService';

export interface UserInsights {
  totalMessages: number;
  favoritePersonality: string;
  daysActive: number;
  avgSessionLength: string;
  premiumFeaturesUnlocked: number;
  currentStreak: number;
  mostActiveDay: string;
  personalityUsage: Record<string, number>;
  totalSessions: number;
  lastActive: string;
}

export interface EventData {
  personality?: string;
  messageLength?: number;
  hasEmoji?: boolean;
  isVoice?: boolean;
  responseTimeMs?: number;
  oldValue?: any;
  newValue?: any;
  featureId?: string;
  price?: number;
  sessionId?: string;
  errorType?: string;
  errorMessage?: string;
  reason?: string;
  duration?: number;
}

export class AnalyticsService {
  private static currentSessionId: string | null = null;
  private static sessionStartTime: Date | null = null;
  private static sessionEvents: string[] = [];

  /**
   * Initialize analytics service
   */
  static async initialize(): Promise<void> {
    try {
      // Start initial session if user is authenticated
      const authService = AuthService.getInstance();
      if (authService.isSignedIn()) {
        await this.startSession();
      }

      } catch (error) {
      }
  }

  /**
   * Start a new user session
   */
  static async startSession(): Promise<void> {
    try {
      const authService = AuthService.getInstance();
      if (!authService.isSignedIn()) return;

      this.currentSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      this.sessionStartTime = new Date();
      this.sessionEvents = [];

      // Track session start event
      await this.trackEvent('session_start');
    } catch (error) {
      }
  }

  /**
   * End current session
   */
  static async endSession(): Promise<void> {
    try {
      if (!this.currentSessionId || !this.sessionStartTime) return;

      const authService = AuthService.getInstance();
      if (!authService.isSignedIn()) return;

      const duration = Math.floor((Date.now() - this.sessionStartTime.getTime()) / 1000);
      const userId = authService.getUserId();

      // Save session data
      const sessionData = {
        user_id: userId,
        session_start: this.sessionStartTime.toISOString(),
        session_end: new Date().toISOString(),
        duration_seconds: duration,
        chat_messages_count: this.sessionEvents.filter(e => e === 'chat_message_sent').length,
        personality_changes: this.sessionEvents.filter(e => e === 'personality_changed').length,
        settings_changes: this.sessionEvents.filter(e => e === 'settings_changed').length,
        premium_purchases: this.sessionEvents.filter(e => e === 'premium_purchase_success').length
      };

      const { data, error } = await supabase
        .from('user_sessions')
        .insert(sessionData)
        .select();

      if (error) {
        } else {
        }

      // Track session end event
      await this.trackEvent('session_end', { duration });

      // Reset session data
      this.currentSessionId = null;
      this.sessionStartTime = null;
      this.sessionEvents = [];
    } catch (error) {
      }
  }

  /**
   * Track a user event
   */
  static async trackEvent(eventType: string, eventData?: EventData): Promise<void> {
    try {
      const authService = AuthService.getInstance();
      if (!authService.isSignedIn()) return;

      const userId = authService.getUserId();
      const enrichedData = {
        ...eventData,
        sessionId: this.currentSessionId,
        timestamp: new Date().toISOString()
      };

      // Store in Supabase
      const { error } = await supabase
        .from('user_events')
        .insert({
          user_id: userId,
          event_type: eventType,
          event_data: enrichedData,
          session_id: this.currentSessionId
        });

      if (error) {
        } else {
        // Add to session events for summary
        this.sessionEvents.push(eventType);
        }

      // Update daily analytics
      await this.updateDailyAnalytics(eventType, enrichedData);
    } catch (error) {
      }
  }

  /**
   * Update daily analytics aggregate
   */
  private static async updateDailyAnalytics(eventType: string, eventData: any): Promise<void> {
    try {
      const authService = AuthService.getInstance();
      if (!authService.isSignedIn()) return;

      const userId = authService.getUserId();
      const today = new Date().toISOString().split('T')[0];

      // Get current analytics for today
      const { data: existing, error: fetchError } = await supabase
        .from('user_analytics')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        return;
      }

      // Calculate new values
      const analytics = existing || {
        user_id: userId,
        date: today,
        total_chat_messages: 0,
        total_sessions: 0,
        total_session_duration: 0,
        favorite_personality: null,
        premium_features_used: 0
      };

      // Update based on event type
      switch (eventType) {
        case 'chat_message_sent':
          analytics.total_chat_messages += 1;
          if (eventData.personality) {
            analytics.favorite_personality = eventData.personality;
          }
          break;
        case 'premium_purchase_success':
          analytics.premium_features_used += 1;
          break;
      }

      // Upsert the analytics
      const { error: upsertError } = await supabase
        .from('user_analytics')
        .upsert({
          ...analytics,
          last_active: new Date().toISOString()
        }, {
          onConflict: 'user_id,date'
        });

      if (upsertError) {
        }
    } catch (error) {
      }
  }

  /**
   * Get user insights for dashboard
   */
  static async getUserInsights(userId?: string): Promise<UserInsights | null> {
    try {
      const authService = AuthService.getInstance();
      const targetUserId = userId || authService.getUserId();
      if (!targetUserId) return null;

      // Get total messages and personality usage
      const { data: events, error } = await supabase
        .from('user_events')
        .select('event_type, event_data')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false });

      if (error) {
        return null;
      }

      // Calculate insights
      const insights: UserInsights = {
        totalMessages: 0,
        favoritePersonality: 'Sarcastic Sam',
        daysActive: 0,
        avgSessionLength: '0s',
        premiumFeaturesUnlocked: 0,
        currentStreak: 0,
        mostActiveDay: 'Unknown',
        personalityUsage: {},
        totalSessions: 0,
        lastActive: new Date().toISOString()
      };

      // Process events
      const personalityCount: Record<string, number> = {};
      let totalSessionDuration = 0;

      events.forEach(event => {
        switch (event.event_type) {
          case 'chat_message_sent':
            insights.totalMessages += 1;
            if (event.event_data?.personality) {
              const personality = event.event_data.personality;
              personalityCount[personality] = (personalityCount[personality] || 0) + 1;
            }
            break;
          case 'premium_purchase_success':
            insights.premiumFeaturesUnlocked += 1;
            break;
        }
      });

      // Find favorite personality
      let maxCount = 0;
      Object.entries(personalityCount).forEach(([personality, count]) => {
        insights.personalityUsage[personality] = count;
        if (count > maxCount) {
          maxCount = count;
          insights.favoritePersonality = personality;
        }
      });

      // Get session data
      const { data: sessions } = await supabase
        .from('user_sessions')
        .select('duration_seconds, session_start, session_end')
        .eq('user_id', targetUserId)
        .order('session_start', { ascending: false });

      if (sessions && sessions.length > 0) {
        insights.totalSessions = sessions.length;

        // Calculate average session length (only include sessions with valid duration)
        const validSessions = sessions.filter(session => session.duration_seconds && session.duration_seconds > 0);
        if (validSessions.length > 0) {
          const totalDuration = validSessions.reduce((sum, session) => sum + session.duration_seconds, 0);
          insights.avgSessionLength = `${Math.floor(totalDuration / validSessions.length)}s`;
        } else {
          insights.avgSessionLength = '0s';
        }

        // Calculate active days (unique dates from session starts)
        const uniqueDates = new Set(
          sessions.map(session => new Date(session.session_start).toDateString())
        );
        insights.daysActive = uniqueDates.size;

        // Calculate current streak and last active
        const sortedSessions = sessions.sort((a, b) =>
          new Date(b.session_start).getTime() - new Date(a.session_start).getTime()
        );

        if (sortedSessions.length > 0) {
          // Use the most recent session's end time, or start time if no end time
          const mostRecentSession = sortedSessions[0];
          insights.lastActive = mostRecentSession.session_end || mostRecentSession.session_start;

          // If there's an active session (no end time), use current time
          if (!mostRecentSession.session_end) {
            insights.lastActive = new Date().toISOString();
          }
        }

        // Also check for more recent activity from user events
        if (events && events.length > 0) {
          const mostRecentEvent = events[0];
          const eventTime = mostRecentEvent.created_at;
          const currentLastActive = new Date(insights.lastActive || '1970-01-01');

          if (new Date(eventTime) > currentLastActive) {
            insights.lastActive = eventTime;
          }
        }

        // Calculate streak (consecutive days with sessions)
        let streak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let checkDate = new Date(today);

        for (let i = 0; i < 30; i++) { // Check last 30 days
          const dateStr = checkDate.toDateString();
          if (uniqueDates.has(dateStr)) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }

        insights.currentStreak = streak;
      }

      return insights;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get global analytics for admin dashboard
   */
  static async getGlobalMetrics(): Promise<any> {
    try {
      // This would be used for admin dashboard
      // Return aggregate metrics across all users
      const { data, error } = await supabase
        .from('user_events')
        .select('event_type, created_at')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) {
        return null;
      }

      // Calculate basic metrics
      const metrics = {
        totalEvents: data.length,
        recentActivity: data.slice(0, 10),
        eventTypes: {} as Record<string, number>
      };

      data.forEach(event => {
        metrics.eventTypes[event.event_type] = (metrics.eventTypes[event.event_type] || 0) + 1;
      });

      return metrics;
    } catch (error) {
      return null;
    }
  }
}
