import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  FlatList,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import theme from '../theme';
import { MaterialIcons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setToken, setUser } from '../store/authSlice';
import { api } from '../api/client';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const { width } = Dimensions.get('window');
const CAROUSEL_WIDTH = width - theme.spacing.margin * 2;

const FEATURES = [
  { id: '1', icon: 'map', title: 'Live Trip Tracker', desc: 'GPS & map live route tracking' },
  { id: '2', icon: 'speed', title: 'Engine Health', desc: 'Real-time OBD diagnostics and alerts' },
  { id: '3', icon: 'local-gas-station', title: 'Smart Fuel Audit', desc: 'Fuel telemetry & anomaly detection' },
  { id: '4', icon: 'account-balance-wallet', title: 'Fastag Monitor', desc: 'Bank API toll auto-alerts' },
  { id: '5', icon: 'description', title: 'RTO Locker', desc: 'Document expiry reminders' },
  { id: '6', icon: 'security', title: 'Driver Safety', desc: 'Accelerometer driver score matrix' },
];

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useDispatch();
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [focusedInput, setFocusedInput] = useState<'name' | 'email' | 'password' | null>(null);

  // Carousel state and references
  const [carouselIndex, setCarouselIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll loop
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCarouselIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % FEATURES.length;
        flatListRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true,
        });
        return nextIndex;
      });
    }, 3500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleScroll = (event: any) => {
    const xOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(xOffset / CAROUSEL_WIDTH);
    setCarouselIndex(index);
  };

  // TODO(backend): Wire real Google OAuth flow once backend auth endpoint
  // is ready.
  const handleGoogleSignIn = () => {
    console.log('Google Sign-In stub triggered');
  };

  // Replace with real authentication call
  const handleAuthSubmit = async () => {
    if (!email.trim()) return;
    if (isSignUp && !name.trim()) return;

    try {
      if (isSignUp) {
        // Register new company - generate a random mock GST number to satisfy constraints
        const mockGst = '29' + Math.random().toString(36).substring(2, 9).toUpperCase() + '1Z5';
        const registerResponse = await api.registerCompany(
          name.trim(),
          email.trim(),
          '9876543210',
          'Bangalore',
          mockGst
        );

        if (registerResponse.data?.status === 'success') {
          const companyId = registerResponse.data.company_id;
          const userPayload = {
            name: name.trim(),
            email: email.trim(),
            companyId: companyId,
          };
          await AsyncStorage.setItem('fleetToken', companyId);
          await AsyncStorage.setItem('fleetUser', JSON.stringify(userPayload));
          dispatch(setToken(companyId));
          dispatch(setUser(userPayload));
        } else {
          Alert.alert('Registration Failed', 'Could not register company.');
        }
      } else {
        // Log in existing company using email stopgap endpoint
        const loginResponse = await api.loginCompany(email.trim());

        if (loginResponse.data?.status === 'success') {
          const companyId = loginResponse.data.company_id;
          const companyName = loginResponse.data.name;
          const userPayload = {
            name: companyName,
            email: email.trim(),
            companyId: companyId,
          };
          await AsyncStorage.setItem('fleetToken', companyId);
          await AsyncStorage.setItem('fleetUser', JSON.stringify(userPayload));
          dispatch(setToken(companyId));
          dispatch(setUser(userPayload));
        }
      }
    } catch (e: any) {
      console.error('Error during local auth submit:', e);
      const errorMsg = e.response?.data?.detail || 'An error occurred during authentication.';
      Alert.alert('Authentication Error', errorMsg);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={[theme.typography.metricMobile, styles.title]}>
              FLEET OPS
            </Text>
            <Text style={[theme.typography.bodyMd, styles.subtitle]}>
              Data-forward fleet logistics operations
            </Text>
          </View>

          {/* Marketing/Feature Carousel */}
          <View style={styles.carouselContainer}>
            <FlatList
              ref={flatListRef}
              data={FEATURES}
              horizontal
              pagingEnabled={false}
              snapToInterval={CAROUSEL_WIDTH}
              snapToAlignment="center"
              decelerationRate="fast"
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              contentContainerStyle={{ paddingHorizontal: 8 }}
              renderItem={({ item }) => (
                <View style={styles.featureCard}>
                  <View style={styles.iconContainer}>
                    <MaterialIcons name={item.icon as any} size={20} color={theme.colors.primary} />
                  </View>
                  <View style={styles.textContainer}>
                    <Text style={[theme.typography.bodyMd, styles.featureTitle]}>
                      {item.title}
                    </Text>
                    <Text style={[theme.typography.labelCaps, styles.featureDesc]}>
                      {item.desc}
                    </Text>
                  </View>
                </View>
              )}
            />
            {/* Carousel Dot Indicators */}
            <View style={styles.indicatorContainer}>
              {FEATURES.map((_, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.dot,
                    carouselIndex === idx ? styles.activeDot : styles.inactiveDot,
                  ]}
                />
              ))}
            </View>
          </View>

          <View style={styles.form}>
            {isSignUp && (
              <View style={styles.inputGroup}>
                <Text style={[theme.typography.labelCaps, styles.label]}>Name</Text>
                <TextInput
                  style={[
                    styles.input,
                    focusedInput === 'name' && styles.inputFocused
                  ]}
                  value={name}
                  onChangeText={setName}
                  onFocus={() => setFocusedInput('name')}
                  onBlur={() => setFocusedInput(null)}
                  placeholder="John Doe"
                  placeholderTextColor={theme.colors.onSurfaceVariant}
                  autoCapitalize="words"
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={[theme.typography.labelCaps, styles.label]}>Email</Text>
              <TextInput
                style={[
                  styles.input,
                  focusedInput === 'email' && styles.inputFocused
                ]}
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocusedInput('email')}
                onBlur={() => setFocusedInput(null)}
                placeholder="operator@fleetops.com"
                placeholderTextColor={theme.colors.onSurfaceVariant}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[theme.typography.labelCaps, styles.label]}>Password</Text>
              <TextInput
                style={[
                  styles.input,
                  focusedInput === 'password' && styles.inputFocused
                ]}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocusedInput('password')}
                onBlur={() => setFocusedInput(null)}
                placeholder="••••••••"
                placeholderTextColor={theme.colors.onSurfaceVariant}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleAuthSubmit}
              activeOpacity={0.8}
            >
              <Text style={[theme.typography.labelCaps, { color: theme.colors.onPrimary, fontSize: 13 }]}>
                {isSignUp ? 'SIGN UP' : 'LOG IN'}
              </Text>
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={[theme.typography.labelCaps, styles.dividerText]}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleSignIn}
              activeOpacity={0.8}
            >
              <Text style={[theme.typography.labelCaps, { color: '#000000', fontSize: 12 }]}>
                SIGN IN WITH GOOGLE
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toggleStateButton}
              onPress={() => setIsSignUp(!isSignUp)}
              activeOpacity={0.7}
            >
              <Text style={[theme.typography.bodyMd, styles.toggleStateText]}>
                {isSignUp ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    color: theme.colors.primary,
    fontWeight: '700',
    letterSpacing: -1,
  },
  subtitle: {
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 4,
  },
  carouselContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  featureCard: {
    width: CAROUSEL_WIDTH - 16,
    marginHorizontal: 8,
    backgroundColor: theme.colors.surfaceContainer,
    borderRadius: theme.rounded.md,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: theme.rounded.sm,
    backgroundColor: theme.colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  featureTitle: {
    color: theme.colors.onSurface,
    fontWeight: '600',
  },
  featureDesc: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 10,
    marginTop: 2,
    textTransform: 'none',
    letterSpacing: 0,
  },
  indicatorContainer: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  activeDot: {
    backgroundColor: theme.colors.primary,
    width: 12,
  },
  inactiveDot: {
    backgroundColor: theme.colors.outlineVariant,
  },
  form: {
    backgroundColor: theme.colors.surfaceContainer,
    borderRadius: theme.rounded.lg,
    padding: 20,
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    color: theme.colors.onSurfaceVariant,
  },
  input: {
    backgroundColor: theme.colors.surfaceContainerLow,
    color: theme.colors.onSurface,
    borderRadius: theme.rounded.DEFAULT,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  inputFocused: {
    borderColor: theme.colors.primary,
  },
  primaryButton: {
    backgroundColor: theme.colors.brandTeal,
    borderRadius: theme.rounded.DEFAULT,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.outlineVariant,
  },
  dividerText: {
    color: theme.colors.onSurfaceVariant,
    marginHorizontal: 12,
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.rounded.DEFAULT,
    paddingVertical: 14,
    alignItems: 'center',
  },
  toggleStateButton: {
    alignItems: 'center',
    marginTop: 8,
  },
  toggleStateText: {
    color: theme.colors.primary,
  },
});
export default LoginScreen;
