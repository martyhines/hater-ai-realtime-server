import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { AnalyticsService, UserInsights } from '../services/analyticsService';
import AuthService from '../services/authService';

type InsightsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Insights'>;

interface Props {
  navigation: InsightsScreenNavigationProp;
  route?: {
    params?: {
      global?: boolean;
    };
  };
}

const InsightsScreen: React.FC<Props> = ({ navigation, route }) => {
  const [insights, setInsights] = useState<UserInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isGlobalView, setIsGlobalView] = useState(false);

  // Check if this is global view on mount
  useEffect(() => {
    const globalParam = route?.params?.global;
    setIsGlobalView(!!globalParam);
  }, [route?.params?.global]);

  const loadGlobalInsights = async (): Promise<UserInsights> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Return mock global insights data matching UserInsights interface
    // In a real implementation, this would fetch aggregated anonymized data from your server
    return {
      totalMessages: 89250, // Total messages across all users
      favoritePersonality: 'Sarcastic Sam', // Most popular personality globally
      daysActive: 365, // Days since app launch
      avgSessionLength: '8.3 min', // Average session length
      premiumFeaturesUnlocked: 16, // Total premium personalities available
      currentStreak: 0, // Not applicable for global view
      mostActiveDay: 'Friday', // Most popular day globally
      personalityUsage: {
        'Sarcastic Sam': 4520,
        'Grammar Police': 3210,
        'Fitness Coach': 2890,
        'British Gentleman': 2650,
        'Therapist': 2150
      },
      totalSessions: 15420, // Total sessions across all users
      lastActive: new Date().toISOString()
    };
  };

  const loadInsights = async () => {
    try {
      setLoading(true);

      let userInsights;
      if (isGlobalView) {
        // Load global aggregated insights (for now, use mock data structure)
        userInsights = await loadGlobalInsights();
      } else {
        // Load user's personal insights
        userInsights = await AnalyticsService.getUserInsights();
      }
      setInsights(userInsights);
    } catch (error) {
      } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInsights();
    setRefreshing(false);
  };

  useEffect(() => {
    loadInsights();
  }, []);

  if (loading && !insights) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFD700" />
          <Text style={styles.loadingText}>Loading your insights...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!insights) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="analytics" size={64} color="#666" />
          <Text style={styles.errorTitle}>No Data Yet</Text>
          <Text style={styles.errorText}>
            Start chatting to see your personalized insights!
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const getPersonalityEmoji = (personality: string): string => {
    const emojiMap: Record<string, string> = {
      sarcastic: '😏',
      brutal: '💀',
      witty: '🧠',
      condescending: '🤓',
      streetsmart: '🔥',
      newyorker: '🗽',
      bronxbambino: '🏙️',
      britishgentleman: '🇬🇧',
      southernbelle: '🌹',
      valleygirl: '💅',
      surferdude: '🏄‍♂️',
    };
    return emojiMap[personality] || '🎭';
  };

  const getPersonalityName = (personality: string): string => {
    const nameMap: Record<string, string> = {
      sarcastic: 'Sarcastic Sam',
      brutal: 'Brutal Betty',
      witty: 'Witty Will',
      condescending: 'Condescending Carl',
      streetsmart: 'Street Smart',
      newyorker: 'The Posh New Yorker',
      bronxbambino: 'The Bronx Bambino',
      britishgentleman: 'British Gentleman',
      southernbelle: 'Southern Belle',
      valleygirl: 'Valley Girl',
      surferdude: 'Surfer Dude',
    };
    return nameMap[personality] || personality;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {isGlobalView ? '🌍 Global Insights' : '📊 Your Insights'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {isGlobalView
              ? 'Community trends and anonymized usage patterns'
              : 'Your personalized AI roasting journey'
            }
          </Text>
        </View>

        {/* Overview Cards */}
        <View style={styles.overviewGrid}>
          <View style={styles.overviewCard}>
            <Ionicons name="chatbubble" size={24} color="#FFD700" />
            <Text style={styles.overviewNumber}>{insights.totalMessages}</Text>
            <Text style={styles.overviewLabel}>Total Messages</Text>
          </View>

          <View style={styles.overviewCard}>
            <Ionicons name="time" size={24} color="#4CAF50" />
            <Text style={styles.overviewNumber}>{insights.totalSessions}</Text>
            <Text style={styles.overviewLabel}>Sessions</Text>
          </View>

          <View style={styles.overviewCard}>
            <Ionicons name="star" size={24} color="#FF6B6B" />
            <Text style={styles.overviewNumber}>{insights.premiumFeaturesUnlocked}</Text>
            <Text style={styles.overviewLabel}>
              {isGlobalView ? 'Premium Personalities' : 'Premium Features'}
            </Text>
          </View>

          <View style={styles.overviewCard}>
            <Ionicons name="flame" size={24} color="#FF9800" />
            <Text style={styles.overviewNumber}>
              {isGlobalView ? insights.daysActive : insights.currentStreak}
            </Text>
            <Text style={styles.overviewLabel}>
              {isGlobalView ? 'Active Days' : 'Day Streak'}
            </Text>
          </View>
        </View>

        {/* Favorite Personality */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            🎭 {isGlobalView ? 'Community Favorite' : 'Your Favorite Roaster'}
          </Text>
          <View style={styles.personalityCard}>
            <Text style={styles.personalityEmoji}>
              {getPersonalityEmoji(insights.favoritePersonality)}
            </Text>
            <View style={styles.personalityInfo}>
              <Text style={styles.personalityName}>
                {getPersonalityName(insights.favoritePersonality)}
              </Text>
              <Text style={styles.personalityStats}>
                Most used personality in {insights.personalityUsage[insights.favoritePersonality] || 0} messages
              </Text>
            </View>
          </View>
        </View>

        {/* Personality Usage */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📈 Personality Usage</Text>
          <Text style={styles.sectionSubtitle}>How often you use each personality</Text>

          {Object.entries(insights.personalityUsage)
            .sort(([, a], [, b]) => b - a)
            .map(([personality, count]) => (
              <View key={personality} style={styles.usageRow}>
                <View style={styles.usageInfo}>
                  <Text style={styles.usageEmoji}>
                    {getPersonalityEmoji(personality)}
                  </Text>
                  <Text style={styles.usageName}>
                    {getPersonalityName(personality)}
                  </Text>
                </View>
                <View style={styles.usageStats}>
                  <Text style={styles.usageCount}>{count}</Text>
                  <Text style={styles.usagePercent}>
                    {insights.totalMessages > 0
                      ? Math.round((count / insights.totalMessages) * 100)
                      : 0}%
                  </Text>
                </View>
              </View>
            ))}
        </View>

        {/* Session Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⏱️ Session Insights</Text>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{insights.avgSessionLength}</Text>
              <Text style={styles.statLabel}>Avg Session</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statValue}>{insights.daysActive}</Text>
              <Text style={styles.statLabel}>Active Days</Text>
            </View>
          </View>

          <View style={styles.lastActive}>
            <Ionicons name="calendar" size={16} color="#666" />
            <Text style={styles.lastActiveText}>
              Last active: {new Date(insights.lastActive).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Achievement Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏆 Achievements</Text>

          <View style={styles.achievementGrid}>
            {insights.totalMessages >= 10 && (
              <View style={styles.achievementCard}>
                <Ionicons name="chatbubble" size={24} color="#FFD700" />
                <Text style={styles.achievementTitle}>Chat Starter</Text>
                <Text style={styles.achievementDesc}>Sent 10+ messages</Text>
              </View>
            )}

            {insights.totalSessions >= 5 && (
              <View style={styles.achievementCard}>
                <Ionicons name="repeat" size={24} color="#4CAF50" />
                <Text style={styles.achievementTitle}>Regular User</Text>
                <Text style={styles.achievementDesc}>5+ sessions</Text>
              </View>
            )}

            {insights.premiumFeaturesUnlocked > 0 && (
              <View style={styles.achievementCard}>
                <Ionicons name="star" size={24} color="#FF6B6B" />
                <Text style={styles.achievementTitle}>Premium User</Text>
                <Text style={styles.achievementDesc}>Unlocked premium features</Text>
              </View>
            )}

            {Object.keys(insights.personalityUsage).length >= 3 && (
              <View style={styles.achievementCard}>
                <Ionicons name="people" size={24} color="#FF9800" />
                <Text style={styles.achievementTitle}>Personality Explorer</Text>
                <Text style={styles.achievementDesc}>Used 3+ personalities</Text>
              </View>
            )}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Pull down to refresh your insights
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    color: '#ccc',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    gap: 12,
  },
  overviewCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    minWidth: (Dimensions.get('window').width - 52) / 2,
  },
  overviewNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    marginTop: 8,
  },
  overviewLabel: {
    fontSize: 12,
    color: '#ccc',
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 16,
  },
  personalityCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  personalityEmoji: {
    fontSize: 48,
    marginRight: 16,
  },
  personalityInfo: {
    flex: 1,
  },
  personalityName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  personalityStats: {
    fontSize: 14,
    color: '#ccc',
  },
  usageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  usageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  usageEmoji: {
    fontSize: 24,
    marginRight: 12,
    width: 30,
    textAlign: 'center',
  },
  usageName: {
    fontSize: 16,
    color: '#fff',
    flex: 1,
  },
  usageStats: {
    alignItems: 'flex-end',
  },
  usageCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  usagePercent: {
    fontSize: 12,
    color: '#ccc',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  statLabel: {
    fontSize: 12,
    color: '#ccc',
    marginTop: 4,
  },
  lastActive: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    padding: 12,
  },
  lastActiveText: {
    color: '#ccc',
    marginLeft: 8,
    fontSize: 14,
  },
  achievementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  achievementCard: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    minWidth: (Dimensions.get('window').width - 52) / 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFD700',
    marginTop: 8,
    textAlign: 'center',
  },
  achievementDesc: {
    fontSize: 12,
    color: '#ccc',
    marginTop: 4,
    textAlign: 'center',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    color: '#666',
    fontSize: 12,
  },
});

export default InsightsScreen;
