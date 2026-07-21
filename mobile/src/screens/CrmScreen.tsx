import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, 
  Alert, Modal, FlatList, Switch 
} from 'react-native';
import { OfflineStorage } from '../services/storage';

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  company: string;
  phone: string;
  email: string;
  status: string;
  notes: string;
}

export function CrmScreen() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  
  // Modal states
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // New Lead Form States
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('NEW');
  const [notes, setNotes] = useState('');

  const defaultLeads: Lead[] = [
    { id: 'lead-1', firstName: 'Vijay', lastName: 'Shekhar', company: 'Paytm', phone: '+91 98765 43210', email: 'vijay@paytm.com', status: 'QUALIFIED', notes: 'Interested in the full automated AI outbound dialer suite.' },
    { id: 'lead-2', firstName: 'Kunal', lastName: 'Shah', company: 'Cred', phone: '+91 99999 88888', email: 'kunal@cred.club', status: 'MEETING_BOOKED', notes: 'Scheduled demo for tomorrow. Wants custom CRM API integration.' },
    { id: 'lead-3', firstName: 'Nithin', lastName: 'Kamath', company: 'Zerodha', phone: '+91 95555 44444', email: 'nithin@zerodha.tech', status: 'NEW', notes: 'Cold sign-up from website widget.' },
    { id: 'lead-4', firstName: 'Ritesh', lastName: 'Agarwal', company: 'Oyo Rooms', phone: '+91 91111 22222', email: 'ritesh@oyo.in', status: 'OUTREACH', notes: 'AI Email sequence started yesterday.' }
  ];

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    const cached = await OfflineStorage.getLeads();
    if (cached && cached.length > 0) {
      setLeads(cached);
    } else {
      setLeads(defaultLeads);
      await OfflineStorage.saveLeads(defaultLeads);
    }
  };

  const handleCreateLead = async () => {
    if (!firstName || !lastName || !company || !email) {
      Alert.alert('Required Fields', 'First Name, Last Name, Company and Email are mandatory.');
      return;
    }

    const newLead: Lead = {
      id: 'lead-' + Math.random().toString(36).substr(2, 9),
      firstName,
      lastName,
      company,
      phone: phone || '+91 99999 55555',
      email,
      status,
      notes: notes || 'No initial notes.'
    };

    const updatedLeads = [newLead, ...leads];
    setLeads(updatedLeads);
    await OfflineStorage.saveLeads(updatedLeads);

    // Save transaction to Offline outbox queue
    await OfflineStorage.addToSyncQueue('CREATE_LEAD', newLead);

    // Reset Form
    setFirstName('');
    setLastName('');
    setCompany('');
    setPhone('');
    setEmail('');
    setStatus('NEW');
    setNotes('');
    setIsAddModalVisible(false);

    Alert.alert('Lead Saved', 'Lead created locally. Sync outbox queue updated.');
  };

  const handleDeleteLead = async (id: string) => {
    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete this lead from local memory?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            const filtered = leads.filter(l => l.id !== id);
            setLeads(filtered);
            await OfflineStorage.saveLeads(filtered);
            setIsDetailModalVisible(false);
          }
        }
      ]
    );
  };

  const filteredLeads = leads.filter(l => {
    const matchesSearch = `${l.firstName} ${l.lastName} ${l.company}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'ALL' || l.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <View style={styles.container}>
      {/* Top Search bar */}
      <View style={styles.searchSection}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search leads, companies..."
          placeholderTextColor="#64748b"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity style={styles.addButton} onPress={() => setIsAddModalVisible(true)}>
          <Text style={styles.addButtonText}>+ ADD</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['ALL', 'NEW', 'OUTREACH', 'QUALIFIED', 'MEETING_BOOKED'].map((statusTab) => (
            <TouchableOpacity
              key={statusTab}
              style={[
                styles.tabPill,
                selectedStatus === statusTab && styles.activeTabPill
              ]}
              onPress={() => setSelectedStatus(statusTab)}
            >
              <Text style={[
                styles.tabText,
                selectedStatus === statusTab && styles.activeTabText
              ]}>
                {statusTab.replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* CRM Leads List */}
      <FlatList
        data={filteredLeads}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.leadCard}
            onPress={() => {
              setSelectedLead(item);
              setIsDetailModalVisible(true);
            }}
          >
            <View style={styles.leadInfo}>
              <Text style={styles.leadName}>{item.firstName} {item.lastName}</Text>
              <Text style={styles.leadMeta}>{item.company} • {item.email}</Text>
            </View>
            <View style={[
              styles.statusTag,
              item.status === 'QUALIFIED' && styles.statusQualified,
              item.status === 'MEETING_BOOKED' && styles.statusMeeting,
              item.status === 'OUTREACH' && styles.statusOutreach
            ]}>
              <Text style={styles.statusText}>{item.status.replace('_', ' ')}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No leads match your filter</Text>
          </View>
        }
      />

      {/* Add Lead Popup Modal */}
      <Modal visible={isAddModalVisible} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New CRM Lead</Text>

            <Text style={styles.formLabel}>First Name *</Text>
            <TextInput style={styles.formInput} placeholder="e.g. Vijay" placeholderTextColor="#64748b" value={firstName} onChangeText={setFirstName} />

            <Text style={styles.formLabel}>Last Name *</Text>
            <TextInput style={styles.formInput} placeholder="e.g. Shekhar" placeholderTextColor="#64748b" value={lastName} onChangeText={setLastName} />

            <Text style={styles.formLabel}>Company Name *</Text>
            <TextInput style={styles.formInput} placeholder="e.g. Paytm" placeholderTextColor="#64748b" value={company} onChangeText={setCompany} />

            <Text style={styles.formLabel}>Phone Number</Text>
            <TextInput style={styles.formInput} placeholder="e.g. +91 98765 43210" placeholderTextColor="#64748b" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

            <Text style={styles.formLabel}>Email Address *</Text>
            <TextInput style={styles.formInput} placeholder="e.g. vijay@paytm.com" placeholderTextColor="#64748b" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />

            <Text style={styles.formLabel}>Initial Notes</Text>
            <TextInput style={[styles.formInput, { height: 80 }]} placeholder="Add details or context..." placeholderTextColor="#64748b" multiline value={notes} onChangeText={setNotes} />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelModalButton} onPress={() => setIsAddModalVisible(false)}>
                <Text style={styles.cancelModalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveModalButton} onPress={handleCreateLead}>
                <Text style={styles.saveModalButtonText}>Save Lead</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Detail & Action View Modal */}
      <Modal visible={isDetailModalVisible} animationType="fade" transparent>
        <View style={styles.modalBg}>
          <View style={styles.detailContent}>
            {selectedLead && (
              <>
                <Text style={styles.detailName}>{selectedLead.firstName} {selectedLead.lastName}</Text>
                <Text style={styles.detailCompany}>{selectedLead.company}</Text>

                <View style={styles.divider} />

                <Text style={styles.detailLabel}>Email</Text>
                <Text style={styles.detailVal}>{selectedLead.email}</Text>

                <Text style={styles.detailLabel}>Phone</Text>
                <Text style={styles.detailVal}>{selectedLead.phone}</Text>

                <Text style={styles.detailLabel}>Lead Status</Text>
                <Text style={styles.detailVal}>{selectedLead.status}</Text>

                <Text style={styles.detailLabel}>Notes</Text>
                <Text style={styles.detailVal}>{selectedLead.notes}</Text>

                <View style={styles.divider} />

                <View style={styles.detailButtons}>
                  <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteLead(selectedLead.id)}>
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.closeDetailButton} onPress={() => setIsDetailModalVisible(false)}>
                    <Text style={styles.closeDetailButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
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
  searchSection: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    color: '#ffffff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  addButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 12,
  },
  tabsContainer: {
    marginBottom: 16,
    height: 40,
  },
  tabPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#334155',
    justifyContent: 'center',
  },
  activeTabPill: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  tabText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
  },
  activeTabText: {
    color: '#ffffff',
  },
  leadCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leadInfo: {
    flex: 1,
    marginRight: 12,
  },
  leadName: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  leadMeta: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 4,
  },
  statusTag: {
    backgroundColor: '#475569',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusQualified: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  statusMeeting: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.4)',
  },
  statusOutreach: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  statusText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 20,
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
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 20,
    marginBottom: 40,
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
  detailContent: {
    backgroundColor: '#1e293b',
    borderRadius: 24,
    padding: 24,
    margin: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  detailName: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
  },
  detailCompany: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 16,
  },
  detailLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 10,
  },
  detailVal: {
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  detailButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#ef4444',
    fontWeight: '700',
  },
  closeDetailButton: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeDetailButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
