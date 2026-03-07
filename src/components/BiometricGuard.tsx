import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Vibration,
} from 'react-native';
import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';
import * as Keychain from 'react-native-keychain';

const rnBiometrics = new ReactNativeBiometrics({
  allowDeviceCredentials: true,
});

const MAX_ATTEMPTS = 5;
const KEYCHAIN_SERVICE = 'com.vault.passcode';

const BiometricGuard = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPasscodeFallback, setShowPasscodeFallback] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [biometryType, setBiometryType] = useState<string | null>(null);

  
  useEffect(() => {
    rnBiometrics.isSensorAvailable().then(({ biometryType: detectedType }) => {
      setBiometryType(detectedType ?? null);
    });
  }, []);

  const biometryLabel = biometryType === BiometryTypes.FaceID ? 'Face ID' : 'Touch ID';

  
  const verifyPasscode = useCallback(async (entered: string) => {
    try {
      const credentials = await Keychain.getGenericPassword({
        service: KEYCHAIN_SERVICE,
      });

      if (!credentials) {
        Alert.alert('No Passcode Set', 'Please set up a passcode in Settings.');
        setPasscodeInput('');
        return;
      }

      if (entered === credentials.password) {
        setIsAuthenticated(true);
      } else {
        Vibration.vibrate(400);
        setAttempts(prev => {
          const newAttempts = prev + 1;
          if (newAttempts >= MAX_ATTEMPTS) {
            Alert.alert(
              'Too Many Attempts',
              'Vault has been locked. Please restart the app.',
              [{ text: 'OK' }],
            );
          } else {
            Alert.alert(
              'Incorrect Passcode',
              `${MAX_ATTEMPTS - newAttempts} attempt${MAX_ATTEMPTS - newAttempts === 1 ? '' : 's'} remaining.`,
            );
          }
          return newAttempts;
        });
        setPasscodeInput('');
      }
    } catch (error) {
      console.error('Keychain error:', error);
      Alert.alert('Error', 'Could not verify passcode. Please try again.');
      setPasscodeInput('');
    }
  }, []); 

  const handlePasscodeInput = useCallback(
    (digit: string) => {
      const next = passcodeInput + digit;
      setPasscodeInput(next);

      if (next.length === 4) {
        verifyPasscode(next);
      }
    },
    [passcodeInput, verifyPasscode],
  );

  const authenticate = useCallback(async () => {
    try {
      const { available } = await rnBiometrics.isSensorAvailable();

      if (!available) {
        setShowPasscodeFallback(true);
        return;
      }

      const { success } = await rnBiometrics.simplePrompt({
        promptMessage: 'Confirm identity to view Vault',
        
        cancelButtonText: 'Use Passcode', // Android only
      });

      if (success) {
        setIsAuthenticated(true);
      } else {
        setShowPasscodeFallback(true);
      }
    } catch (error) {
      console.error('Biometric error:', error);
      setShowPasscodeFallback(true);
    }
  }, []);

  useEffect(() => {
    authenticate();
  }, [authenticate]);

  if (!isAuthenticated && showPasscodeFallback) {
    const isLocked = attempts >= MAX_ATTEMPTS;

    return (
      <View style={styles.lockedContainer}>
        <Text style={styles.lockIcon}>🔒</Text>
        <Text style={styles.vaultLabel}>Enter Passcode</Text>
        <Text style={styles.vaultSub}>
          {isLocked
            ? 'Vault locked — restart to try again'
            : 'Enter your 4-digit passcode'}
        </Text>

        <View style={styles.dotsRow}>
          {[0, 1, 2, 3].map(i => (
            <View
              key={i}
              style={[styles.dot, passcodeInput.length > i && styles.dotFilled]}
            />
          ))}
        </View>

        {!isLocked && (
          <View style={styles.numpad}>
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map(
              (key, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.numKey, key === '' && styles.numKeyEmpty]}
                  disabled={key === '' || isLocked}
                  onPress={() => {
                    if (key === '⌫') {
                      setPasscodeInput(p => p.slice(0, -1));
                    } else {
                      handlePasscodeInput(key);
                    }
                  }}
                >
                  <Text style={styles.numKeyText}>{key}</Text>
                </TouchableOpacity>
              ),
            )}
          </View>
        )}

        {!isLocked && biometryType && (
          <TouchableOpacity
            onPress={() => {
              setShowPasscodeFallback(false);
              setPasscodeInput('');
              authenticate();
            }}>
            <Text style={styles.switchLink}>Use {biometryLabel} instead</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }


  if (!isAuthenticated) {
    return (
      <View style={styles.lockedContainer}>
        <Text style={styles.lockIcon}>🔒</Text>
        <Text style={styles.vaultLabel}>Vault Secured</Text>
        <Text style={styles.vaultSub}>Biometric authentication required</Text>
        <TouchableOpacity style={styles.authButton} onPress={authenticate}>
          <Text style={styles.authButtonText}>
            Unlock with {biometryType ? biometryLabel : 'Biometrics'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowPasscodeFallback(true)}>
          <Text style={styles.switchLink}>Use Passcode instead</Text>
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
    marginBottom: 32,
    opacity: 0.8,
    textAlign: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 40,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#7A9BB5',
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: '#7A9BB5',
  },
  numpad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: 280,
    gap: 12,
    marginBottom: 32,
  },
  numKey: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  numKeyEmpty: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  numKeyText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#7A9BB5',
  },
  authButton: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    marginBottom: 20,
  },
  authButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  switchLink: {
    fontSize: 14,
    color: '#7A9BB5',
    fontWeight: '600',
    textDecorationLine: 'underline',
    marginTop: 8,
  },
});

export default BiometricGuard;