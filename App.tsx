import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import BiometricGuard from './src/components/BiometricGuard';
import HomeScreen from './src/screens/Home/HomeScreen';
import RateComparisonScreen from './src/screens/RateComparison/RateComparisonScreen';
import AccountTrackerScreen from './src/screens/AccountTracker/AccountTrackerScreen';
import RateAlertsScreen from './src/screens/RateAlerts/RateAlertsScreen';
import TransactionHistoryScreen from './src/screens/TransactionHistory/TransactionHistoryScreen';

const Stack = createStackNavigator();

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <BiometricGuard>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Home"
            screenOptions={{
              headerShown: false,
              headerStyle: {
                backgroundColor: '#FFCBA4',
              },
              headerTintColor: '#7A9BB5',
              headerTitleStyle: {
                fontWeight: '700',
                color: '#7A9BB5',
              },
              headerShadowVisible: false,
            }}
          >
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen
              name="RateComparison"
              component={RateComparisonScreen}
              options={{ headerShown: true, title: 'Compare Rates' }}
            />
            <Stack.Screen
              name="AccountTracker"
              component={AccountTrackerScreen}
              options={{ headerShown: true, title: 'My Accounts' }}
            />
            <Stack.Screen
              name="RateAlerts"
              component={RateAlertsScreen}
              options={{ headerShown: true, title: 'Rate Alerts' }}
            />
            <Stack.Screen
              name="TransactionHistory"
              component={TransactionHistoryScreen}
              options={{ headerShown: true, title: 'Transaction History' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </BiometricGuard>
    </SafeAreaProvider>
  );
}

export default App;