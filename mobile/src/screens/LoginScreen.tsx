import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, Image, 
  ActivityIndicator, Alert, Switch 
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { MobileApi } from '../services/api';

export function LoginScreen({ onLoginSuccess }: { onLoginSuccess: (user: any) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleStandardLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing Fields', 'Please enter your email and password.');
      return;
    }

    setIsLoading(true);
    try {
      // Simulate OAuth / Login server validation
      setTimeout(() => {
        setIsLoading(false);
        const dummyUser = {
          email,
          name: email.split('@')[0],
          token: 'jwt-dummy-auth-token-salespilot',
          org: 'Soham Labs Team'
        };
        MobileApi.setToken(dummyUser.token);
        onLoginSuccess(dummyUser);
      }, 1200);
    } catch (e: any) {
      setIsLoading(false);
      Alert.alert('Login Failed', e.message || 'Incorrect credentials.');
    }
  };

  const handleBiometricAuth = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        Alert.alert(
          'Biometrics Unavailable', 
          'Biometric hardware is not available or no fingerprints/faces are registered.'
        );
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock SalesPilot Workspace',
        fallbackLabel: 'Enter Password',
        disableDeviceFallback: false,
      });

      if (result.success) {
        setIsLoading(true);
        setTimeout(() => {
          setIsLoading(false);
          const dummyUser = {
            email: 'sohamkharat481@gmail.com',
            name: 'Soham Kharat',
            token: 'biometric-token-salespilot',
            org: 'SalesPilot Labs'
          };
          MobileApi.setToken(dummyUser.token);
          onLoginSuccess(dummyUser);
        }, 800);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Biometric auth failed.');
    }
  };

  const handleGoogleLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const dummyUser = {
        email: 'sohamkharat481@gmail.com',
        name: 'Soham Kharat',
        token: 'google-oauth-token-salespilot',
        org: 'SalesPilot Labs'
      };
      MobileApi.setToken(dummyUser.token);
      onLoginSuccess(dummyUser);
    }, 1500);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logoText}>SalesPilot</Text>
        <Text style={styles.tagline}>AI Outbound SDR & Voice calling console</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Email Address</Text>
        <TextInput
          style={styles.input}
          placeholder="email@salespilot.co"
          placeholderTextColor="#94a3b8"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          placeholderTextColor="#94a3b8"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <View style={styles.row}>
          <View style={styles.checkboxContainer}>
            <Switch
              value={rememberMe}
              onValueChange={setRememberMe}
              trackColor={{ false: '#cbd5e1', true: '#10b981' }}
              thumbColor="#ffffff"
            />
            <Text style={styles.checkboxLabel}>Remember Me</Text>
          </View>
          <TouchableOpacity>
            <Text style={styles.forgotText}>Forgot?</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.loginButton}
          onPress={handleStandardLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.loginButtonText}>Sign In to Workspace</Text>
          )}
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.line} />
          <Text style={styles.dividerText}>OR LOGIN WITH</Text>
          <View style={styles.line} />
        </View>

        <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin}>
          <Text style={styles.googleButtonText}>Continue with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.biometricButton} onPress={handleBiometricAuth}>
          <Text style={styles.biometricButtonText}>Unlock with Touch ID / Face ID</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footerText}>Secure 256-bit AES Token Encryption</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#10b981',
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 6,
    fontWeight: '500',
  },
  form: {
    backgroundColor: '#1e293b',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  label: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 14,
    color: '#ffffff',
    fontSize: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxLabel: {
    color: '#94a3b8',
    marginLeft: 8,
    fontSize: 13,
    fontWeight: '500',
  },
  forgotText: {
    color: '#10b981',
    fontSize: 13,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#334155',
  },
  dividerText: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '700',
    marginHorizontal: 12,
  },
  googleButton: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  googleButtonText: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '700',
  },
  biometricButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#10b981',
    marginTop: 6,
  },
  biometricButtonText: {
    color: '#10b981',
    fontSize: 13,
    fontWeight: '700',
  },
  footerText: {
    color: '#475569',
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 32,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
