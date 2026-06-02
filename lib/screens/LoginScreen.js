import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Image, StatusBar,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../services/firebase';
import { loginWithGoogle } from '../services/authApi';
import { useAuth } from '../context/AuthContext';
import { GOOGLE_WEB_CLIENT_ID } from '../config/api';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID });

export default function LoginScreen() {
  const { signIn } = useAuth();
  const insets = useSafeAreaInsets();

  // Estados para el login con Google original
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);

  // Estados obligatorios para el EXAMEN (Formulario Clásico)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoadingGoogle(true);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken || userInfo.idToken;
      if (!idToken) throw new Error('No se recibió token de Google');

      const credential = GoogleAuthProvider.credential(idToken);
      const firebaseUser = await signInWithCredential(auth, credential);

      const firebaseIdToken = await firebaseUser.user.getIdToken();
      const userData = await loginWithGoogle(firebaseIdToken);
      await signIn(userData);
    } catch (error) {
      console.error('Login error:', error);
      if (error.code !== statusCodes.SIGN_IN_CANCELLED && error.code !== statusCodes.IN_PROGRESS) {
        Alert.alert('Error de Autenticación', error.message || 'No se pudo iniciar sesión.', [{ text: 'OK' }]);
      }
    } finally {
      setIsLoadingGoogle(false);
    }
  };

  // --- LÓGICA DE EXAMEN (Validaciones y RegEx) ---
  const validateForm = () => {
    let newErrors = {};

    // CA2: RegEx de Correo Electrónico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      newErrors.email = 'El correo es obligatorio.';
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'Ingrese un formato de correo válido (ej. usuario@dominio.com).';
    }

    // CA2: RegEx de Contraseña (Mínimo 8 chars, 1 mayúscula, 1 minúscula, 1 número)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
    if (!password) {
      newErrors.password = 'La contraseña es obligatoria.';
    } else if (!passwordRegex.test(password)) {
      newErrors.password = 'Debe tener min. 8 caracteres, 1 mayúscula, 1 minúscula y 1 número.';
    }

    setErrors(newErrors);
    // CA1: Validar si el objeto de errores está vacío
    return Object.keys(newErrors).length === 0;
  };

  const handleEmailSubmit = () => {
    if (validateForm()) {
      setIsSubmittingForm(true);

      // CA3: Simulación de carga (deshabilitar por 2 segundos)
      setTimeout(() => {
        setIsSubmittingForm(false);
        // Aquí iría la lógica real de inicio de sesión
        Alert.alert("Éxito", "Validación superada. Simulando inicio de sesión exitoso.");
      }, 2000);
    }
  };

  // --- BYPASS DE LOGIN PARA PRUEBAS LOCALES ---
  const handleDevLogin = async () => {
    const fakeUser = {
      id: 999,
      name: 'Grehuanca Merma',
      email: 'grehuanca@upt.pe',
      photo_url: null,
      career: 'Ingeniería de Sistemas',
      student_code: '2022073898',
      role: 'student',
      is_active: true,
    };
    await signIn(fakeUser);
  };
  // -------------------------------------------

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />

      {/* Top gradient section */}
      <View style={[styles.topSection, { paddingTop: insets.top + 40 }]}>
        {/* Decorative circles */}
        <View style={styles.decorCircle1} />
        <View style={styles.decorCircle2} />

        <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Ionicons name="school" size={44} color={COLORS.textLight} />
          </View>
        </Animated.View>

        <Animated.Text entering={FadeInDown.delay(400).duration(600)} style={styles.brandName}>
          RCE UPT
        </Animated.Text>
        <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.brandLine} />
        <Animated.Text entering={FadeInDown.delay(600).duration(400)} style={styles.brandSub}>
          Red Colaborativa Estudiantil
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(700).duration(400)} style={styles.brandInstitution}>
          Universidad Privada de Tacna
        </Animated.Text>
      </View>

      {/* Bottom card */}
      <Animated.View entering={FadeInUp.delay(300).duration(700)} style={[styles.bottomSection, { paddingBottom: Math.max(insets.bottom, 32) }]}>
        <Text style={styles.welcomeTitle}>Bienvenido</Text>
        <Text style={styles.welcomeSub}>
          Conecta con la comunidad académica. Publica dudas, ofrece mentoría y gana experiencia.
        </Text>

        {/* FORMULARIO DE EXAMEN (React Native Equivalente a Flutter Form) */}

        {/* Campo de Correo Electrónico */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Correo Electrónico</Text>
          <View style={[styles.inputWrapper, errors.email && styles.inputErrorBorder]}>
            <Ionicons name="mail-outline" size={20} color={COLORS.textSecondary} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.input}
              placeholder="usuario@dominio.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address" // CA3: Teclado óptimo
              autoCapitalize="none"
              editable={!isSubmittingForm}
            />
          </View>
          {/* CA1: Mensaje de error dinámico debajo del input en color rojo */}
          {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
        </View>

        {/* Campo de Contraseña */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Contraseña</Text>
          <View style={[styles.inputWrapper, errors.password && styles.inputErrorBorder]}>
            <Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.input}
              placeholder="********"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword} // CA3: Ocultar texto
              editable={!isSubmittingForm}
            />
            {/* CA3: Botón Ojo */}
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
        </View>

        {/* CA3: Botón de Envío con Estado de Carga */}
        <TouchableOpacity
          style={[styles.submitBtn, isSubmittingForm && styles.submitBtnDisabled]}
          onPress={handleEmailSubmit}
          disabled={isSubmittingForm}
        >
          {isSubmittingForm ? (
            <ActivityIndicator color={COLORS.textLight} size="small" />
          ) : (
            <Text style={styles.submitBtnText}>Iniciar Sesión</Text>
          )}
        </TouchableOpacity>

        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>O</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={[styles.googleBtn, isLoadingGoogle && styles.googleBtnDisabled]}
          onPress={handleGoogleLogin}
          disabled={isLoadingGoogle || isSubmittingForm}
          activeOpacity={0.8}
        >
          {isLoadingGoogle ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={COLORS.primary} size="small" />
              <Text style={styles.loadingText}>Conectando...</Text>
            </View>
          ) : (
            <View style={styles.googleBtnContent}>
              <Image
                source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }}
                style={styles.googleIcon}
              />
              <Text style={styles.googleBtnLabel}>Continuar con Google</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.domainNotice}>
          <Ionicons name="lock-open-outline" size={14} color={COLORS.success} style={{ marginRight: 6 }} />
          <Text style={styles.domainText}>Acceso con cualquier cuenta Google</Text>
        </View>

        <Text style={styles.footerText}>
          Plataforma de mentoría académica P2P
        </Text>

        {/* BOTÓN DE PRUEBA LOCAL - Solo para desarrollo */}
        <TouchableOpacity style={styles.devBtn} onPress={handleDevLogin}>
          <Ionicons name="bug-outline" size={14} color="#888" style={{ marginRight: 6 }} />
          <Text style={styles.devBtnText}>Entrar como Grehuanca (Dev)</Text>
        </TouchableOpacity>

      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  topSection: {
    flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: SPACING.xl,
    overflow: 'hidden', position: 'relative',
  },
  decorCircle1: {
    position: 'absolute', top: -60, right: -50,
    width: 220, height: 220, borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  decorCircle2: {
    position: 'absolute', bottom: -30, left: -40,
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  logoContainer: { marginBottom: SPACING.lg },
  logoCircle: {
    width: 90, height: 90, borderRadius: RADIUS.full, backgroundColor: COLORS.accent,
    justifyContent: 'center', alignItems: 'center', ...SHADOWS.large,
  },
  brandName: {
    fontSize: FONTS.sizes.display, fontWeight: '800', color: COLORS.textLight,
    textAlign: 'center', letterSpacing: 2, marginBottom: SPACING.sm,
  },
  brandLine: { width: 44, height: 3, borderRadius: 2, backgroundColor: COLORS.accent, marginBottom: SPACING.md },
  brandSub: { fontSize: FONTS.sizes.lg, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },
  brandInstitution: { fontSize: FONTS.sizes.sm, color: 'rgba(255,255,255,0.5)', fontWeight: '500', marginTop: SPACING.xs },
  bottomSection: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl,
    paddingHorizontal: SPACING.xl, paddingTop: SPACING.xxl,
    ...SHADOWS.large,
  },
  welcomeTitle: { fontSize: FONTS.sizes.hero, fontWeight: '800', color: COLORS.textPrimary, marginBottom: SPACING.sm },
  welcomeSub: { fontSize: FONTS.sizes.md, color: COLORS.textSecondary, lineHeight: 24, marginBottom: SPACING.xl },
  googleBtn: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.sm, paddingVertical: 16, paddingHorizontal: SPACING.lg,
    borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.medium,
  },
  googleBtnDisabled: { opacity: 0.7 },
  googleBtnContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  googleIcon: { width: 22, height: 22, marginRight: SPACING.md },
  googleBtnLabel: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.textPrimary },
  loadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginLeft: SPACING.sm, fontSize: FONTS.sizes.md, fontWeight: '600', color: COLORS.primary },
  domainNotice: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: SPACING.lg,
  },
  domainText: { fontSize: FONTS.sizes.sm, color: COLORS.success, fontWeight: '600' },
  footerText: {
    fontSize: FONTS.sizes.xs, color: COLORS.textMuted, textAlign: 'center', marginTop: SPACING.xl,
  },

  // Estilos del Formulario Clásico
  inputContainer: { marginBottom: SPACING.lg },
  inputLabel: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.textSecondary, marginBottom: SPACING.xs },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background,
    borderWidth: 1, borderColor: COLORS.borderLight, borderRadius: RADIUS.sm, paddingHorizontal: SPACING.md
  },
  inputErrorBorder: { borderColor: 'red', borderWidth: 1.5 },
  input: { flex: 1, paddingVertical: 14, fontSize: FONTS.sizes.md, color: COLORS.textPrimary },
  errorText: { color: 'red', fontSize: FONTS.sizes.xs, marginTop: 4, fontWeight: '500' },
  eyeBtn: { padding: 8 },
  submitBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.sm, paddingVertical: 16,
    alignItems: 'center', marginTop: SPACING.md, ...SHADOWS.medium
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { color: COLORS.textLight, fontSize: FONTS.sizes.md, fontWeight: '700' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: SPACING.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.borderLight },
  dividerText: { marginHorizontal: SPACING.sm, color: COLORS.textMuted, fontSize: FONTS.sizes.sm },
  devBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginTop: SPACING.md, paddingVertical: 8,
  },
  devBtnText: { fontSize: 12, color: '#aaa' },
});
