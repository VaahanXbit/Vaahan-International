import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import theme from '../theme';

export const ProfileScreen: React.FC = () => {
  const companyEmail = useSelector((state: any) => state.auth.user?.email);

  return (
    <View style={styles.container}>
      <Text style={[theme.typography.headlineMd, styles.text]}>Company Profile</Text>
      <Text style={[theme.typography.bodyLg, styles.subtext]}>
        {companyEmail || 'Not Logged In'}
      </Text>
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
    fontWeight: '700',
  },
  subtext: {
    color: theme.colors.primary,
    marginTop: 12,
    fontWeight: '500',
  },
});

export default ProfileScreen;
