import React, { useState, useMemo } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';

const ROLES = [
    { key: 'lawyer', label: 'Lawyer', emoji: '⚖️', subtitle: 'Manage cases & clients' },
    { key: 'client', label: 'Client', emoji: '👤', subtitle: 'View your cases' },
];

const createStyles = (colors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
    header: { alignItems: 'center', marginBottom: 24 },
    emoji: { fontSize: 60, marginBottom: 10 },
    title: { fontSize: 28, fontWeight: '900', color: colors.text },
    subtitle: { fontSize: 16, color: colors.textSecondary, fontWeight: '600' },
    roleRow: {
        flexDirection: 'row', gap: 12, marginBottom: 24, justifyContent: 'center',
    },
    roleBtn: {
        flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 2,
        borderColor: colors.border, alignItems: 'center', backgroundColor: colors.surface,
    },
    roleBtnActive: {
        borderColor: colors.primary, backgroundColor: colors.indigo50,
    },
    roleBtnText: { fontWeight: '700', fontSize: 14, color: colors.textSecondary },
    roleBtnTextActive: { color: colors.primary },
    form: { backgroundColor: colors.surface, padding: 20, borderRadius: 16, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
    label: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, marginBottom: 6, marginTop: 12 },
    input: {
        borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, fontSize: 16, color: colors.text, backgroundColor: colors.background
    },
    btn: { backgroundColor: colors.primary, borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 24 },
    btnDisabled: { opacity: 0.6 },
    btnText: { color: colors.white, fontWeight: '800', fontSize: 16 },
    demoRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginTop: 16 },
    demoBtn: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.primary, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12 },
    demoBtnText: { color: colors.primary, fontSize: 13, fontWeight: '700' },
    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
    footerText: { color: colors.textSecondary, fontSize: 14 },
    link: { color: colors.primary, fontWeight: '800', fontSize: 14 },
});

export default function LoginScreen({ navigation }) {
    const { login } = useApp();
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [role, setRole] = useState('lawyer');

    const fillLawyerDemo = () => {
        setRole('lawyer');
        setEmail('demo@gmail.com');
        setPassword('password123');
    };

    const fillClientDemo = () => {
        setRole('client');
        setEmail('demo_client@gmail.com');
        setPassword('password123');
    };

    const currentRole = ROLES.find((r) => r.key === role);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }
        setLoading(true);
        const res = await login(email, password);
        setLoading(false);
        if (!res.success) {
            Alert.alert('Login Failed', res.error);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.header}>
                    <Text style={styles.emoji}>{currentRole.emoji}</Text>
                    <Text style={styles.title}>Legal Workflow</Text>
                    <Text style={styles.subtitle}>{currentRole.subtitle}</Text>
                </View>

                {/* Role Toggle */}
                <View style={styles.roleRow}>
                    {ROLES.map((r) => (
                        <TouchableOpacity
                            key={r.key}
                            style={[styles.roleBtn, role === r.key && styles.roleBtnActive]}
                            onPress={() => setRole(r.key)}
                        >
                            <Text style={[styles.roleBtnText, role === r.key && styles.roleBtnTextActive]}>
                                {r.emoji} {r.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.form}>
                    <Text style={styles.label}>Email Address</Text>
                    <TextInput
                        style={styles.input}
                        placeholder={role === 'lawyer' ? 'lawyer@example.com' : 'client@example.com'}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />

                    <Text style={styles.label}>Password</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="••••••••"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />

                    <TouchableOpacity
                        style={[styles.btn, loading && styles.btnDisabled]}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        <Text style={styles.btnText}>{loading ? 'Logging in...' : 'Login'}</Text>
                    </TouchableOpacity>

                    <View style={styles.demoRow}>
                        <TouchableOpacity style={styles.demoBtn} onPress={fillLawyerDemo}>
                            <Text style={styles.demoBtnText}>Lawyer Demo</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.demoBtn} onPress={fillClientDemo}>
                            <Text style={styles.demoBtnText}>Client Demo</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Don't have an account? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                            <Text style={styles.link}>Create Account</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
