import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { LoginScreen } from './src/screens/LoginScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { CrmScreen } from './src/screens/CrmScreen';
import { AiChatScreen } from './src/screens/AiChatScreen';
import { CalendarScreen } from './src/screens/CalendarScreen';
import { GmailScreen } from './src/screens/GmailScreen';
import { VoiceScreen } from './src/screens/VoiceScreen';
import { ScannerScreen } from './src/screens/ScannerScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';

type MobileTab = 'Dashboard' | 'CRM' | 'AI Assistant' | 'Calendar' | 'Gmail' | 'AI Voice' | 'Scanners' | 'Settings';

export default function App() {
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<MobileTab>('Dashboard');

  // Automatically check cache or biometric token on load
  useEffect(() => {
    // Biometric checks placeholder
  }, []);

  const handleLoginSuccess = (user: any) => {
    setCurrentUser(user);
    setActiveTab('Dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  if (!currentUser) {
    return (
      <SafeAreaView style={styles.authContainer}>
        <StatusBar barStyle="light-content" />
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      </SafeAreaView>
    );
  }

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'Dashboard':
        return <DashboardScreen user={currentUser} onNavigate={(tab) => setActiveTab(tab as MobileTab)} />;
      case 'CRM':
        return <CrmScreen />;
      case 'AI Assistant':
        return <AiChatScreen />;
      case 'Calendar':
        return <CalendarScreen />;
      case 'Gmail':
        return <GmailScreen />;
      case 'AI Voice':
        return <VoiceScreen />;
      case 'Scanners':
        return <ScannerScreen />;
      case 'Settings':
        return <SettingsScreen user={currentUser} onLogout={handleLogout} />;
      default:
        return <DashboardScreen user={currentUser} onNavigate={(tab) => setActiveTab(tab as MobileTab)} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Top Navigation Title Bar */}
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>SalesPilot Mobile</Text>
        <Text style={styles.headerActiveScreen}>{activeTab}</Text>
      </View>

      {/* Main active screen */}
      <View style={styles.screenBody}>
        {renderActiveScreen()}
      </View>

      {/* Bottom Horizontal Tab Navigation Bar */}
      <View style={styles.tabBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBarScroll}>
          {([
            { id: 'Dashboard', icon: '📊' },
            { id: 'CRM', icon: '👥' },
            { id: 'AI Assistant', icon: '🤖' },
            { id: 'Calendar', icon: '📅' },
            { id: 'Gmail', icon: '✉️' },
            { id: 'AI Voice', icon: '📞' },
            { id: 'Scanners', icon: '📷' },
            { id: 'Settings', icon: '⚙️' }
          ] as const).map((tab) => (
            <TouchableOpacity 
              key={tab.id} 
              style={[
                styles.tabBtn, 
                activeTab === tab.id && styles.activeTabBtn
              ]} 
              onPress={() => setActiveTab(tab.id)}
            >
              <Text style={styles.tabIcon}>{tab.icon}</Text>
              <Text style={[
                styles.tabText, 
                activeTab === tab.id && styles.activeTabText
              ]}>
                {tab.id}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  authContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  headerBar: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#334155',
  },
  headerTitle: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  headerActiveScreen: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  screenBody: {
    flex: 1,
  },
  tabBar: {
    backgroundColor: '#1e293b',
    borderTopWidth: 1,
    borderColor: '#334155',
    height: 64,
  },
  tabBarScroll: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  tabBtn: {
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    opacity: 0.6,
  },
  activeTabBtn: {
    opacity: 1,
    borderBottomWidth: 3,
    borderBottomColor: '#10b981',
  },
  tabIcon: {
    fontSize: 18,
    marginBottom: 2,
  },
  tabText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '700',
  },
  activeTabText: {
    color: '#10b981',
  },
});
