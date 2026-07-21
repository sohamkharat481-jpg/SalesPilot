import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';

interface Email {
  id: string;
  sender: string;
  subject: string;
  snippet: string;
  status: 'read' | 'clicked' | 'sent';
  date: string;
}

export function GmailScreen() {
  const [emails, setEmails] = useState<Email[]>([
    { id: '1', sender: 'kunal@cred.club', subject: 'API Outbound Scraping Capabilities', snippet: 'Can you show me how your system scrapes verified LinkedIn data and triggers immediate voice outreach? We need this for our merchants.', status: 'read', date: '9:30 AM' },
    { id: '2', sender: 'vijay@paytm.com', subject: 'Re: Follow-up Demo scheduling', snippet: 'I am available Wednesday at 4 PM IST. Send over the Zoom link and we will proceed with the billing setups.', status: 'clicked', date: 'Yesterday' }
  ]);

  const [activeTab, setActiveTab] = useState<'inbox' | 'sent'>('inbox');
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [isComposing, setIsComposing] = useState(false);

  const handleAiReply = (email: Email) => {
    setIsComposing(true);
    setComposeTo(email.sender);
    setComposeSubject(`Re: ${email.subject}`);
    setComposeBody(
      `Hi,\n\nThanks for reaching out! Regarding "${email.subject}", SalesPilot's automatic scrapers are fully functional and integrate directly with CRM workflows.\n\nLet's hook this up. Are you available tomorrow at 11 AM IST?\n\nBest,\nSoham\n(SalesPilot Co-Pilot)`
    );
  };

  const handleSendEmail = () => {
    if (!composeTo || !composeSubject || !composeBody) {
      Alert.alert('Incomplete Fields', 'Please specify To, Subject, and Body.');
      return;
    }

    const newSentEmail: Email = {
      id: 'sent-' + Date.now(),
      sender: composeTo,
      subject: composeSubject,
      snippet: composeBody.substring(0, 80),
      status: 'sent',
      date: 'Just Now'
    };

    setEmails(prev => [newSentEmail, ...prev]);
    setIsComposing(false);
    setComposeTo('');
    setComposeSubject('');
    setComposeBody('');
    Alert.alert('Email Dispatched', 'Dispatched through connected Gmail client securely.');
  };

  return (
    <View style={styles.container}>
      {/* Inbox/Sent Navigation Tabs */}
      <View style={styles.tabHeader}>
        <TouchableOpacity 
          style={[styles.headerTab, activeTab === 'inbox' && styles.activeHeaderTab]}
          onPress={() => { setActiveTab('inbox'); setIsComposing(false); }}
        >
          <Text style={[styles.tabHeaderText, activeTab === 'inbox' && styles.activeTabHeaderText]}>Gmail Inbox</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.headerTab, activeTab === 'sent' && styles.activeHeaderTab]}
          onPress={() => { setActiveTab('sent'); setIsComposing(false); }}
        >
          <Text style={[styles.tabHeaderText, activeTab === 'sent' && styles.activeTabHeaderText]}>Sent Items</Text>
        </TouchableOpacity>
      </View>

      {!isComposing ? (
        <ScrollView style={styles.emailList}>
          {emails.filter(e => activeTab === 'inbox' ? e.status !== 'sent' : e.status === 'sent').map((e) => (
            <View key={e.id} style={styles.emailCard}>
              <View style={styles.emailHeader}>
                <Text style={styles.senderText}>{e.sender}</Text>
                <Text style={styles.dateText}>{e.date}</Text>
              </View>
              <Text style={styles.subjectText}>{e.subject}</Text>
              <Text style={styles.snippetText} numberOfLines={2}>{e.snippet}</Text>

              <View style={styles.cardActions}>
                <View style={styles.trackingRow}>
                  <View style={[styles.statusDot, e.status === 'clicked' ? styles.statusClicked : styles.statusRead]} />
                  <Text style={styles.trackingText}>
                    {e.status === 'clicked' ? 'Email Opened & Clicked' : e.status === 'read' ? 'Opened' : 'Delivered'}
                  </Text>
                </View>

                {activeTab === 'inbox' && (
                  <TouchableOpacity style={styles.aiReplyBtn} onPress={() => handleAiReply(e)}>
                    <Text style={styles.aiReplyText}>🪄 AI smart Draft</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
          
          <TouchableOpacity style={styles.floatingCompose} onPress={() => setIsComposing(true)}>
            <Text style={styles.composeText}>+ COMPOSE</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <ScrollView style={styles.composeForm}>
          <Text style={styles.formTitle}>Compose Outbound Email</Text>

          <Text style={styles.formLabel}>To:</Text>
          <TextInput style={styles.formInput} value={composeTo} onChangeText={setComposeTo} placeholder="prospect@company.com" placeholderTextColor="#64748b" autoCapitalize="none" keyboardType="email-address" />

          <Text style={styles.formLabel}>Subject:</Text>
          <TextInput style={styles.formInput} value={composeSubject} onChangeText={setComposeSubject} placeholder="Meeting follow-up" placeholderTextColor="#64748b" />

          <Text style={styles.formLabel}>Body:</Text>
          <TextInput style={[styles.formInput, { height: 160 }]} value={composeBody} onChangeText={setComposeBody} multiline placeholder="Type your message..." placeholderTextColor="#64748b" />

          <View style={styles.formButtons}>
            <TouchableOpacity style={styles.discardBtn} onPress={() => setIsComposing(false)}>
              <Text style={styles.discardText}>Discard</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sendBtn} onPress={handleSendEmail}>
              <Text style={styles.sendBtnText}>Send Email</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 16,
  },
  tabHeader: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  headerTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeHeaderTab: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
  },
  tabHeaderText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
  },
  activeTabHeaderText: {
    color: '#10b981',
  },
  emailList: {
    flex: 1,
  },
  emailCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  emailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  senderText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  dateText: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
  },
  subjectText: {
    color: '#10b981',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  snippetText: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#334155',
    paddingTop: 12,
  },
  trackingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusRead: {
    backgroundColor: '#3b82f6',
  },
  statusClicked: {
    backgroundColor: '#10b981',
  },
  trackingText: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '600',
  },
  aiReplyBtn: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  aiReplyText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '700',
  },
  floatingCompose: {
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  composeText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13,
  },
  composeForm: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  formTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 16,
  },
  formLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  formInput: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 12,
    color: '#ffffff',
    fontSize: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
    marginBottom: 20,
  },
  discardBtn: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  discardText: {
    color: '#cbd5e1',
    fontWeight: '700',
  },
  sendBtn: {
    flex: 1.5,
    backgroundColor: '#10b981',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  sendBtnText: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
