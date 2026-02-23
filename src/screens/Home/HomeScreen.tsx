import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { storageService } from '../../services/storageService';
import { rateService } from '../../services/rateService';

const HomeScreen = ({ navigation }: { navigation: any }) => {
  const [accountCount, setAccountCount] = useState(0);
  const [currentRate, setCurrentRate] = useState('—');
  const [transactionCount, setTransactionCount] = useState(0);

  useEffect(() => {
    loadCloudData();
  }, []);

  const loadCloudData = async () => {
    try {
      const accounts = await storageService.getAccounts();
      setAccountCount(accounts.length);
    } catch (error) {
      console.error('Error loading accounts:', error);
    }
    try {
      const rate = await rateService.getExchangeRate('CAD', 'AUD');
      setCurrentRate(rate.toFixed(4));
    } catch {
      setCurrentRate('—');
    }
    try {
      const transactions = await storageService.getTransactions();
      setTransactionCount(transactions.length);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.cardsContainer}>

        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('AccountTracker')}
          activeOpacity={0.8}
        >
          <Text style={styles.cardValue}>{accountCount}</Text>
          <Text style={styles.cardLabel}>Accounts</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('RateAlerts')}
          activeOpacity={0.8}
        >
          <Text style={styles.cardValue}>{currentRate}</Text>
          <Text style={styles.cardLabel}>CAD→AUD</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('TransactionHistory')}
          activeOpacity={0.8}
        >
          <Text style={styles.cardValue}>{transactionCount}</Text>
          <Text style={styles.cardLabel}>Transfers</Text>
        </TouchableOpacity>

      </View>

      <TouchableOpacity
        style={styles.compareButton}
        onPress={() => navigation.navigate('RateComparison')}
        activeOpacity={0.9}
      >
        <Text style={styles.compareText}>Compare Rates</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFCBA4',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 150,
  },
  cardsContainer: {
    width: '100%',
    gap: 30,
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#FFB3D9',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 4,
  },
  cardValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#7A9BB5',
    marginBottom: 4,
  },
  cardLabel: {
    fontSize: 16,
    color: '#7A9BB5',
    fontWeight: '500',
  },
  compareButton: {
    position: 'absolute',
    bottom: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderWidth: 1,
    borderRadius: 32,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 3,
  },
  compareText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
});

export default HomeScreen;