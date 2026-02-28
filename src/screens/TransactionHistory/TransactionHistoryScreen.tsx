import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import { storageService } from '../../services/storageService';
import { Transaction } from '../../types';
import { CURRENCIES, formatCurrency } from '../../utils/currency';

const TransactionHistoryScreen = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [fromCurrency, setFromCurrency] = useState('CAD');
  const [toCurrency, setToCurrency] = useState('AUD');
  const [amount, setAmount] = useState('');
  const [rate, setRate] = useState('');
  const [provider, setProvider] = useState('wise');

  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [])
  );

  const loadTransactions = async () => {
    const saved = await storageService.getTransactions();
    setTransactions(saved);
  };

  const handleSaveTransaction = async () => {
    if (!amount || !rate) {
      Alert.alert('Error', 'Please fill in amount and rate');
      return;
    }
    const transaction: Transaction = {
      id: `tx-${Date.now()}`,
      date: new Date().toISOString(),
      from: fromCurrency,
      to: toCurrency,
      amount: parseFloat(amount),
      rate: parseFloat(rate),
      provider,
      status: 'completed',
    };
    try {
      await storageService.saveTransaction(transaction);
      await loadTransactions();
      resetForm();
      setModalVisible(false);
    } catch {
      Alert.alert('Error', 'Failed to save transaction');
    }
  };

  const resetForm = () => {
    setFromCurrency('CAD');
    setToCurrency('AUD');
    setAmount('');
    setRate('');
    setProvider('wise');
  };

  const getProviderName = (prov: string) => {
    switch (prov) {
      case 'wise': return 'Wise';
      case 'revolut': return 'Revolut';
      case 'bank': return 'Bank';
      case 'ofx': return 'OFX';
      default: return prov;
    }
  };

  const calculateReceived = (tx: Transaction) => tx.amount * tx.rate;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Transaction Summary</Text>
        <Text style={styles.summaryValue}>{transactions.length}</Text>
        <Text style={styles.summaryLabel}>Total Transfers</Text>
      </View>

      {/* Add Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => { resetForm(); setModalVisible(true); }}
        activeOpacity={0.9}
      >
        <Text style={styles.addButtonText}>Log Transfer</Text>
      </TouchableOpacity>

      {/* Transactions List */}
      <View style={styles.transactionsSection}>
        {transactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No transactions yet</Text>
            <Text style={styles.emptySubtext}>
              Start logging your transfers to track your history
            </Text>
          </View>
        ) : (
          transactions.map(tx => (
            <View key={tx.id} style={styles.txCard}>
              <View style={styles.txHeader}>
                <View style={styles.txCurrencies}>
                  <Text style={styles.txPair}>
                    {CURRENCIES[tx.from as keyof typeof CURRENCIES]?.flag}{' '}
                    {tx.from} → {tx.to}{' '}
                    {CURRENCIES[tx.to as keyof typeof CURRENCIES]?.flag}
                  </Text>
                  <Text style={styles.txDate}>
                    {new Date(tx.date).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.providerBadge}>
                  <Text style={styles.providerText}>
                    {getProviderName(tx.provider)}
                  </Text>
                </View>
              </View>

              <View style={styles.txDetails}>
                <View style={styles.txRow}>
                  <Text style={styles.txLabel}>Sent</Text>
                  <Text style={styles.txValue}>
                    {formatCurrency(tx.amount, tx.from)} {tx.from}
                  </Text>
                </View>
                <View style={styles.txRow}>
                  <Text style={styles.txLabel}>Rate</Text>
                  <Text style={styles.txValue}>{tx.rate.toFixed(4)}</Text>
                </View>
                <View style={styles.txRow}>
                  <Text style={styles.txLabel}>Received</Text>
                  <Text style={[styles.txValue, styles.receivedValue]}>
                    {formatCurrency(calculateReceived(tx), tx.to)} {tx.to}
                  </Text>
                </View>
              </View>

              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{tx.status}</Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => { setModalVisible(false); resetForm(); }}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Log Transfer</Text>
            <TouchableOpacity onPress={handleSaveTransaction}>
              <Text style={styles.saveButton}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.inputLabel}>From Currency</Text>
            <View style={styles.pickerContainer}>
              <Picker selectedValue={fromCurrency} onValueChange={setFromCurrency}>
                {Object.keys(CURRENCIES).map(code => (
                  <Picker.Item
                    key={code}
                    label={`${CURRENCIES[code as keyof typeof CURRENCIES].flag} ${code}`}
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
                    label={`${CURRENCIES[code as keyof typeof CURRENCIES].flag} ${code}`}
                    value={code}
                  />
                ))}
              </Picker>
            </View>

            <Text style={styles.inputLabel}>Amount Sent</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="1000.00"
            />

            <Text style={styles.inputLabel}>Exchange Rate</Text>
            <TextInput
              style={styles.input}
              value={rate}
              onChangeText={setRate}
              keyboardType="numeric"
              placeholder="1.0845"
            />

            <Text style={styles.inputLabel}>Provider</Text>
            <View style={styles.pickerContainer}>
              <Picker selectedValue={provider} onValueChange={setProvider}>
                <Picker.Item label="Wise" value="wise" />
                <Picker.Item label="Revolut" value="revolut" />
                <Picker.Item label="OFX" value="ofx" />
                <Picker.Item label="Bank" value="bank" />
              </Picker>
            </View>

            {amount && rate && (
              <View style={styles.previewCard}>
                <Text style={styles.previewLabel}>You'll receive</Text>
                <Text style={styles.previewValue}>
                  {formatCurrency(parseFloat(amount) * parseFloat(rate), toCurrency)} {toCurrency}
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    padding: 16,
    paddingTop: 24,
    paddingBottom: 48,
  },
  summaryCard: {
    backgroundColor: '#FFCBA4',
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#FFB3D9',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.9,
    shadowRadius: 12,
    elevation: 4,
  },
  summaryTitle: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#7A9BB5',
    opacity: 0.7,
  },
  addButton: {
    backgroundColor: '#FFCBA4',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: '#FFCBA4',
    alignItems: 'center',
    elevation: 3,
    marginBottom: 24,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  transactionsSection: {
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
    color: '#FFCBA4',
    opacity: 0.7,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  txCard: {
    backgroundColor: '#FFCBA4',
    padding: 20,
    borderRadius: 20,
    shadowColor: '#FFB3D9',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.9,
    shadowRadius: 12,
    elevation: 4,
  },
  txHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  txCurrencies: {
    flex: 1,
  },
  txPair: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  txDate: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.6,
  },
  providerBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    alignSelf: 'flex-start',
  },
  providerText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  txDetails: {
    marginBottom: 12,
  },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  txLabel: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.7,
  },
  txValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  receivedValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  statusBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 8,
    borderRadius: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
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
  previewCard: {
    backgroundColor: '#FFCBA4',
    padding: 20,
    borderRadius: 20,
    marginTop: 24,
    alignItems: 'center',
    shadowColor: '#FFB3D9',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.9,
    shadowRadius: 12,
    elevation: 4,
  },
  previewLabel: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
    marginBottom: 8,
  },
  previewValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default TransactionHistoryScreen;