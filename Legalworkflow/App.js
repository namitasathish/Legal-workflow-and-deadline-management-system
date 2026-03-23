import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useApp } from './context/AppContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import LoadingState from './components/LoadingState';
import AppErrorBoundary from './components/AppErrorBoundary';

// Auth Screens
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';

// Lawyer Screens
import HomeScreen from './screens/HomeScreen';
import CaseDetailScreen from './screens/CaseDetailScreen';
import AddCaseScreen from './screens/AddCaseScreen';
import ClientsScreen from './screens/ClientsScreen';
import ClientDetailScreen from './screens/ClientDetailScreen';
import WeeklyScreen from './screens/WeeklyScreen';
import SettingsScreen from './screens/SettingsScreen';
import BareActsScreen from './screens/BareActsScreen';
import FirBuilderScreen from './screens/FirBuilderScreen';
import DocumentsScreen from './screens/DocumentsScreen';
import CaseDocumentsScreen from './screens/CaseDocumentsScreen';
import ClosedCasesScreen from './screens/ClosedCasesScreen';
import ActivityLogScreen from './screens/ActivityLogScreen';
import AnalyticsScreen from './screens/AnalyticsScreen';
import ChatScreen from './screens/ChatScreen';
import LawyerAppointmentsScreen from './screens/LawyerAppointmentsScreen';
import LawyerPaymentsScreen from './screens/LawyerPaymentsScreen';
import LawyerFeedbackScreen from './screens/LawyerFeedbackScreen';
import FirHistoryScreen from './screens/FirHistoryScreen';

// Client Portal Screens
import ClientHomeScreen from './screens/ClientHomeScreen';
import ClientCaseViewScreen from './screens/ClientCaseViewScreen';
import ClientDocUploadScreen from './screens/ClientDocUploadScreen';
import ClientDocumentsScreen from './screens/ClientDocumentsScreen';
import ClientPaymentsScreen from './screens/ClientPaymentsScreen';
import ClientAppointmentsScreen from './screens/ClientAppointmentsScreen';
import ClientSettingsScreen from './screens/ClientSettingsScreen';

const Stack = createNativeStackNavigator();

function Navigation() {
  const { user, loading } = useApp();
  const { isDark } = useTheme();

  if (loading) {
    return <LoadingState message="Loading your workspace..." />;
  }

  return (
    <AppErrorBoundary>
      <NavigationContainer>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        >
          {!user ? (
            <>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Register" component={RegisterScreen} />
            </>
          ) : user.role === 'client' ? (
            /* ---- CLIENT PORTAL STACK ---- */
            <>
              <Stack.Screen name="Client Home" component={ClientHomeScreen} />
              <Stack.Screen name="Client Case View" component={ClientCaseViewScreen} />
              <Stack.Screen name="Client Doc Upload" component={ClientDocUploadScreen} />
              <Stack.Screen name="Client Documents" component={ClientDocumentsScreen} />
              <Stack.Screen name="Client Payments" component={ClientPaymentsScreen} />
              <Stack.Screen name="Client Appointments" component={ClientAppointmentsScreen} />
              <Stack.Screen name="Client Settings" component={ClientSettingsScreen} />
              <Stack.Screen name="Chat" component={ChatScreen} />
            </>
          ) : (
            /* ---- LAWYER STACK ---- */
            <>
              <Stack.Screen name="Home" component={HomeScreen} />
              <Stack.Screen name="Case Detail" component={CaseDetailScreen} />
              <Stack.Screen name="Add Case" component={AddCaseScreen} />
              <Stack.Screen name="Clients" component={ClientsScreen} />
              <Stack.Screen name="Client Detail" component={ClientDetailScreen} />
              <Stack.Screen name="Weekly Planner" component={WeeklyScreen} />
              <Stack.Screen name="Settings" component={SettingsScreen} />
              <Stack.Screen name="Bare Acts" component={BareActsScreen} />
              <Stack.Screen name="FIR Builder" component={FirBuilderScreen} />
              <Stack.Screen name="Documents" component={DocumentsScreen} />
              <Stack.Screen name="Case Documents" component={CaseDocumentsScreen} />
              <Stack.Screen name="Closed Cases" component={ClosedCasesScreen} />
              <Stack.Screen name="Activity Log" component={ActivityLogScreen} />
              <Stack.Screen name="Analytics" component={AnalyticsScreen} />
              <Stack.Screen name="Chat" component={ChatScreen} />
              <Stack.Screen name="Lawyer Appointments" component={LawyerAppointmentsScreen} />
              <Stack.Screen name="Lawyer Payments" component={LawyerPaymentsScreen} />
              <Stack.Screen name="Lawyer Feedback" component={LawyerFeedbackScreen} />
              <Stack.Screen name="FIR History" component={FirHistoryScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </AppErrorBoundary>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppProvider>
          <Navigation />
        </AppProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
