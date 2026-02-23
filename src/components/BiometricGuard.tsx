import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import ReactNativeBiometrics from 'react-native-biometrics';

const rnBiometrics = new ReactNativeBiometrics();

const BiometricGuard = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const authenticate = useCallback(async () => {
    try {
      const { available } = await rnBiometrics.isSensorAvailable();
      if (!available) {
        setIsAuthenticated(true);
        return;
      }
      const { success } = await rnBiometrics.simplePrompt({
        promptMessage: 'Confirm identity to view Vault',
      });
      if (success) {
        setIsAuthenticated(true);
      } else {
        Alert.alert("Locked", "Authentication required to access bank details.");
      }
    } catch (error) {
      console.error('Biometric error:', error);
      if (__DEV__) {
        setIsAuthenticated(true);
      } else {
        Alert.alert('Error', 'Authentication failed. Please try again.');
      }
    }
  }, []);

  useEffect(() => { authenticate(); }, [authenticate]);

  if (!isAuthenticated) {
    return (
      <View style={styles.lockedContainer}>
        <Text style={styles.lockIcon}>🔒</Text>
        <Text style={styles.vaultLabel}>Vault Secured</Text>
        <Text style={styles.vaultSub}>Biometric authentication required</Text>
        <TouchableOpacity style={styles.authButton} onPress={authenticate}>
          <Text style={styles.authButtonText}>Unlock App</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  lockedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFCBA4',
    paddingHorizontal: 24,
  },
  lockIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  vaultLabel: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#7A9BB5',
    marginBottom: 8,
  },
  vaultSub: {
    fontSize: 15,
    color: '#7A9BB5',
    fontWeight: '500',
    marginBottom: 48,
    opacity: 0.8,
  },
  authButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  authButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
});

export default BiometricGuard;