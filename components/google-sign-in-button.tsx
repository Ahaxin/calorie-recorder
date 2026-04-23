import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { useAuthStore } from '../stores/auth-store';
import { useTheme } from '../lib/theme';

interface GoogleSignInButtonProps {
  style?: ViewStyle;
}

export function GoogleSignInButton({ style }: GoogleSignInButtonProps): React.JSX.Element {
  const { googleSignIn } = useAuthStore();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);

  const handlePress = async (): Promise<void> => {
    setLoading(true);
    try {
      await googleSignIn();
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={loading}
      activeOpacity={0.8}
      style={[
        styles.button,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        loading && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#4285F4" size="small" />
      ) : (
        <View style={styles.inner}>
          <Text style={styles.gLogo}>G</Text>
          <Text style={[styles.label, { color: colors.text }]}>Continue with Google</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  disabled: {
    opacity: 0.5,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  gLogo: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4285F4',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
});
