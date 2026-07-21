import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Switch, TouchableOpacity, Alert } from 'react-native';

export function SettingsScreen({ user, onLogout }: { user: any; onLogout: () => void }) {
  const [pushLeads, setPushLeads] = useState(true);
  const [pushMeetings, setPushMeetings] = useState(true);
  const [pushWorkflows, setPushWorkflows] = useState(true);
  const [biometricsEnabled, setBiometricsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  const handleOrgSync = () => {
    Alert.alert('Workspace Synced', 'Successfully verified subscription tiers & active team members.');
  };

  const handleCashfreeBilling = () => {
    Alert.alert('Cashfree Redirect', 'Redirecting to secure Cashfree India subscription portal inside your mobile browser.');
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>User Profile</Text>
      </View>
      <View style={styles.card}>
        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user.name ? user.name[0]?.toUpperCase() : 'S'}</Text>
          </View>
          <View>
            <Text style={styles.profileName}>{user.name || 'Soham Kharat'}</Text>
            <Text style={styles.profileEmail}>{user.email || 'soham@salespilot.co'}</Text>
          </View>
        </View>
      </View>

      {/* Organization Info */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Organization & billing</Text>
      </View>
      <View style={styles.card}>
        <View style={styles.settingRow}>
          <View>
            <Text style={styles.settingLabel}>Connected Workspace</Text>
            <Text style={styles.settingSub}>{user.org || 'Soham Labs Team'}</Text>
          </View>
          <TouchableOpacity style={styles.actionBtn} onPress={handleOrgSync}>
            <Text style={styles.actionBtnText}>Sync</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        <View style={styles.settingRow}>
          <View>
            <Text style={styles.settingLabel}>Billing Plan</Text>
            <Text style={styles.settingSub}>Professional Tier • Active</Text>
          </View>
          <TouchableOpacity style={styles.actionBtn} onPress={handleCashfreeBilling}>
            <Text style={styles.actionBtnText}>Billing</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Security Switches */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Security Settings</Text>
      </View>
      <View style={styles.card}>
        <View style={styles.settingRow}>
          <View>
            <Text style={styles.settingLabel}>Biometric Authentication</Text>
            <Text style={styles.settingSub}>Unlock app with Touch ID / Face ID</Text>
          </View>
          <Switch 
            value={biometricsEnabled} 
            onValueChange={setBiometricsEnabled}
            trackColor={{ false: '#cbd5e1', true: '#10b981' }}
            thumbColor="#ffffff"
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.settingRow}>
          <View>
            <Text style={styles.settingLabel}>Encrypted Storage Cache</Text>
            <Text style={styles.settingSub}>CRM outbox cached using AES-256 keys</Text>
          </View>
          <View style={styles.secureBadge}>
            <Text style={styles.secureText}>SECURE</Text>
          </View>
        </View>
      </View>

      {/* Push Notification preferences */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Push Notifications</Text>
      </View>
      <View style={styles.card}>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>New Lead Registered Alerts</Text>
          <Switch 
            value={pushLeads} 
            onValueChange={setPushLeads}
            trackColor={{ false: '#cbd5e1', true: '#10b981' }}
            thumbColor="#ffffff"
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Meeting & Google Meet Reminders</Text>
          <Switch 
            value={pushMeetings} 
            onValueChange={setPushMeetings}
            trackColor={{ false: '#cbd5e1', true: '#10b981' }}
            thumbColor="#ffffff"
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Workflow Auto-Completion Logs</Text>
          <Switch 
            value={pushWorkflows} 
            onValueChange={setPushWorkflows}
            trackColor={{ false: '#cbd5e1', true: '#10b981' }}
            thumbColor="#ffffff"
          />
        </View>
      </View>

      {/* Visual Prefs */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Visual Prefs</Text>
      </View>
      <View style={styles.card}>
        <View style={styles.settingRow}>
          <View>
            <Text style={styles.settingLabel}>SalesPilot Dark Theme</Text>
            <Text style={styles.settingSub}>Optimal for low-light outbound shifts</Text>
          </View>
          <Switch 
            value={darkMode} 
            onValueChange={setDarkMode}
            trackColor={{ false: '#cbd5e1', true: '#10b981' }}
            thumbColor="#ffffff"
          />
        </View>
      </View>

      {/* Logout button */}
      <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
        <Text style={styles.logoutBtnText}>Logout from Mobile Session</Text>
      </TouchableOpacity>

      <Text style={styles.versionText}>SalesPilot v1.0.0 (Production Build)</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 16,
  },
  sectionHeader: {
    marginTop: 18,
    marginBottom: 8,
  },
  sectionTitle: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 10,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  profileName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  profileEmail: {
    color: '#94a3b8',
    fontSize: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLabel: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  settingSub: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  actionBtn: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  actionBtnText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 14,
  },
  secureBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  secureText: {
    color: '#10b981',
    fontSize: 9,
    fontWeight: '800',
  },
  logoutBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  logoutBtnText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '800',
  },
  versionText: {
    color: '#475569',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 40,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
