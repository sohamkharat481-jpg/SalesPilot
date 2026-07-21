import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Image, ActivityIndicator } from 'react-native';
import { OfflineStorage } from '../services/storage';

export function ScannerScreen() {
  const [activeTab, setActiveTab] = useState<'card' | 'qr'>('card');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any | null>(null);

  const simulateCardScan = () => {
    setIsScanning(true);
    setScanResult(null);

    // Simulate camera taking picture & Gemini OCR text parsing
    setTimeout(async () => {
      setIsScanning(false);
      const parsedCard = {
        name: 'Nithin Kamath',
        company: 'Zerodha',
        email: 'nithin@zerodha.tech',
        phone: '+91 95555 44444',
        role: 'Co-Founder & CEO'
      };
      setScanResult(parsedCard);

      // Save to CRM Leads Cache!
      const currentLeads = await OfflineStorage.getLeads();
      const newLead = {
        id: 'lead-' + Math.random().toString(36).substr(2, 9),
        firstName: parsedCard.name.split(' ')[0],
        lastName: parsedCard.name.split(' ')[1] || '',
        company: parsedCard.company,
        phone: parsedCard.phone,
        email: parsedCard.email,
        status: 'NEW',
        notes: `Extracted via Business Card Camera Scanner. Position: ${parsedCard.role}.`
      };

      const updatedLeads = [newLead, ...currentLeads];
      await OfflineStorage.saveLeads(updatedLeads);
      await OfflineStorage.addToSyncQueue('CREATE_LEAD', newLead);

      Alert.alert(
        'Card Scan Successful', 
        `Extracted details:\nName: ${parsedCard.name}\nCompany: ${parsedCard.company}\nEmail: ${parsedCard.email}\n\nLead has been injected into CRM and queued for outbox sync.`
      );
    }, 2500);
  };

  const simulateQrScan = () => {
    setIsScanning(true);
    setScanResult(null);

    setTimeout(() => {
      setIsScanning(false);
      Alert.alert(
        'QR Code Scanned',
        'SalesPilot CRM Deep Link Detected:\nlead-id: lead-kunal-shah-cred\nAction: Opening lead profile.'
      );
    }, 1500);
  };

  return (
    <View style={styles.container}>
      {/* Scanner Mode Switcher */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'card' && styles.activeTabBtn]} 
          onPress={() => { setActiveTab('card'); setScanResult(null); }}
        >
          <Text style={[styles.tabText, activeTab === 'card' && styles.activeTabText]}>Business Card Scanner</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'qr' && styles.activeTabBtn]} 
          onPress={() => { setActiveTab('qr'); setScanResult(null); }}
        >
          <Text style={[styles.tabText, activeTab === 'qr' && styles.activeTabText]}>QR Code Scanner</Text>
        </TouchableOpacity>
      </View>

      {/* Simulator camera viewfinder view */}
      <View style={styles.viewfinderContainer}>
        <View style={styles.cameraFrame}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />

          {isScanning ? (
            <View style={styles.scanningOverlay}>
              <ActivityIndicator size="large" color="#10b981" />
              <Text style={styles.scanningText}>
                {activeTab === 'card' ? 'Extracting card text with AI...' : 'Aligning QR code...'}
              </Text>
              <View style={styles.laserLine} />
            </View>
          ) : (
            <View style={styles.idleViewfinder}>
              <Text style={styles.viewfinderInstruction}>
                {activeTab === 'card' 
                  ? 'Center the physical business card inside the brackets' 
                  : 'Place the contact QR code in focus'
                }
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Capture Button */}
      <View style={styles.controls}>
        <TouchableOpacity 
          style={[styles.captureBtn, isScanning && styles.disabledBtn]} 
          onPress={activeTab === 'card' ? simulateCardScan : simulateQrScan}
          disabled={isScanning}
        >
          <Text style={styles.captureBtnText}>
            {isScanning ? 'Processing...' : 'Capture & Scan'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* OCR scan results feedback */}
      {scanResult && (
        <View style={styles.resultsBox}>
          <Text style={styles.resultsTitle}>Extracted AI CRM Lead</Text>
          <Text style={styles.resultsRow}>Name: <Text style={styles.resultsVal}>{scanResult.name}</Text></Text>
          <Text style={styles.resultsRow}>Role: <Text style={styles.resultsVal}>{scanResult.role}</Text></Text>
          <Text style={styles.resultsRow}>Company: <Text style={styles.resultsVal}>{scanResult.company}</Text></Text>
          <Text style={styles.resultsRow}>Email: <Text style={styles.resultsVal}>{scanResult.email}</Text></Text>
          <Text style={styles.resultsRow}>Phone: <Text style={styles.resultsVal}>{scanResult.phone}</Text></Text>
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
    justifyContent: 'space-between',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTabBtn: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
  },
  tabText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
  },
  activeTabText: {
    color: '#10b981',
  },
  viewfinderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  cameraFrame: {
    width: '100%',
    height: 240,
    backgroundColor: '#1e293b',
    borderRadius: 24,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#10b981',
  },
  topLeft: {
    top: 20,
    left: 20,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: 20,
    right: 20,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: 20,
    left: 20,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: 20,
    right: 20,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  idleViewfinder: {
    padding: 30,
    alignItems: 'center',
  },
  viewfinderInstruction: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
  },
  scanningOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanningText: {
    color: '#10b981',
    fontWeight: '700',
    fontSize: 13,
    marginTop: 12,
  },
  laserLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#10b981',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    top: '50%',
  },
  controls: {
    marginVertical: 16,
  },
  captureBtn: {
    backgroundColor: '#10b981',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  disabledBtn: {
    backgroundColor: '#475569',
  },
  captureBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  resultsBox: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 10,
  },
  resultsTitle: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  resultsRow: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  resultsVal: {
    color: '#ffffff',
    fontWeight: '600',
  },
});
