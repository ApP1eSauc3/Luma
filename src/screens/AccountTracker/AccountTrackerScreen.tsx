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
import Clipboard from '@react-native-clipboard/clipboard';
import { useFocusEffect } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import { storageService } from '../../services/storageService';
import { rateService } from '../../services/rateService';
import { Account, BankDetail } from '../../types';
import { CURRENCIES, formatCurrency, convertCurrency } from '../../utils/currency';

const AccountTrackerScreen = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [vaultDetails, setVaultDetails] = useState<BankDetail[]>([]);
  const [totalInAUD, setTotalInAUD] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [accountModalVisible, setAccountModalVisible] = useState(false);
  const [vaultModalVisible, setVaultModalVisible] = useState(false);
  const [accountName, setAccountName] = useState('');
  const [balance, setBalance] = useState('');
  const [currency, setCurrency] = useState('AUD');
  const [country, setCountry] = useState('Australia');
  const [accountType, setAccountType] = useState<'bank' | 'wise' | 'revolut' | 'other'>('bank');
  const [vaultLabel, setVaultLabel] = useState('');
  const [vaultAccNumber, setVaultAccNumber] = useState('');
  const [vaultBSB, setVaultBSB] = useState('');
  const [vaultTransit, setVaultTransit] = useState('');
  const [vaultCurrency, setVaultCurrency] = useState<'AUD' | 'CAD'>('AUD');

  const calculateTotal = useCallback(async (list: Account[]) => {
    setIsCalculating(true);
    let total = 0;
    for (const acc of list) {
      if (acc.currency === 'AUD') {
        total += acc.balance;
      } else {
        try {
          const rate = await rateService.getExchangeRate(acc.currency, 'AUD');
          total += convertCurrency(acc.balance, rate);
        } catch (error) {
          console.error('Error converting:', error);
        }
      }
    }
    setTotalInAUD(total);
    setIsCalculating(false);
  }, []);

  const loadData = useCallback(async () => {
    const savedAccounts = await storageService.getAccounts();
    const savedVault = await storageService.getBankDetails();
    setAccounts(savedAccounts);
    setVaultDetails(savedVault);
    await calculateTotal(savedAccounts);
  }, [calculateTotal]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleCopy = (value: string, label: string) => {
    Clipboard.setString(value);
    Alert.alert('Copied!', `${label} has been added to your clipboard.`);
  };

  const handleDeleteAccount = async (id: string) => {
    Alert.alert('Delete', 'Delete this account balance?', [
      { text: 'Cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await storageService.deleteAccount(id);
          await loadData();
        },
      },
    ]);
  };

  const handleDeleteVaultDetail = async (id: string) => {
    Alert.alert('Delete Vault Detail', 'Remove these sensitive bank details?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await storageService.deleteBankDetail(id);
          await loadData();
        },
      },
    ]);
  };

  const handleSaveVaultDetail = async () => {
    if (!vaultLabel || !vaultAccNumber) {
      Alert.alert('Error', 'Label and Account Number are required');
      return;
    }
    const newDetail: BankDetail = {
      id: `vault-${Date.now()}`,
      label: vaultLabel,
      accountNumber: vaultAccNumber,
      currency: vaultCurrency,
      bsb: vaultCurrency === 'AUD' ? vaultBSB : undefined,
      transitNumber: vaultCurrency === 'CAD' ? vaultTransit : undefined,
    };
    await storageService.saveBankDetail(newDetail);
    await loadData();
    setVaultLabel('');
    setVaultAccNumber('');
    setVaultBSB('');
    setVaultTransit('');
    setVaultModalVisible(false);
  };

  const handleSaveAccount = async () => {
    if (!accountName || !balance) return;
    const account: Account = {
      id: Date.now().toString(),
      name: accountName,
      balance: parseFloat(balance),
      currency,
      country,
      type: accountType,
      lastUpdated: new Date().toISOString(),
    };
    await storageService.saveAccount(account);
    await loadData();
    setAccountModalVisible(false);
    setAccountName('');
    setBalance('');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total Estimated Balance</Text>
        <Text style={styles.totalValue}>
          {isCalculating ? 'Calculating...' : formatCurrency(totalInAUD, 'AUD')}
        </Text>
      </View>

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeader}>My Accounts</Text>
        <TouchableOpacity onPress={() => setAccountModalVisible(true)}>
          <Text style={styles.addLink}>Add Account</Text>
        </TouchableOpacity>
      </View>

      {accounts.map((acc) => (
        <TouchableOpacity
          key={acc.id}
          style={styles.accountCard}
          onLongPress={() => handleDeleteAccount(acc.id)}
        >
          <View>
            <Text style={styles.accountName}>{acc.name}</Text>
            <Text style={styles.accountSub}>{acc.type} • {acc.country}</Text>
          </View>
          <Text style={styles.accountBalance}>{formatCurrency(acc.balance, acc.currency)}</Text>
        </TouchableOpacity>
      ))}

      <View style={styles.sectionHeaderRowSpaced}>
        <Text style={styles.sectionHeader}>Bank Vault</Text>
        <TouchableOpacity onPress={() => setVaultModalVisible(true)}>
          <Text style={styles.addLink}>Add Detail</Text>
        </TouchableOpacity>
      </View>

      {vaultDetails.map((detail) => (
        <TouchableOpacity
          key={detail.id}
          style={styles.vaultCard}
          onLongPress={() => handleDeleteVaultDetail(detail.id)}
        >
          <Text style={styles.vaultCardLabel}>{detail.label}</Text>
          <TouchableOpacity style={styles.copyRow} onPress={() => handleCopy(detail.accountNumber, 'Acc Number')}>
            <Text style={styles.vaultValue}>Acc: {detail.accountNumber}</Text>
            <Text style={styles.copyHint}>Copy</Text>
          </TouchableOpacity>
          {detail.bsb && (
            <TouchableOpacity style={styles.copyRow} onPress={() => handleCopy(detail.bsb!, 'BSB')}>
              <Text style={styles.vaultValue}>BSB: {detail.bsb}</Text>
              <Text style={styles.copyHint}>Copy</Text>
            </TouchableOpacity>
          )}
          {detail.transitNumber && (
            <TouchableOpacity style={styles.copyRow} onPress={() => handleCopy(detail.transitNumber!, 'Transit')}>
              <Text style={styles.vaultValue}>Transit: {detail.transitNumber}</Text>
              <Text style={styles.copyHint}>Copy</Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      ))}

      {/* Add Account Modal */}
      <Modal visible={accountModalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => { setAccountModalVisible(false); setAccountName(''); setBalance(''); }}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Account</Text>
            <TouchableOpacity onPress={handleSaveAccount}>
              <Text style={styles.saveButton}>Save</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.inputLabel}>Account Name</Text>
            <TextInput style={styles.input} value={accountName} onChangeText={setAccountName} placeholder="e.g., Commonwealth Checking" />
            <Text style={styles.inputLabel}>Balance</Text>
            <TextInput style={styles.input} value={balance} onChangeText={setBalance} keyboardType="numeric" placeholder="5000.00" />
            <Text style={styles.inputLabel}>Currency</Text>
            <View style={styles.pickerContainer}>
              <Picker selectedValue={currency} onValueChange={setCurrency}>
                {Object.keys(CURRENCIES).map(code => (
                  <Picker.Item key={code} label={`${CURRENCIES[code as keyof typeof CURRENCIES].flag} ${code}`} value={code} />
                ))}
              </Picker>
            </View>
            <Text style={styles.inputLabel}>Country</Text>
            <TextInput style={styles.input} value={country} onChangeText={setCountry} placeholder="Australia" />
            <Text style={styles.inputLabel}>Account Type</Text>
            <View style={styles.pickerContainer}>
              <Picker selectedValue={accountType} onValueChange={setAccountType}>
                <Picker.Item label="Bank Account" value="bank" />
                <Picker.Item label="Wise" value="wise" />
                <Picker.Item label="Revolut" value="revolut" />
                <Picker.Item label="Other" value="other" />
              </Picker>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Add Vault Detail Modal */}
      <Modal visible={vaultModalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => { setVaultModalVisible(false); setVaultLabel(''); setVaultAccNumber(''); setVaultBSB(''); setVaultTransit(''); }}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Bank Detail</Text>
            <TouchableOpacity onPress={handleSaveVaultDetail}>
              <Text style={styles.saveButton}>Save</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.inputLabel}>Label</Text>
            <TextInput style={styles.input} value={vaultLabel} onChangeText={setVaultLabel} placeholder="e.g., Commonwealth Savings" />
            <Text style={styles.inputLabel}>Account Number</Text>
            <TextInput style={styles.input} value={vaultAccNumber} onChangeText={setVaultAccNumber} placeholder="123456789" keyboardType="numeric" />
            <Text style={styles.inputLabel}>Currency</Text>
            <View style={styles.pickerContainer}>
              <Picker selectedValue={vaultCurrency} onValueChange={setVaultCurrency}>
                <Picker.Item label="🇦🇺 AUD" value="AUD" />
                <Picker.Item label="🇨🇦 CAD" value="CAD" />
              </Picker>
            </View>
            {vaultCurrency === 'AUD' && (
              <>
                <Text style={styles.inputLabel}>BSB</Text>
                <TextInput style={styles.input} value={vaultBSB} onChangeText={setVaultBSB} placeholder="123-456" />
              </>
            )}
            {vaultCurrency === 'CAD' && (
              <>
                <Text style={styles.inputLabel}>Transit Number</Text>
                <TextInput style={styles.input} value={vaultTransit} onChangeText={setVaultTransit} placeholder="12345" />
              </>
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
  padding: 16,
  backgroundColor: '#fff',
},
  totalCard: {
  backgroundColor: '#FFCBA4',
  padding: 24,
  borderRadius: 20,
  alignItems: 'center',
  marginBottom: 24,
  marginTop: 16,
  shadowColor: '#FFB3D9',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.5,
  shadowRadius: 12,
  elevation: 4,
},
  totalLabel: {
  color: '#fff',
  fontSize: 14,
  fontWeight: '500',
  marginBottom: 8,
},
  totalValue: {
  color: '#fff',
  fontSize: 32,
  fontWeight: 'bold',
},
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeaderRowSpaced: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 24,
  },
 sectionHeader: {
  fontSize: 18,
  fontWeight: 'bold',
  color: '#FFCBA4',
},
  addLink: {
  color: '#fff',
  fontWeight: '700',
  fontSize: 14,
  backgroundColor: '#FFCBA4',
  paddingVertical: 8,
  paddingHorizontal: 20,
  borderWidth: 1,
  borderRadius: 32,
  borderColor: '#FFCBA4',
  overflow: 'hidden',
},
  accountCard: {
  backgroundColor: '#FFCBA4',
  padding: 16,
  borderRadius: 20,
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginBottom: 12,
  shadowColor: '#FFB3D9',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.5,
  shadowRadius: 12,
  elevation: 4,
},
  accountName: {
  fontSize: 16,
  fontWeight: '600',
  color: '#fff',
},
accountSub: {
  fontSize: 12,
  color: '#fff',
  opacity: 0.7,
  marginTop: 2,
},
accountBalance: {
  fontSize: 16,
  fontWeight: '700',
  color: '#fff',
},
  vaultCard: {
  backgroundColor: '#FFCBA4',
  padding: 16,
  borderRadius: 20,
  marginBottom: 12,
  shadowColor: '#FFB3D9',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.5,
  shadowRadius: 12,
  elevation: 4,
},
vaultCardLabel: {
  fontSize: 12,
  fontWeight: '700',
  color: '#fff',
  marginBottom: 4,
  textTransform: 'uppercase',
  opacity: 0.8,
},
  copyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  vaultValue: {
  fontSize: 16,
  fontFamily: 'Courier',
  color: '#fff',
},
copyHint: {
  fontSize: 12,
  color: '#fff',
  fontWeight: '700',
  backgroundColor: 'rgba(255, 255, 255, 0.15)',
  paddingVertical: 4,
  paddingHorizontal: 12,
  borderRadius: 32,
  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.5)',
  overflow: 'hidden',
},
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFF',
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
  backgroundColor: 'rgba(255, 203, 164, 0.4)',
  paddingVertical: 8,
  paddingHorizontal: 20,
  borderWidth: 1,
  borderRadius: 32,
  borderColor: 'rgba(255, 203, 164, 0.6)',
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
  backgroundColor: 'rgba(255, 203, 164, 0.4)',
  paddingVertical: 8,
  paddingHorizontal: 20,
  borderWidth: 1,
  borderRadius: 32,
  borderColor: 'rgba(255, 203, 164, 0.6)',
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
input: {
  backgroundColor: '#FFCBA4',
  padding: 16,
  borderRadius: 16,
  fontSize: 16,
  color: '#fff',
  shadowColor: '#FFB3D9',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 8,
  elevation: 2,
},
  pickerContainer: {
  backgroundColor: '#FFCBA4',
  borderRadius: 16,
  overflow: 'hidden',
  shadowColor: '#FFB3D9',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 8,
  elevation: 2,
},
});

export default AccountTrackerScreen;