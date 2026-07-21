import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';

export function DashboardScreen({ user, onNavigate }: { user: any; onNavigate: (screen: string) => void }) {
  const stats = {
    todayMeetings: 3,
    newLeads: 12,
    aiTasks: 5,
    revenueInr: '₹85,000',
    pipelineValue: '₹5,40,000'
  };

  const recentNotifications = [
    { id: '1', title: 'New CRM Lead', body: 'Ashish Gupta from Paytm signed up via outbound campaign.', time: '10m ago' },
    { id: '2', title: 'Meeting Confirmed', body: 'Demo meeting with Priya Sharma scheduled for tomorrow 11:00 AM.', time: '1h ago' },
    { id: '3', title: 'AI SDR Task Completed', body: 'Enriched domain emails for Cred. 8 validation records created.', time: '3h ago' }
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Workspace Profile Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.userNameText}>{user.name || 'Soham'}</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{user.org || 'SalesPilot'}</Text>
        </View>
      </View>

      {/* Online Status / Auto-Sync Indicator */}
      <View style={styles.syncBanner}>
        <View style={styles.pulseDot} />
        <Text style={styles.syncText}>Offline Engine Active • Auto-Sync Enabled</Text>
      </View>

      {/* Stats Matrix Grid */}
      <View style={styles.statsGrid}>
        <TouchableOpacity style={styles.statCard} onPress={() => onNavigate('Calendar')}>
          <Text style={styles.statLabel}>Today's Meetings</Text>
          <Text style={styles.statVal}>{stats.todayMeetings}</Text>
          <Text style={styles.statSub}>3 Google Meets scheduled</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.statCard} onPress={() => onNavigate('CRM')}>
          <Text style={styles.statLabel}>New Leads</Text>
          <Text style={[styles.statVal, { color: '#10b981' }]}>+{stats.newLeads}</Text>
          <Text style={styles.statSub}>Total 142 in CRM pipeline</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.statCard} onPress={() => onNavigate('AI Assistant')}>
          <Text style={styles.statLabel}>AI SDR Tasks</Text>
          <Text style={[styles.statVal, { color: '#f59e0b' }]}>{stats.aiTasks}</Text>
          <Text style={styles.statSub}>2 require approval checks</Text>
        </TouchableOpacity>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Active Revenue</Text>
          <Text style={styles.statVal}>{stats.revenueInr}</Text>
          <Text style={styles.statSub}>Professionals plans billed</Text>
        </View>
      </View>

      {/* Pipeline Summary Card */}
      <View style={styles.pipelineCard}>
        <Text style={styles.pipelineTitle}>Outbound Pipeline Summary</Text>
        <Text style={styles.pipelineValue}>{stats.pipelineValue}</Text>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: '65%' }]} />
        </View>
        <View style={styles.pipelineLegend}>
          <Text style={styles.legendText}>65% Qualified</Text>
          <Text style={styles.legendText}>35% In-Progress</Text>
        </View>
      </View>

      {/* Recent Alerts Feed */}
      <View style={styles.alertsContainer}>
        <Text style={styles.sectionTitle}>Real-time CRM Alerts</Text>
        {recentNotifications.map((n) => (
          <View key={n.id} style={styles.alertItem}>
            <View style={styles.alertContent}>
              <View style={styles.alertHeaderRow}>
                <Text style={styles.alertTitle}>{n.title}</Text>
                <Text style={styles.alertTime}>{n.time}</Text>
              </View>
              <Text style={styles.alertBody}>{n.body}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
  },
  userNameText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
  },
  badge: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    color: '#10b981',
    fontWeight: '700',
  },
  syncBanner: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
    marginRight: 8,
  },
  syncText: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: '#1e293b',
    width: '48%',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  statVal: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    marginVertical: 4,
  },
  statSub: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '500',
  },
  pipelineCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 24,
  },
  pipelineTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  pipelineValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ffffff',
    marginVertical: 6,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#0f172a',
    borderRadius: 4,
    marginVertical: 12,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 4,
  },
  pipelineLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  legendText: {
    fontSize: 11,
    color: '#cbd5e1',
    fontWeight: '600',
  },
  alertsContainer: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 14,
  },
  alertItem: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  alertContent: {
    flex: 1,
  },
  alertHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  alertTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  alertTime: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '500',
  },
  alertBody: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 18,
  },
});
