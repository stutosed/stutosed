import React, { useState, useMemo } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { authClient } from '../lib/auth-client';
import { spacing, radii } from '../theme/spacing';
import {
  ArrowLeft,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react-native';

type AuthRouteProp = RouteProp<RootStackParamList, 'Auth'>;

export const AuthScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<AuthRouteProp>();
  const { colors } = useTheme();
  const { refreshSessionAndSync } = useAuth();

  const [isSignUp, setIsSignUp] = useState(route.params?.mode === 'signup');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);

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

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setMessage(null);
      const res = await authClient.signIn.social({
        provider: 'google',
        callbackURL: '/',
      });
      if (res?.error) {
        setMessage({
          text: res.error.message || 'Google sign-in requires updated server deploy or email sign-in.',
          type: 'error',
        });
      } else {
        await refreshSessionAndSync();
        if (navigation.canGoBack()) navigation.goBack();
      }
    } catch (err: any) {
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
        }, 500);
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
        }, 500);
      }
    } catch (err: any) {
      setMessage({ text: err?.message || 'Authentication error occurred.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* Top Bar */}
        <View style={[styles.topBar, { borderBottomColor: colors.borderSubtle }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.topTitle, { color: colors.text }]}>
            {isSignUp ? 'Create Account' : 'Sign In to stutosed'}
          </Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Brand Header */}
          <View style={styles.brandSection}>
            <View
              style={[
                styles.brandBadge,
                { backgroundColor: colors.bgCardSubtle, borderColor: colors.border },
              ]}
            >
              <Sparkles size={14} color={colors.accent} />
              <Text style={[styles.brandBadgeText, { color: colors.accent }]}>
                Cloud Synced via Turso
              </Text>
            </View>
            <Text style={[styles.heading, { color: colors.text }]}>
              {isSignUp ? 'Start Learning Free' : 'Welcome Back, Student'}
            </Text>
            <Text style={[styles.subheading, { color: colors.textMuted }]}>
              {isSignUp
                ? 'Sync your watched lectures, bookmarks, and syllabus across Web and Android.'
                : 'Sign in to restore your watched progress and saved courses.'}
            </Text>
          </View>

          {/* Form Card */}
          <View
            style={[
              styles.card,
              { backgroundColor: colors.bgCard, borderColor: colors.border },
            ]}
          >
            {/* Mode Switcher */}
            <View
              style={[
                styles.modeSwitcher,
                { backgroundColor: colors.bgCardSubtle, borderColor: colors.border },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.modeTab,
                  !isSignUp && { backgroundColor: colors.accent },
                ]}
                onPress={() => {
                  setIsSignUp(false);
                  setMessage(null);
                }}
              >
                <Text
                  style={[
                    styles.modeTabText,
                    { color: !isSignUp ? '#ffffff' : colors.textMuted },
                  ]}
                >
                  Sign In
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modeTab,
                  isSignUp && { backgroundColor: colors.accent },
                ]}
                onPress={() => {
                  setIsSignUp(true);
                  setMessage(null);
                }}
              >
                <Text
                  style={[
                    styles.modeTabText,
                    { color: isSignUp ? '#ffffff' : colors.textMuted },
                  ]}
                >
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>

            {/* Google OAuth Button */}
            <TouchableOpacity
              style={[
                styles.googleBtn,
                { backgroundColor: colors.bgCardSubtle, borderColor: colors.border },
              ]}
              onPress={handleGoogleLogin}
              disabled={loading}
              activeOpacity={0.75}
            >
              <Text style={styles.googleIcon}>G</Text>
              <Text style={[styles.googleBtnText, { color: colors.text }]}>
                Continue with Google
              </Text>
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, { color: colors.textDim }]}>OR EMAIL</Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>

            {/* Feedback Banner */}
            {message && (
              <View
                style={[
                  styles.messageBox,
                  {
                    backgroundColor:
                      message.type === 'error'
                        ? `${colors.red}18`
                        : `${colors.green}18`,
                    borderColor:
                      message.type === 'error' ? colors.red : colors.green,
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

            {/* Full Name (Sign Up only) */}
            {isSignUp && (
              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: colors.textMuted }]}>Full Name</Text>
                <View
                  style={[
                    styles.inputWrap,
                    { backgroundColor: colors.bgInput, borderColor: colors.border },
                  ]}
                >
                  <User size={16} color={colors.textDim} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="e.g. Rahul Kumar"
                    placeholderTextColor={colors.textDim}
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                  />
                </View>
              </View>
            )}

            {/* Email */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.textMuted }]}>Email Address</Text>
              <View
                style={[
                  styles.inputWrap,
                  { backgroundColor: colors.bgInput, borderColor: colors.border },
                ]}
              >
                <Mail size={16} color={colors.textDim} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="student@example.com"
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
              <Text style={[styles.label, { color: colors.textMuted }]}>Password</Text>
              <View
                style={[
                  styles.inputWrap,
                  { backgroundColor: colors.bgInput, borderColor: colors.border },
                ]}
              >
                <Lock size={16} color={colors.textDim} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder={isSignUp ? 'Minimum 8 characters' : 'Enter password'}
                  placeholderTextColor={colors.textDim}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPassword((v) => !v)}>
                  {showPassword ? (
                    <EyeOff size={16} color={colors.textDim} />
                  ) : (
                    <Eye size={16} color={colors.textDim} />
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

            {/* Confirm Password (Sign Up only) */}
            {isSignUp && (
              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: colors.textMuted }]}>
                  Confirm Password
                </Text>
                <View
                  style={[
                    styles.inputWrap,
                    { backgroundColor: colors.bgInput, borderColor: colors.border },
                  ]}
                >
                  <Lock size={16} color={colors.textDim} />
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
                      <EyeOff size={16} color={colors.textDim} />
                    ) : (
                      <Eye size={16} color={colors.textDim} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitBtn,
                { backgroundColor: colors.accent, opacity: loading ? 0.7 : 1 },
              ]}
              onPress={handleEmailAuth}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.submitBtnText}>
                  {isSignUp ? 'Create Free Account' : 'Sign In'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.securityFooter}>
            <ShieldCheck size={14} color={colors.green} />
            <Text style={[styles.securityText, { color: colors.textDim }]}>
              Secured by Better Auth & Turso Edge Encryption
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    gap: spacing.md,
  },
  backBtn: {
    padding: 4,
  },
  topTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  scrollContent: {
    padding: spacing.base,
    paddingBottom: spacing.huge,
  },
  brandSection: {
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  brandBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  heading: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subheading: {
    fontSize: 13,
    lineHeight: 19,
  },
  card: {
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.lg,
  },
  modeSwitcher: {
    flexDirection: 'row',
    borderRadius: radii.md,
    borderWidth: 1,
    padding: 4,
    marginBottom: spacing.lg,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radii.sm,
    alignItems: 'center',
  },
  modeTabText: {
    fontSize: 13,
    fontWeight: '700',
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 12,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  googleIcon: {
    fontSize: 16,
    fontWeight: '800',
    color: '#4285F4',
  },
  googleBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
    gap: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  messageBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  messageText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  fieldGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    height: 46,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 14,
  },
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 6,
  },
  strengthBars: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
  },
  strengthBar: {
    flex: 1,
    height: 3,
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  submitBtn: {
    paddingVertical: 14,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  securityFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.xl,
  },
  securityText: {
    fontSize: 11,
  },
});
