import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, TextInput, ActivityIndicator } from 'react-native';

interface CallLog {
  id: string;
  contactName: string;
  company: string;
  duration: string;
  outcome: string;
  date: string;
}

export function VoiceScreen() {
  const [callLogs, setCallLogs] = useState<CallLog[]>([
    { id: '1', contactName: 'Vijay Shekhar', company: 'Paytm', duration: '2m 15s', outcome: 'Interested. Booked Demo on Wednesday 11 AM.', date: 'Today, 11:32 AM' },
    { id: '2', contactName: 'Kunal Shah', company: 'Cred', duration: '45s', outcome: 'Gatekeeper blocked. Instructed AI Agent to recall tomorrow.', date: 'Yesterday' }
  ]);

  const [dialNumber, setDialNumber] = useState('');
  const [activeCallContact, setActiveCallContact] = useState<string | null>(null);
  const [isCalling, setIsCalling] = useState(false);
  const [callTimer, setCallTimer] = useState(0);
  const [callStatus, setCallStatus] = useState<'Ringing...' | 'Connected' | 'Ended'>('Ringing...');
  const [liveTranscript, setLiveTranscript] = useState<string[]>([]);

  useEffect(() => {
    let timerId: any;
    if (isCalling && callStatus === 'Connected') {
      timerId = setInterval(() => {
        setCallTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timerId);
  }, [isCalling, callStatus]);

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins}:${remaining < 10 ? '0' : ''}${remaining}`;
  };

  const handleDial = (num: string) => {
    setDialNumber(prev => prev + num);
  };

  const startCall = (name: string, company: string = 'Inbound Prospect') => {
    setActiveCallContact(`${name} (${company})`);
    setIsCalling(true);
    setCallStatus('Ringing...');
    setCallTimer(0);
    setLiveTranscript(['[AI Agent] Dialing outbound trunk...']);

    // Ring for 2 seconds, then connect
    setTimeout(() => {
      setCallStatus('Connected');
      setLiveTranscript(prev => [...prev, `[SDR Voice AI] Hello, is this ${name}? This is Priya calling on behalf of SalesPilot.`]);

      // Add speech triggers
      setTimeout(() => {
        setLiveTranscript(prev => [...prev, `[Prospect] Yes, it is. What is this about?`]);
      }, 2000);

      setTimeout(() => {
        setLiveTranscript(prev => [...prev, `[SDR Voice AI] We help automate lead enrichment and CRM dialers with cold outreach AI. Would you be open to a brief demo?`]);
      }, 4000);

      setTimeout(() => {
        setLiveTranscript(prev => [...prev, `[Prospect] Actually, that sounds useful. How about Wednesday?`]);
      }, 6000);

    }, 2000);
  };

  const endCall = () => {
    setCallStatus('Ended');
    setTimeout(() => {
      // Save call logs
      const name = activeCallContact ? activeCallContact.split(' (')[0] : 'Prospect';
      const company = activeCallContact ? activeCallContact.split('(')[1]?.replace(')', '') : 'SalesPilot';

      const log: CallLog = {
        id: 'log-' + Date.now(),
        contactName: name,
        company: company || 'SalesPilot',
        duration: formatTimer(callTimer),
        outcome: 'AI Auto-Outcome: Positive response. Demo scheduled via integrated calendar.',
        date: 'Just Now'
      };

      setCallLogs(prev => [log, ...prev]);
      setIsCalling(false);
      setActiveCallContact(null);
      setDialNumber('');
    }, 1000);
  };

  return (
    <View style={styles.container}>
      {!isCalling ? (
        <ScrollView style={styles.dashboard}>
          <Text style={styles.sectionTitle}>Call Dialer Hub</Text>
          <View style={styles.dialerBox}>
            <TextInput 
              style={styles.dialDisplay} 
              value={dialNumber} 
              placeholder="+91 " 
              placeholderTextColor="#475569"
              editable={false}
            />

            <View style={styles.keypadRow}>
              {['1', '2', '3'].map(k => (
                <TouchableOpacity key={k} style={styles.keypadBtn} onPress={() => handleDial(k)}>
                  <Text style={styles.keypadText}>{k}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.keypadRow}>
              {['4', '5', '6'].map(k => (
                <TouchableOpacity key={k} style={styles.keypadBtn} onPress={() => handleDial(k)}>
                  <Text style={styles.keypadText}>{k}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.keypadRow}>
              {['7', '8', '9'].map(k => (
                <TouchableOpacity key={k} style={styles.keypadBtn} onPress={() => handleDial(k)}>
                  <Text style={styles.keypadText}>{k}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.keypadRow}>
              <TouchableOpacity style={styles.keypadBtn} onPress={() => setDialNumber('')}>
                <Text style={[styles.keypadText, { color: '#ef4444' }]}>C</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.keypadBtn} onPress={() => handleDial('0')}>
                <Text style={styles.keypadText}>0</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.keypadBtn, { backgroundColor: '#10b981' }]} 
                onPress={() => startCall(dialNumber || '+91 98765 43210', 'Custom Dialer')}
              >
                <Text style={[styles.keypadText, { color: '#ffffff' }]}>📞</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Recent AI Call Logs & Outcome summaries</Text>
          {callLogs.map((log) => (
            <View key={log.id} style={styles.logCard}>
              <View style={styles.logHeader}>
                <View>
                  <Text style={styles.logContact}>{log.contactName}</Text>
                  <Text style={styles.logCompany}>{log.company} • {log.duration}</Text>
                </View>
                <Text style={styles.logDate}>{log.date}</Text>
              </View>
              <View style={styles.outcomeRow}>
                <Text style={styles.outcomeLabel}>Outcome:</Text>
                <Text style={styles.outcomeText}>{log.outcome}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.activeCallContainer}>
          <View style={styles.callingHeader}>
            <Text style={styles.callingTag}>OUTBOUND AI DIALER</Text>
            <Text style={styles.callingName}>{activeCallContact}</Text>
            <Text style={styles.callingStatus}>{callStatus} • {formatTimer(callTimer)}</Text>
          </View>

          {/* Sound animation simulator */}
          <View style={styles.soundWaveContainer}>
            <View style={[styles.waveBar, { height: callStatus === 'Connected' ? 40 : 10 }]} />
            <View style={[styles.waveBar, { height: callStatus === 'Connected' ? 70 : 10 }]} />
            <View style={[styles.waveBar, { height: callStatus === 'Connected' ? 50 : 10 }]} />
            <View style={[styles.waveBar, { height: callStatus === 'Connected' ? 80 : 10 }]} />
            <View style={[styles.waveBar, { height: callStatus === 'Connected' ? 30 : 10 }]} />
          </View>

          {/* Real-time speech transcript block */}
          <View style={styles.transcriptBox}>
            <Text style={styles.transcriptTitle}>AI Call Transcript (Live Stream)</Text>
            <ScrollView style={styles.transcriptScroll}>
              {liveTranscript.map((t, i) => (
                <Text key={i} style={[
                  styles.transcriptLine,
                  t.startsWith('[AI Agent') && styles.transcriptAgentLine,
                  t.startsWith('[SDR Voice') && styles.transcriptSdrLine
                ]}>
                  {t}
                </Text>
              ))}
            </ScrollView>
          </View>

          <TouchableOpacity style={styles.hangupBtn} onPress={endCall}>
            <Text style={styles.hangupText}>Hang Up Call</Text>
          </TouchableOpacity>
        </View>
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
  dashboard: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 12,
  },
  dialerBox: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  dialDisplay: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    color: '#ffffff',
    width: '100%',
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '800',
    padding: 14,
    marginBottom: 20,
    letterSpacing: 2,
    borderWidth: 1,
    borderColor: '#334155',
  },
  keypadRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 14,
    width: '100%',
    justifyContent: 'center',
  },
  keypadBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  keypadText: {
    color: '#cbd5e1',
    fontSize: 20,
    fontWeight: '700',
  },
  logCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  logContact: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  logCompany: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  logDate: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
  },
  outcomeRow: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  outcomeLabel: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  outcomeText: {
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
    fontWeight: '500',
  },
  activeCallContainer: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 40,
  },
  callingHeader: {
    alignItems: 'center',
  },
  callingTag: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
  },
  callingName: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '800',
    marginTop: 8,
  },
  callingStatus: {
    color: '#94a3b8',
    fontSize: 14,
    marginTop: 4,
    fontWeight: '500',
  },
  soundWaveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 100,
  },
  waveBar: {
    width: 6,
    backgroundColor: '#10b981',
    borderRadius: 3,
  },
  transcriptBox: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    width: '100%',
    padding: 16,
    height: 200,
    borderWidth: 1,
    borderColor: '#334155',
  },
  transcriptTitle: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  transcriptScroll: {
    flex: 1,
  },
  transcriptLine: {
    color: '#cbd5e1',
    fontSize: 13,
    marginBottom: 10,
    lineHeight: 18,
  },
  transcriptAgentLine: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  transcriptSdrLine: {
    color: '#10b981',
    fontWeight: '600',
  },
  hangupBtn: {
    backgroundColor: '#ef4444',
    borderRadius: 16,
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
  },
  hangupText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
});
