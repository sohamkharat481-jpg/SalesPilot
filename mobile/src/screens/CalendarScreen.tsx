import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';

interface Appointment {
  id: string;
  leadName: string;
  company: string;
  dateTime: string;
  status: string;
  meetingLink: string;
}

export function CalendarScreen() {
  const [appointments, setAppointments] = useState<Appointment[]>([
    { id: '1', leadName: 'Vijay Shekhar', company: 'Paytm', dateTime: 'Today • 11:30 AM', status: 'SCHEDULED', meetingLink: 'https://meet.google.com/sp-demo-paytm' },
    { id: '2', leadName: 'Kunal Shah', company: 'Cred', dateTime: 'Tomorrow • 3:00 PM', status: 'SCHEDULED', meetingLink: 'https://meet.google.com/sp-demo-cred' },
    { id: '3', leadName: 'Priya Sharma', company: 'Razorpay', dateTime: 'Wednesday, July 23 • 10:00 AM', status: 'SCHEDULED', meetingLink: 'https://meet.google.com/sp-demo-razorpay' }
  ]);

  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [newLeadName, setNewLeadName] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newDateTime, setNewDateTime] = useState('');

  const handleCreateMeeting = () => {
    if (!newLeadName || !newCompany || !newDateTime) {
      Alert.alert('Incomplete Form', 'Please fill out all fields.');
      return;
    }

    const newApt: Appointment = {
      id: 'apt-' + Math.random().toString(36).substr(2, 9),
      leadName: newLeadName,
      company: newCompany,
      dateTime: newDateTime,
      status: 'SCHEDULED',
      meetingLink: `https://meet.google.com/sp-demo-${newCompany.toLowerCase()}`
    };

    setAppointments(prev => [...prev, newApt]);
    setNewLeadName('');
    setNewCompany('');
    setNewDateTime('');
    setIsAddModalVisible(false);
    Alert.alert('Meeting Scheduled', 'Calendar invitation sent automatically.');
  };

  const handleJoinMeet = (link: string) => {
    Alert.alert('Joining Google Meet', `Connecting you to the live video stream:\n${link}`);
  };

  const handleReschedule = (id: string) => {
    Alert.alert(
      'Reschedule Meeting',
      'Choose a preset fallback date or schedule an automatic calendar proposal.',
      [
        { text: 'Propose Tomorrow', onPress: () => updateMeetingTime(id, 'Tomorrow • 10:00 AM') },
        { text: 'Propose Next Monday', onPress: () => updateMeetingTime(id, 'Next Monday • 2:00 PM') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const updateMeetingTime = (id: string, newTime: string) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, dateTime: newTime } : a));
    Alert.alert('Success', 'Meeting rescheduled. Invitation update dispatched.');
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Upcoming Meetings</Text>
        <TouchableOpacity style={styles.createButton} onPress={() => setIsAddModalVisible(true)}>
          <Text style={styles.createButtonText}>+ SCHEDULE</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scheduleList}>
        {appointments.map((a) => (
          <View key={a.id} style={styles.meetingCard}>
            <View style={styles.meetingHeader}>
              <View>
                <Text style={styles.prospectName}>{a.leadName}</Text>
                <Text style={styles.prospectCompany}>{a.company}</Text>
              </View>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{a.status}</Text>
              </View>
            </View>

            <View style={styles.meetingDetails}>
              <Text style={styles.timeLabel}>Date & Time</Text>
              <Text style={styles.timeVal}>{a.dateTime}</Text>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.rescheduleBtn} onPress={() => handleReschedule(a.id)}>
                <Text style={styles.rescheduleText}>Reschedule</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.joinBtn} onPress={() => handleJoinMeet(a.meetingLink)}>
                <Text style={styles.joinText}>Join Google Meet</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Add Modal */}
      <Modal visible={isAddModalVisible} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Schedule Demo Meeting</Text>

            <Text style={styles.formLabel}>Prospect Name *</Text>
            <TextInput style={styles.formInput} placeholder="e.g. Vijay Shekhar" placeholderTextColor="#64748b" value={newLeadName} onChangeText={setNewLeadName} />

            <Text style={styles.formLabel}>Company *</Text>
            <TextInput style={styles.formInput} placeholder="e.g. Paytm" placeholderTextColor="#64748b" value={newCompany} onChangeText={setNewCompany} />

            <Text style={styles.formLabel}>Date & Time *</Text>
            <TextInput style={styles.formInput} placeholder="e.g. Tomorrow • 11:30 AM" placeholderTextColor="#64748b" value={newDateTime} onChangeText={setNewDateTime} />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelModalButton} onPress={() => setIsAddModalVisible(false)}>
                <Text style={styles.cancelModalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveModalButton} onPress={handleCreateMeeting}>
                <Text style={styles.saveModalButtonText}>Confirm Book</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  createButton: {
    backgroundColor: '#10b981',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  scheduleList: {
    flex: 1,
  },
  meetingCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  meetingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  prospectName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  prospectCompany: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: '800',
  },
  meetingDetails: {
    marginVertical: 14,
  },
  timeLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  timeVal: {
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  rescheduleBtn: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  rescheduleText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '700',
  },
  joinBtn: {
    flex: 1.5,
    backgroundColor: '#10b981',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  joinText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
  },
  formLabel: {
    color: '#cbd5e1',
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
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  cancelModalButton: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  cancelModalButtonText: {
    color: '#cbd5e1',
    fontWeight: '700',
  },
  saveModalButton: {
    flex: 1,
    backgroundColor: '#10b981',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveModalButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
