import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, 
  ActivityIndicator, KeyboardAvoidingView, Platform 
} from 'react-native';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export function AiChatScreen() {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', sender: 'assistant', text: "Hello! I am your SalesPilot AI Assistant. You can speak to me or type commands like: 'Add lead Vijay Shekhar from Paytm', 'What are my meetings today?', or 'Draft follow-up email to Kunal Shah'. How can I help?", timestamp: '10:00 AM' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const handleSendMessage = (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    // Formulate intelligent AI answer
    setTimeout(() => {
      let reply = "I've processed your command. ";
      const command = text.toLowerCase();

      if (command.includes('add lead') || command.includes('create lead')) {
        reply += "I've successfully created a new lead. Vijay Shekhar from Paytm (vijay@paytm.com) has been added to the CRM and queued for email outreach.";
      } else if (command.includes('meetings') || command.includes('calendar')) {
        reply += "You have 3 meetings scheduled for today. First is a Product Demo at 11:30 AM with Cred Labs. Next is Outbound Strategy review at 2:30 PM with Soham.";
      } else if (command.includes('email') || command.includes('follow-up')) {
        reply += "Sure! I have generated an AI follow-up draft. It reads: 'Hi Kunal, Great connecting today. Our automatic dialers can save you up to 20 hrs. Let me know if tomorrow works for a demo.' Would you like me to send this?";
      } else {
        reply += "I can help with SalesPilot automations. I will sync this inquiry with your main SDR dashboard for Soham's review.";
      }

      const aiMsg: Message = {
        id: 'msg-' + Date.now() + '-ai',
        sender: 'assistant',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1500);
  };

  const simulateVoiceDictation = () => {
    setIsListening(true);
    setTimeout(() => {
      setIsListening(false);
      setInputText('Draft follow-up email to Kunal Shah');
    }, 2000);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <View style={styles.syncIndicator}>
        <Text style={styles.syncText}>Gemini AI Co-Pilot Online</Text>
      </View>

      <ScrollView style={styles.messagesContainer} contentContainerStyle={styles.scrollContent}>
        {messages.map((m) => (
          <View 
            key={m.id} 
            style={[
              styles.messageBubble,
              m.sender === 'user' ? styles.userBubble : styles.assistantBubble
            ]}
          >
            <Text style={m.sender === 'user' ? styles.userText : styles.assistantText}>
              {m.text}
            </Text>
            <Text style={styles.timestamp}>{m.timestamp}</Text>
          </View>
        ))}

        {isTyping && (
          <View style={[styles.messageBubble, styles.assistantBubble, styles.typingBubble]}>
            <ActivityIndicator size="small" color="#10b981" />
            <Text style={styles.typingText}>SDR Assistant is writing...</Text>
          </View>
        )}
      </ScrollView>

      {/* Suggested quick pills */}
      <View style={styles.suggestionsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['/add-lead Paytm', '/my-meetings', '/ai-email Kunal'].map((pill) => (
            <TouchableOpacity 
              key={pill} 
              style={styles.pill} 
              onPress={() => handleSendMessage(pill)}
            >
              <Text style={styles.pillText}>{pill}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Input panel */}
      <View style={styles.inputArea}>
        <TouchableOpacity 
          style={[styles.micButton, isListening && styles.micActive]} 
          onPress={simulateVoiceDictation}
        >
          <Text style={styles.micButtonText}>{isListening ? '🎙️' : '🎤'}</Text>
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder={isListening ? "Listening with voice dictation..." : "Ask your SalesPilot AI Agent..."}
          placeholderTextColor="#64748b"
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={() => handleSendMessage(inputText)}
        />

        <TouchableOpacity 
          style={styles.sendButton} 
          onPress={() => handleSendMessage(inputText)}
        >
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  syncIndicator: {
    backgroundColor: '#1e293b',
    paddingVertical: 6,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#334155',
  },
  syncText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  messageBubble: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    maxWidth: '85%',
  },
  userBubble: {
    backgroundColor: '#10b981',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 2,
  },
  assistantBubble: {
    backgroundColor: '#1e293b',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: '#334155',
  },
  userText: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  assistantText: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  timestamp: {
    color: '#64748b',
    fontSize: 9,
    marginTop: 6,
    alignSelf: 'flex-end',
    fontWeight: '600',
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typingText: {
    color: '#94a3b8',
    fontSize: 12,
  },
  suggestionsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#0f172a',
  },
  pill: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  pillText: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  inputArea: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#1e293b',
    borderTopWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    gap: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
  },
  micButton: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  micActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: '#ef4444',
  },
  micButtonText: {
    fontSize: 18,
  },
  input: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    color: '#ffffff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sendButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    height: 44,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
});
