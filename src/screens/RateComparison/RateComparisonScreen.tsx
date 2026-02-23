import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
  ScrollView,
} from 'react-native';
import { rateService } from '../../services/rateService';

const PROVIDERS = [
  {
    key: 'wise',
    name: 'Wise',
    description: 'Low fees, mid-market rate. Best for most transfers.',
    url: 'https://wise.com',
    highlight: true,
  },
  {
    key: 'revolut',
    name: 'Revolut',
    description: 'Fee-free up to monthly limit. Great for regular transfers.',
    url: 'https://revolut.com',
    highlight: false,
  },
  {
    key: 'ofx',
    name: 'OFX',
    description: 'No transfer fees. Good for large amounts.',
    url: 'https://www.ofx.com',
    highlight: false,
  },
  {
    key: 'bank',
    name: 'Bank Wire',
    description: 'Convenient but typically the most expensive option.',
    url: '',
    highlight: false,
  },
];

const RateComparisonScreen = () => {
  const [cadToAud, setCadToAud] = useState<string>('—');

  useEffect(() => {
    rateService.getExchangeRate('CAD', 'AUD')
      .then(rate => setCadToAud(rate.toFixed(4)))
      .catch(() => setCadToAud('—'));
  }, []);

  const handleOpenProvider = (provider: typeof PROVIDERS[0]) => {
    if (!provider.url) {
      Alert.alert('Bank Wire', 'Contact your bank directly to initiate an international transfer.');
      return;
    }
    Linking.canOpenURL(provider.url).then(supported => {
      if (supported) {
        Linking.openURL(provider.url);
      } else {
        Alert.alert('Error', 'Unable to open link');
      }
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>

      {/* Live rate card */}
      <View style={styles.rateCard}>
        <Text style={styles.rateLabel}>Live Mid-Market Rate</Text>
        <Text style={styles.rateValue}>1 CAD = {cadToAud} AUD</Text>
        <Text style={styles.rateNote}>
          The closer a provider's rate is to this, the better the deal
        </Text>
      </View>

      {/* Provider cards */}
      <Text style={styles.sectionTitle}>Transfer Providers</Text>

      {PROVIDERS.map(provider => (
        <TouchableOpacity
          key={provider.key}
          style={[styles.providerCard, provider.highlight && styles.providerCardHighlight]}
          onPress={() => handleOpenProvider(provider)}
          activeOpacity={0.8}
        >
          <View style={styles.providerHeader}>
            <View style={styles.providerInfo}>
              <Text style={styles.providerName}>{provider.name}</Text>
              <Text style={styles.providerDescription}>{provider.description}</Text>
            </View>
            <Text style={styles.visitText}>{provider.url ? 'Visit' : 'Info'}</Text>
          </View>
          {provider.highlight && (
            <View style={styles.recommendedBadge}>
              <Text style={styles.recommendedText}>Most Popular</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}

      {/* Disclaimer */}
      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          Rates and fees vary by amount, currency, and account type. Always check the provider's site for an exact quote before transferring.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFCBA4',
  },
  contentContainer: {
    padding: 16,
    paddingTop: 24,
    paddingBottom: 48,
  },
  rateCard: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#FFB3D9',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 4,
  },
  rateLabel: {
    fontSize: 14,
    color: '#7A9BB5',
    fontWeight: '500',
    marginBottom: 8,
  },
  rateValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#7A9BB5',
    marginBottom: 8,
  },
  rateNote: {
    fontSize: 12,
    color: '#7A9BB5',
    opacity: 0.7,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7A9BB5',
    marginBottom: 12,
  },
  providerCard: {
    backgroundColor: '#fff',
    marginBottom: 12,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#FFB3D9',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 4,
  },
  providerCardHighlight: {
    shadowColor: '#FFB3D9',
    shadowOpacity: 0.8,
  },
  providerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#7A9BB5',
    marginBottom: 4,
  },
  providerDescription: {
    fontSize: 13,
    color: '#7A9BB5',
    opacity: 0.7,
    lineHeight: 18,
  },
  visitText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#7A9BB5',
    backgroundColor: 'rgba(255, 203, 164, 0.4)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    overflow: 'hidden',
    marginLeft: 12,
  },
  recommendedBadge: {
    marginTop: 12,
    backgroundColor: 'rgba(255, 203, 164, 0.2)',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    alignSelf: 'flex-start',
  },
  recommendedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7A9BB5',
  },
  disclaimer: {
    marginTop: 4,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 20,
    shadowColor: '#FFB3D9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 2,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#7A9BB5',
    opacity: 0.7,
    lineHeight: 18,
  },
});

export default RateComparisonScreen;