import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';

export default function RegisterScreen({ navigation }) {
  const { register, resendVerification } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resent, setResent] = useState(false);

  const handleRegister = async () => {
    if (!username || !email || !password) return setError('Заполните все поля');
    if (password.length < 6) return setError('Пароль минимум 6 символов');
    setLoading(true);
    setError('');
    try {
      const data = await register(username, email, password);
      if (data.needsVerification) setNeedsVerification(true);
    } catch (e) {
      setError(e.message || 'Ошибка регистрации');
    }
    setLoading(false);
  };

  const handleResend = async () => {
    try {
      await resendVerification(email);
      setResent(true);
      setTimeout(() => setResent(false), 5000);
    } catch {}
  };

  if (needsVerification) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.logo}>✉️</Text>
          <Text style={styles.title}>Подтвердите email</Text>
          <Text style={styles.text}>
            Мы отправили письмо на {email}. Перейдите по ссылке в письме для подтверждения аккаунта.
          </Text>
          <TouchableOpacity style={styles.button} onPress={handleResend} disabled={resent}>
            <Text style={styles.buttonText}>{resent ? 'Отправлено!' : 'Отправить повторно'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.link}>Войти</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TextInput
          style={styles.input}
          placeholder="Имя пользователя"
          placeholderTextColor="#999"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Пароль"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Зарегистрироваться</Text>}
        </TouchableOpacity>

        <View style={styles.row}>
          <Text style={styles.gray}>Уже есть аккаунт? </Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.link}>Войти</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 12, color: '#1a1a2e' },
  text: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  logo: { fontSize: 48, textAlign: 'center', marginBottom: 12 },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 14,
    fontSize: 16, marginBottom: 12, backgroundColor: '#fafafa', color: '#1a1a2e',
  },
  button: {
    backgroundColor: '#6C5CE7', borderRadius: 12, padding: 16,
    alignItems: 'center', marginTop: 8, marginBottom: 16,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  link: { color: '#6C5CE7', fontSize: 14, fontWeight: '500', textAlign: 'center' },
  gray: { color: '#999', fontSize: 14 },
  row: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
  error: { color: '#e74c3c', textAlign: 'center', marginBottom: 12 },
});
