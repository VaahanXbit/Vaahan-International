import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import theme from '../theme';

export const ProfileScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={[theme.typography.headlineMd, styles.text]}>Profile Screen</Text>
      <Text style={[theme.typography.bodyMd, styles.subtext]}>Placeholder for Company and Fleet Settings</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  text: {
    color: theme.colors.onSurface,
  },
  subtext: {
    color: theme.colors.onSurfaceVariant,
    marginTop: 8,
  },
});

export default ProfileScreen;
