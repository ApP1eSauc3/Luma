import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  Switch,
} from 'react-native';
import { notificationService } from '../../services/notificationService';
import { useFocusEffect } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import { storageService } from '../../services/storageService';
import { rateService } from '../../services/rateService';
import { RateAlert } from '../../types';
import { CURRENCIES } from '../../utils/currency';

const RateAlertsScreen = () => {
  const [alerts, setAlerts] = useState<RateAlert[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAlert, setEditingAlert] = useState<RateAlert | null>(null);
  const [fromCurrency, setFromCurrency] = useState('CAD');
  const [toCurrency, setToCurrency] = useState('AUD');
  const [targetRate, setTargetRate] = useState('');
  const [currentRate, setCurrentRate] = useState(0);

  const loadAlerts = useCallback(async () => {
    const savedAlerts = await storageService.getAlerts();
    setAlerts(savedAlerts);
  }, []);

  const checkAlerts = useCallback(async () => {
    const hasPermission = await notificationService.requestPermission();
    if (!hasPermission) {
      Alert.alert('Notifications Disabled', 'Please enable notifications in Settings to receive rate alerts.');
      return;
    }
    const savedAlerts = await storageService.getAlerts();
    for (const alert of savedAlerts) {
      if (!alert.isActive) continue;
      try {
        const rate = await rateService.getExchangeRate(alert.fromCurrency, alert.toCurrency);
        const updatedAlert = { ...alert, currentRate: rate };
        await storageService.saveAlert(updatedAlert);
        if (rate >= alert.targetRate) {
          const deactivated = { ...updatedAlert, isActive: false };
          await storageService.saveAlert(deactivated);
          Alert.alert(
            'Rate Alert',
            `${alert.fromCurrency} to ${alert.toCurrency} has reached ${rate.toFixed(4)}!\n\nYour target: ${alert.targetRate.toFixed(4)}\n\nThis alert has been turned off.`,
            [{ text: 'OK' }]
          );
        }
      } catch (error) {
        console.error('Error checking alert:', error);
      }
    }
    await loadAlerts();
  }, [loadAlerts]);

  useFocusEffect(
    useCallback(() => {
      loadAlerts();
      checkAlerts();
    }, [loadAlerts, checkAlerts])
  );

  const fetchCurrentRate = useCallback(async () => {
    try {
      const rate = await rateService.getExchangeRate(fromCurrency, toCurrency);
      setCurrentRate(rate);
    } catch {
      Alert.alert('Error', 'Failed to fetch current rate');
    }
  }, [fromCurrency, toCurrency]);

  useEffect(() => {
    if (modalVisible) fetchCurrentRate();
  }, [fromCurrency, toCurrency, modalVisible, fetchCurrentRate]);

  const handleSaveAlert = async () => {
    if (!targetRate) {
      Alert.alert('Error', 'Please enter a target rate');
      return;
    }
    const alert: RateAlert = {
      id: editingAlert ? editingAlert.id : `alert-${Date.now()}`,
      fromCurrency,
      toCurrency,
      targetRate: parseFloat(targetRate),
      currentRate,
      isActive: true,
      createdAt: editingAlert ? editingAlert.createdAt : new Date().toISOString(),
    };
    try {
      await storageService.saveAlert(alert);
      await loadAlerts();
      resetForm();
      setModalVisible(false);
      Alert.alert('Success', editingAlert ? 'Rate alert updated!' : "Rate alert created! We'll notify you when the rate hits your target.");
    } catch {
      Alert.alert('Error', 'Failed to save alert');
    }
  };

  const handleEditAlert = (alert: RateAlert) => {
    setEditingAlert(alert);
    setFromCurrency(alert.fromCurrency);
    setToCurrency(alert.toCurrency);
    setTargetRate(alert.targetRate.toString());
    setCurrentRate(alert.currentRate);
    setModalVisible(true);
  };

  const handleToggleAlert = async (alert: RateAlert) => {
    const updated = { ...alert, isActive: !alert.isActive };
    await storageService.saveAlert(updated);
    await loadAlerts();
  };

  const handleDeleteAlert = (id: string) => {
    Alert.alert('Delete Alert', 'Are you sure you want to delete this alert?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await storageService.deleteAlert(id);
          await loadAlerts();
        },
      },
    ]);
  };

  const resetForm = () => {
    setEditingAlert(null);
    setFromCurrency('CAD');
    setToCurrency('AUD');
    setTargetRate('');
    setCurrentRate(0);
  };

  const getRateStatus = (alert: RateAlert) => {
    if (alert.currentRate >= alert.targetRate) {
      return { text: 'Target Reached!', color: '#34C759' };
    }
    const percentAway = ((alert.targetRate - alert.currentRate) / alert.currentRate) * 100;
    if (percentAway < 1) {
      return { text: 'Close!', color: '#FFB3D9' };
    }
    return { text: `${percentAway.toFixed(1)}% away`, color: '#7A9BB5' };
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>How Rate Alerts Work</Text>
        <Text style={styles.infoText}>
          Set your target exchange rate and we'll check it regularly. When your target is reached, you'll get notified.
        </Text>
      </View>

      {/* Add Alert Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => { resetForm(); setModalVisible(true); }}
        activeOpacity={0.9}
      >
        <Text style={styles.addButtonText}>Create Rate Alert</Text>
      </TouchableOpacity>

      {/* Alerts List */}
      <View style={styles.alertsSection}>
        {alerts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyText}>No alerts yet</Text>
            <Text style={styles.emptySubtext}>
              Create your first alert to get notified when rates hit your target
            </Text>
          </View>
        ) : (
          alerts.map(alert => {
            const status = getRateStatus(alert);
            return (
              <View key={alert.id} style={styles.alertCard}>
                <View style={styles.alertHeader}>
                  <View style={styles.alertCurrencies}>
                    <Text style={styles.currencyPair}>
                      {CURRENCIES[alert.fromCurrency as keyof typeof CURRENCIES]?.flag}{' '}
                      {alert.fromCurrency} → {alert.toCurrency}{' '}
                      {CURRENCIES[alert.toCurrency as keyof typeof CURRENCIES]?.flag}
                    </Text>
                    <Text style={[styles.status, { color: status.color }]}>
                      {status.text}
                    </Text>
                  </View>
                  <Switch
                    value={alert.isActive}
                    onValueChange={() => handleToggleAlert(alert)}
                    trackColor={{ false: '#FFB3D9', true: '#7A9BB5' }}
                    thumbColor="#fff"
                  />
                </View>

                <View style={styles.alertDetails}>
                  <View style={styles.rateRow}>
                    <Text style={styles.rateLabel}>Target Rate</Text>
                    <Text style={styles.rateValue}>{alert.targetRate.toFixed(4)}</Text>
                  </View>
                  <View style={styles.rateRow}>
                    <Text style={styles.rateLabel}>Current Rate</Text>
                    <Text style={styles.rateValue}>{alert.currentRate.toFixed(4)}</Text>
                  </View>
                </View>

                <View style={styles.alertActions}>
                  <TouchableOpacity style={styles.actionButton} onPress={() => handleEditAlert(alert)} activeOpacity={0.9}>
                    <Text style={styles.actionButtonText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton} onPress={() => handleDeleteAlert(alert.id)} activeOpacity={0.9}>
                    <Text style={styles.actionButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.createdAt}>
                  Created {new Date(alert.createdAt).toLocaleDateString()}
                </Text>
              </View>
            );
          })
        )}
      </View>

      {/* Refresh Button */}
      {alerts.length > 0 && (
        <TouchableOpacity style={styles.refreshButton} onPress={checkAlerts} activeOpacity={0.9}>
          <Text style={styles.refreshButtonText}>Check Alerts</Text>
        </TouchableOpacity>
      )}

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => { setModalVisible(false); resetForm(); }}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingAlert ? 'Edit Alert' : 'Create Alert'}
            </Text>
            <TouchableOpacity onPress={handleSaveAlert}>
              <Text style={styles.saveButton}>
                {editingAlert ? 'Save' : 'Create'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.inputLabel}>From Currency</Text>
            <View style={styles.pickerContainer}>
              <Picker selectedValue={fromCurrency} onValueChange={setFromCurrency}>
                {Object.keys(CURRENCIES).map(code => (
                  <Picker.Item
                    key={code}
                    label={`${CURRENCIES[code as keyof typeof CURRENCIES].flag} ${code} - ${CURRENCIES[code as keyof typeof CURRENCIES].name}`}
                    value={code}
                  />
                ))}
              </Picker>
            </View>

            <Text style={styles.inputLabel}>To Currency</Text>
            <View style={styles.pickerContainer}>
              <Picker selectedValue={toCurrency} onValueChange={setToCurrency}>
                {Object.keys(CURRENCIES).map(code => (
                  <Picker.Item
                    key={code}
                    label={`${CURRENCIES[code as keyof typeof CURRENCIES].flag} ${code} - ${CURRENCIES[code as keyof typeof CURRENCIES].name}`}
                    value={code}
                  />
                ))}
              </Picker>
            </View>

            <View style={styles.currentRateCard}>
              <Text style={styles.currentRateLabel}>Current Rate</Text>
              <Text style={styles.currentRateValue}>
                {currentRate > 0 ? currentRate.toFixed(4) : 'Loading...'}
              </Text>
              <Text style={styles.currentRateSubtext}>
                {currentRate > 0 ? `1 ${fromCurrency} = ${currentRate.toFixed(4)} ${toCurrency}` : 'Fetching rate...'}
              </Text>
            </View>

            <Text style={styles.inputLabel}>Target Rate</Text>
            <TextInput
              style={styles.input}
              value={targetRate}
              onChangeText={setTargetRate}
              keyboardType="numeric"
              placeholder={`e.g., ${(currentRate * 1.02).toFixed(4)}`}
            />
            <Text style={styles.hint}>
              Tip: Set target 1-3% above current rate for realistic goals
            </Text>
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 48,
  },
  infoCard: {
    backgroundColor: '#FFCBA4',
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
    marginTop: 8,
    shadowColor: '#FFB3D9',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.9,
    shadowRadius: 12,
    elevation: 4,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 20,
    opacity: 0.8,
  },
  addButton: {
    backgroundColor: '#FFCBA4',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: '#FFCBA4',
    alignItems: 'center',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 2 },
   shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 24,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  alertsSection: {
    gap: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
  fontSize: 20,
  fontWeight: '600',
  color: '#FFCBA4',
  marginBottom: 8,
},
  emptySubtext: {
    fontSize: 14,
    color: '#7FCBA4',
    opacity: 0.7,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  alertCard: {
    backgroundColor: '#FFCBA4',
    padding: 20,
    borderRadius: 20,
    shadowColor: '#FFB3D9',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.9,
    shadowRadius: 12,
    elevation: 4,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  alertCurrencies: {
    flex: 1,
  },
  currencyPair: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  status: {
    fontSize: 14,
    fontWeight: '500',
  },
  alertDetails: {
    marginBottom: 16,
  },
  rateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  rateLabel: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.7,
  },
  rateValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  alertActions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
  backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 10,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  createdAt: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.5,
    textAlign: 'center',
  },
  refreshButton: {
    backgroundColor: '#FFCBA4',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: '#FFCBA4',
    alignItems: 'center',
    shadowColor: '#FFB3D9',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 3,
    marginTop: 8,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 203, 164, 0.4)',
  },
  cancelButton: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '700',
    backgroundColor: '#FFCBA4',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderRadius: 32,
    borderColor: '#FFCBA4',
    overflow: 'hidden',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFCBA4',
  },
  saveButton: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '700',
    backgroundColor: '#FFCBA4',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderRadius: 32,
    borderColor: '#FFCBA4',
    overflow: 'hidden',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFCBA4',
    marginBottom: 8,
    marginTop: 16,
  },
  pickerContainer: {
    backgroundColor: '#FFCBA4',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#FFB3D9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 2,
  },
  currentRateCard: {
    backgroundColor: '#FFCBA4',
    padding: 20,
    borderRadius: 20,
    marginVertical: 16,
    alignItems: 'center',
    shadowColor: '#FFB3D9',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.9,
    shadowRadius: 12,
    elevation: 4,
  },
  currentRateLabel: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
    marginBottom: 8,
  },
  currentRateValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  currentRateSubtext: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.7,
  },
  input: {
    backgroundColor: '#FFCBA4',
    padding: 16,
    borderRadius: 16,
    fontSize: 16,
    color: '#fff',
    shadowColor: '#FFB3D9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 2,
  },
  hint: {
    fontSize: 12,
    color: '#FFCBA4',
    opacity: 0.6,
    marginTop: 8,
    fontStyle: 'italic',
  },
});

export default RateAlertsScreen;