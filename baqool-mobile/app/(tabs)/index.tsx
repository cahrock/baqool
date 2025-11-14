import React from 'react';
import { Redirect } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';

export default function HomeScreen() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.centerScreen}>
        <Text style={styles.loadingText}>Loading…</Text>
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  const displayName = user.name || user.email;

  return (
    <ScrollView style={styles.container}>
      {/* Top hero / greeting */}
      <View style={styles.heroCard}>
        <Text style={styles.greetingTitle}>Assalamu’alaikum,</Text>
        <Text style={styles.greetingName}>{displayName}</Text>
        <Text style={styles.greetingSubtitle}>
          Welcome back to Baqool. Start a new chat or continue where you left off.
        </Text>

        <View style={styles.heroButtonsRow}>
          <TouchableOpacity
            style={[styles.heroButton, styles.heroButtonPrimary]}
            onPress={() => {
              // TODO: hook to "New Chat" screen when Week 3 is ready
              console.log('New Chat pressed');
            }}
          >
            <Text style={styles.heroButtonPrimaryText}>＋ New Chat</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.heroButton, styles.heroButtonSecondary]}
            onPress={() => {
              // TODO: later: navigate to a "My Conversations" screen
              console.log('View Conversations pressed');
            }}
          >
            <Text style={styles.heroButtonSecondaryText}>View Chats</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick stats / placeholders */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today’s Overview</Text>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Chats today</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Messages sent</Text>
          </View>
        </View>
      </View>

      {/* Feature teasers */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>What you can do</Text>

        <View style={styles.featureCard}>
          <Text style={styles.featureTitle}>Ask anything</Text>
          <Text style={styles.featureBody}>
            Get answers, explanations, and ideas powered by multiple AI models.
          </Text>
        </View>

        <View style={styles.featureCard}>
          <Text style={styles.featureTitle}>Draft & improve content</Text>
          <Text style={styles.featureBody}>
            Generate emails, posts, and documents — then refine them with Baqool.
          </Text>
        </View>

        <View style={styles.featureCard}>
          <Text style={styles.featureTitle}>Plan & organize</Text>
          <Text style={styles.featureBody}>
            Turn raw thoughts into structured plans, checklists, and study notes.
          </Text>
        </View>
      </View>

      <View style={styles.bottomSpace} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6', // light grey
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  centerScreen: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#4B5563',
  },
  heroCard: {
    backgroundColor: '#0F766E', // deep teal
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  greetingTitle: {
    fontSize: 16,
    color: '#CCFBF1',
    marginBottom: 4,
  },
  greetingName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ECFEFF',
  },
  greetingSubtitle: {
    marginTop: 8,
    fontSize: 14,
    color: '#A5F3FC',
  },
  heroButtonsRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 10,
  },
  heroButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroButtonPrimary: {
    backgroundColor: '#ECFEFF',
  },
  heroButtonPrimaryText: {
    color: '#0F766E',
    fontWeight: '600',
  },
  heroButtonSecondary: {
    borderWidth: 1,
    borderColor: '#A5F3FC',
  },
  heroButtonSecondaryText: {
    color: '#ECFEFF',
    fontWeight: '500',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F766E',
  },
  statLabel: {
    marginTop: 4,
    fontSize: 13,
    color: '#6B7280',
  },
  featureCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  featureBody: {
    fontSize: 13,
    color: '#4B5563',
  },
  bottomSpace: {
    height: 24,
  },
});
