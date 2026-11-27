import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  AppState,
  Pressable,
  Animated,
  Easing,
} from 'react-native';
import { triggerSmoothLayout } from '../lib/layoutAnim';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import * as SecureStore from 'expo-secure-store';
import Svg, { Path } from 'react-native-svg';
import { getSetCookie, storageAdapter } from '@better-auth/expo/client';
import { RootStackParamList } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useDrawer } from '../context/DrawerContext';
import { BrandSpike } from '../components/BrandSpike';
import { authClient } from '../lib/auth-client';
import { API_BASE_URL } from '../lib/config';
import { spacing, radii } from '../theme/spacing';
import {
  X,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react-native';

type AuthRouteProp = RouteProp<RootStackParamList, 'Auth'>;

const managedStorage = storageAdapter(SecureStore);
const COOKIE_STORAGE_KEY = 'stutosed_cookie';

function generateHandoffToken(): string {
  const part = () => Math.random().toString(36).slice(2, 10);
  return `mob_${Date.now().toString(36)}_${part()}${part()}`;
}

export const AuthScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<AuthRouteProp>();
  const { colors } = useTheme();
  const { refreshSessionAndSync } = useAuth();
  const { openPrivacyModal } = useDrawer();

  const [isSignUp, setIsSignUp] = useState(route.params?.mode === 'signup');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);

  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeTokenRef = useRef<string | null>(null);
  const finalizedRef = useRef<boolean>(false);
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.94)).current;
  const cardY = useRef(new Animated.Value(16)).current;

  const stopPolling = () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    activeTokenRef.current = null;
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(cardScale, {
        toValue: 1,
        damping: 22,
        stiffness: 260,
        mass: 0.8,
        useNativeDriver: true,
      }),
      Animated.timing(cardY, {
        toValue: 0,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
    return () => stopPolling();
  }, [cardOpacity, cardScale, cardY]);

  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, label: '', color: 'transparent' };
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password) || /[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) return { score: 1, label: 'Weak', color: colors.red };
    if (score === 2 || score === 3) return { score: 2, label: 'Medium', color: colors.orange };
    return { score: 3, label: 'Strong', color: colors.green };
  }, [password, colors]);

  const checkHandoffAndFinalize = async (token: string): Promise<boolean> => {
    if (finalizedRef.current) return true;
    try {
      const pollRes = await fetch(
        `${API_BASE_URL}/api/v1/mobile-auth?action=poll&token=${encodeURIComponent(token)}`
      );
      if (!pollRes.ok) return false;
      const json = await pollRes.json();
      const payload = json?.data;

      if (payload?.status === 'ready' && payload?.setCookie) {
        finalizedRef.current = true;
        stopPolling();
        const prevCookie = await managedStorage.getItemAsync(COOKIE_STORAGE_KEY);
        const mergedCookie = getSetCookie(payload.setCookie, prevCookie ?? undefined);
        await managedStorage.setItemAsync(COOKIE_STORAGE_KEY, mergedCookie);

        try {
          if (Platform.OS !== 'android') {
            WebBrowser.dismissBrowser();
          }
        } catch {}

        setMessage({ text: 'Signed in! Syncing your study data...', type: 'success' });
        await refreshSessionAndSync();
        setLoading(false);
        if (navigation.canGoBack()) navigation.goBack();
        return true;
      }
    } catch {}
    return false;
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setMessage(null);
      stopPolling();
      finalizedRef.current = false;

      const token = generateHandoffToken();
      activeTokenRef.current = token;
      const appRedirect = Linking.createURL('/');
      const bridgeCallbackURL = `${API_BASE_URL}/api/v1/mobile-auth?action=complete&token=${encodeURIComponent(
        token
      )}&redirect=${encodeURIComponent(appRedirect)}`;

      const socialRes = await fetch(`${API_BASE_URL}/api/auth/sign-in/social`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: API_BASE_URL,
        },
        body: JSON.stringify({
          provider: 'google',
          callbackURL: bridgeCallbackURL,
        }),
      });

      const socialJson = await socialRes.json().catch(() => null);
      if (!socialRes.ok || !socialJson?.url) {
        stopPolling();
        setMessage({
          text: socialJson?.message || 'Could not start Google authentication.',
          type: 'error',
        });
        setLoading(false);
        return;
      }

      const proxyURL = `${API_BASE_URL}/api/auth/expo-authorization-proxy?authorizationURL=${encodeURIComponent(
        socialJson.url
      )}`;

      pollTimerRef.current = setInterval(() => {
        if (activeTokenRef.current === token) {
          checkHandoffAndFinalize(token);
        }
      }, 1500);

      const appStateSub = AppState.addEventListener('change', (state) => {
        if (state === 'active' && activeTokenRef.current === token) {
          checkHandoffAndFinalize(token);
        }
      });

      try {
        await WebBrowser.openAuthSessionAsync(proxyURL, appRedirect);
      } finally {
        appStateSub.remove();
      }

      if (!finalizedRef.current) {
        const completed = await checkHandoffAndFinalize(token);
        stopPolling();

        if (!completed && !finalizedRef.current) {
          const latest = await authClient.getSession();
          if (latest?.data?.user) {
            finalizedRef.current = true;
            await refreshSessionAndSync();
            if (navigation.canGoBack()) navigation.goBack();
          } else {
            setMessage({
              text: 'Google sign-in was cancelled or not completed yet.',
              type: 'error',
            });
          }
        }
      } else {
        stopPolling();
      }
    } catch (err: any) {
      stopPolling();
      setMessage({
        text: err?.message || 'Google authentication failed.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async () => {
    const cleanName = fullName.trim() || email.split('@')[0] || 'Student';
    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      setMessage({ text: 'Please fill in all required fields.', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          setMessage({ text: 'Passwords do not match.', type: 'error' });
          setLoading(false);
          return;
        }
        if (password.length < 8) {
          setMessage({ text: 'Password must be at least 8 characters long.', type: 'error' });
          setLoading(false);
          return;
        }

        const res = await authClient.signUp.email({
          email: cleanEmail,
          password,
          name: cleanName,
        });

        if (res.error) {
          setMessage({ text: res.error.message || 'Registration failed.', type: 'error' });
          setLoading(false);
          return;
        }

        setMessage({ text: 'Account created! Syncing your study data...', type: 'success' });
        await refreshSessionAndSync();
        setTimeout(() => {
          if (navigation.canGoBack()) navigation.goBack();
        }, 400);
      } else {
        const res = await authClient.signIn.email({
          email: cleanEmail,
          password,
        });

        if (res.error) {
          setMessage({
            text: res.error.message || 'Invalid email or password.',
            type: 'error',
          });
          setLoading(false);
          return;
        }

        setMessage({ text: 'Welcome back! Syncing progress...', type: 'success' });
        await refreshSessionAndSync();
        setTimeout(() => {
          if (navigation.canGoBack()) navigation.goBack();
        }, 400);
      }
    } catch (err: any) {
      setMessage({ text: err?.message || 'Authentication error occurred.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const closePopup = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <Pressable style={styles.modalOverlay} onPress={closePopup}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardWrap}
      >
        <Animated.View
          style={[
            styles.modalCard,
            {
              backgroundColor: colors.bgCard,
              borderColor: colors.border,
              opacity: cardOpacity,
              transform: [{ translateY: cardY }, { scale: cardScale }],
            },
          ]}
        >
          <Pressable style={{ flexShrink: 1 }} onPress={(e) => e.stopPropagation()}>
          {/* Top Brand Accent Stripe matching AuthModal.tsx */}
          <View style={styles.topGradientBar}>
            <View style={{ flex: 1, backgroundColor: colors.accent }} />
            <View style={{ flex: 1, backgroundColor: colors.beuBlue }} />
            <View style={{ flex: 1, backgroundColor: colors.govtIndigo }} />
          </View>

          {/* Top-Right Close Button */}
          <TouchableOpacity
            onPress={closePopup}
            style={[
              styles.closeBtn,
              { backgroundColor: colors.bgCardSubtle, borderColor: colors.border },
            ]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={16} color={colors.textMuted} />
          </TouchableOpacity>

          <ScrollView
            contentContainerStyle={styles.cardBody}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Glowing Rotating Brand Emblem */}
            <View style={styles.brandHeader}>
              <View style={styles.brandOrb}>
                <BrandSpike size={32} color={colors.accent} />
              </View>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {isSignUp ? 'Create Student Account' : 'Sign In to stutosed'}
              </Text>
              <Text style={[styles.modalSub, { color: colors.textMuted }]}>
                Free &amp; permanent access to all courses, lectures &amp; PDF notes.
              </Text>
            </View>

            {/* Feedback Banner */}
            {message && (
              <View
                style={[
                  styles.messageBox,
                  {
                    backgroundColor:
                      message.type === 'error'
                        ? 'rgba(239, 68, 68, 0.12)'
                        : 'rgba(34, 197, 94, 0.12)',
                    borderColor:
                      message.type === 'error'
                        ? 'rgba(239, 68, 68, 0.25)'
                        : 'rgba(34, 197, 94, 0.25)',
                  },
                ]}
              >
                {message.type === 'error' ? (
                  <AlertCircle size={16} color={colors.red} />
                ) : (
                  <CheckCircle2 size={16} color={colors.green} />
                )}
                <Text
                  style={[
                    styles.messageText,
                    { color: message.type === 'error' ? colors.red : colors.green },
                  ]}
                >
                  {message.text}
                </Text>
              </View>
            )}

            {/* Google OAuth Button matching AuthModal.tsx */}
            <TouchableOpacity
              style={[
                styles.googleBtn,
                { backgroundColor: colors.bg, borderColor: colors.border },
              ]}
              onPress={handleGoogleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Svg width={18} height={18} viewBox="0 0 24 24">
                <Path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <Path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <Path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <Path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </Svg>
              <Text style={[styles.googleBtnText, { color: colors.text }]}>
                Continue with Google
              </Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, { color: colors.textDim }]}>
                OR CONTINUE WITH EMAIL
              </Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>

            {/* Full Name (Sign Up Only) */}
            {isSignUp && (
              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: colors.textMuted }]}>FULL NAME</Text>
                <View
                  style={[
                    styles.inputWrap,
                    { backgroundColor: colors.bg, borderColor: colors.border },
                  ]}
                >
                  <User size={15} color={colors.textDim} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="e.g. Advik"
                    placeholderTextColor={colors.textDim}
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                  />
                </View>
              </View>
            )}

            {/* Email Address */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.textMuted }]}>EMAIL ADDRESS</Text>
              <View
                style={[
                  styles.inputWrap,
                  { backgroundColor: colors.bg, borderColor: colors.border },
                ]}
              >
                <Mail size={15} color={colors.textDim} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="advik@stutosed.com"
                  placeholderTextColor={colors.textDim}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.textMuted }]}>PASSWORD</Text>
              <View
                style={[
                  styles.inputWrap,
                  { backgroundColor: colors.bg, borderColor: colors.border },
                ]}
              >
                <Lock size={15} color={colors.textDim} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder={isSignUp ? 'Create a strong password' : 'Enter your password'}
                  placeholderTextColor={colors.textDim}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPassword((v) => !v)}>
                  {showPassword ? (
                    <EyeOff size={15} color={colors.textDim} />
                  ) : (
                    <Eye size={15} color={colors.textDim} />
                  )}
                </TouchableOpacity>
              </View>

              {isSignUp && password.length > 0 && (
                <View style={styles.strengthRow}>
                  <View style={styles.strengthBars}>
                    {[1, 2, 3].map((idx) => (
                      <View
                        key={idx}
                        style={[
                          styles.strengthBar,
                          {
                            backgroundColor:
                              passwordStrength.score >= idx
                                ? passwordStrength.color
                                : colors.border,
                          },
                        ]}
                      />
                    ))}
                  </View>
                  <Text style={[styles.strengthLabel, { color: passwordStrength.color }]}>
                    {passwordStrength.label}
                  </Text>
                </View>
              )}
            </View>

            {/* Confirm Password (Sign Up Only) */}
            {isSignUp && (
              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: colors.textMuted }]}>CONFIRM PASSWORD</Text>
                <View
                  style={[
                    styles.inputWrap,
                    { backgroundColor: colors.bg, borderColor: colors.border },
                  ]}
                >
                  <Lock size={15} color={colors.textDim} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Re-enter password"
                    placeholderTextColor={colors.textDim}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPassword((v) => !v)}>
                    {showConfirmPassword ? (
                      <EyeOff size={15} color={colors.textDim} />
                    ) : (
                      <Eye size={15} color={colors.textDim} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Primary Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitBtn,
                { backgroundColor: colors.accent, opacity: loading ? 0.7 : 1 },
              ]}
              onPress={handleEmailAuth}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.submitBtnText}>
                  {isSignUp ? 'Create Student Account' : 'Sign In'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Switch Auth Mode Link */}
            <View style={styles.switchRow}>
              <Text style={[styles.switchLabel, { color: colors.textMuted }]}>
                {isSignUp ? 'Already have an account? ' : 'New to stutosed? '}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  triggerSmoothLayout();
                  setIsSignUp((prev) => !prev);
                  setMessage(null);
                }}
              >
                <Text style={[styles.switchAction, { color: colors.accent }]}>
                  {isSignUp ? 'Sign In' : 'Create an Account'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Continue as Guest Button */}
            <TouchableOpacity
              style={[
                styles.guestBtn,
                { backgroundColor: colors.bgCardSubtle, borderColor: colors.border },
              ]}
              onPress={closePopup}
              activeOpacity={0.8}
            >
              <Text style={[styles.guestBtnText, { color: colors.text }]}>
                Continue as Guest
              </Text>
              <ArrowRight size={14} color={colors.text} />
            </TouchableOpacity>

            {/* Terms & Privacy Compliance Note */}
            <Text style={[styles.legalNote, { color: colors.textDim }]}>
              By continuing, you agree to our{' '}
              <Text
                style={[styles.legalLink, { color: colors.textMuted }]}
                onPress={() => openPrivacyModal('terms')}
              >
                Terms of Service
              </Text>{' '}
              and{' '}
              <Text
                style={[styles.legalLink, { color: colors.textMuted }]}
                onPress={() => openPrivacyModal('privacy')}
              >
                Privacy Policy
              </Text>
              .
            </Text>
          </ScrollView>
          </Pressable>
        </Animated.View>
      </KeyboardAvoidingView>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(18, 17, 16, 0.76)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  keyboardWrap: {
    width: '100%',
    maxWidth: 420,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: '100%',
    maxHeight: '92%',
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.42,
    shadowRadius: 28,
    elevation: 18,
  },
  topGradientBar: {
    height: 4,
    flexDirection: 'row',
    width: '100%',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 22,
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 18,
  },
  brandOrb: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(204, 120, 92, 0.14)',
    borderWidth: 1.5,
    borderColor: 'rgba(204, 120, 92, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 21,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  modalSub: {
    fontSize: 12.5,
    textAlign: 'center',
    lineHeight: 18,
  },
  messageBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: 14,
  },
  messageText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  googleBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 10.5,
    fontWeight: '600',
    letterSpacing: 0.7,
  },
  fieldGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 5,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    height: 42,
  },
  input: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  strengthBars: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  submitBtn: {
    borderRadius: radii.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 14,
  },
  switchLabel: {
    fontSize: 12.5,
  },
  switchAction: {
    fontSize: 12.5,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  guestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 11,
    borderRadius: radii.md,
    borderWidth: 1,
    marginTop: 12,
  },
  guestBtnText: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  legalNote: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 17,
    marginTop: 12,
  },
  legalLink: {
    textDecorationLine: 'underline',
  },
});
