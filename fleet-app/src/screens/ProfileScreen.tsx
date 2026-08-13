import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import theme from '../theme';
import { MaterialIcons } from '@expo/vector-icons';
import { api } from '../api/client';
import { setUser } from '../store/authSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const ProfileScreen: React.FC = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: any) => state.auth.user);

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [gstNumber, setGstNumber] = useState(user?.gstNumber || '');

  if (!user) {
    return (
      <View style={styles.fallbackContainer}>
        <Text style={[theme.typography.bodyLg, { color: theme.colors.onSurfaceVariant }]}>
          Not Logged In
        </Text>
      </View>
    );
  }

  const handleSave = async () => {
    if (!name.trim() || !email.trim() || !phone.trim() || !gstNumber.trim()) {
      Alert.alert('Validation Error', 'All fields are required.');
      return;
    }

    try {
      const response = await api.updateCompany(
        user.companyId,
        name.trim(),
        email.trim(),
        phone.trim(),
        gstNumber.trim()
      );

      if (response.data?.status === 'success') {
        const updatedPayload = {
          ...user,
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          gstNumber: gstNumber.trim(),
        };

        await AsyncStorage.setItem('fleetUser', JSON.stringify(updatedPayload));
        dispatch(setUser(updatedPayload));
        setIsEditing(false);
        Alert.alert('Success', 'Profile updated successfully.');
      } else {
        Alert.alert('Update Failed', 'Failed to update company details.');
      }
    } catch (e: any) {
      console.error('Error updating profile:', e);
      const errorMsg = e.response?.data?.detail || 'An error occurred while saving profile changes.';
      Alert.alert('Error', errorMsg);
    }
  };

  const handleCancel = () => {
    setName(user.name || '');
    setEmail(user.email || '');
    setPhone(user.phone || '');
    setGstNumber(user.gstNumber || '');
    setIsEditing(false);
  };

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.profileHeader}>
        <View style={styles.avatarBox}>
          <MaterialIcons name="business" size={40} color={theme.colors.brandTeal} />
        </View>
        
        {isEditing ? (
          <TextInput
            style={styles.nameInput}
            value={name}
            onChangeText={setName}
            placeholder="Fleet Name"
            placeholderTextColor={theme.colors.onSurfaceVariant}
          />
        ) : (
          <Text style={[theme.typography.headlineMd, styles.title]}>{user.name}</Text>
        )}
        <Text style={[theme.typography.bodyMd, styles.subtitle]}>Fleet Operations Owner</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={[theme.typography.labelCaps, styles.cardHeading]}>FLEET ACCESS PIN</Text>
          {!isEditing && (
            <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
              <MaterialIcons name="edit" size={16} color={theme.colors.brandTeal} />
              <Text style={styles.editButtonText}>Edit Details</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.cardSubtitle}>
          Provide this code to your drivers so they can connect to your fleet from the Driver App.
        </Text>
        <View style={styles.pinBox}>
          <Text style={styles.pinText}>{user.uniquePin || '------'}</Text>
        </View>
      </View>

      <View style={styles.detailsGroup}>
        <Text style={[theme.typography.labelCaps, styles.groupTitle]}>COMPANY METADATA</Text>

        <View style={styles.detailItem}>
          <MaterialIcons name="email" size={20} color={theme.colors.onSurfaceVariant} />
          <View style={styles.detailTextCol}>
            <Text style={[theme.typography.labelCaps, styles.detailLabel]}>EMAIL ADDRESS</Text>
            {isEditing ? (
              <TextInput
                style={styles.fieldInput}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            ) : (
              <Text style={[theme.typography.bodyLg, styles.detailVal]}>{user.email}</Text>
            )}
          </View>
        </View>

        <View style={styles.detailItem}>
          <MaterialIcons name="phone" size={20} color={theme.colors.onSurfaceVariant} />
          <View style={styles.detailTextCol}>
            <Text style={[theme.typography.labelCaps, styles.detailLabel]}>CONTACT PHONE</Text>
            {isEditing ? (
              <TextInput
                style={styles.fieldInput}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            ) : (
              <Text style={[theme.typography.bodyLg, styles.detailVal]}>{user.phone || '------'}</Text>
            )}
          </View>
        </View>

        <View style={styles.detailItem}>
          <MaterialIcons name="place" size={20} color={theme.colors.onSurfaceVariant} />
          <View style={styles.detailTextCol}>
            <Text style={[theme.typography.labelCaps, styles.detailLabel]}>CITY OPERATIONS</Text>
            <Text style={[theme.typography.bodyLg, styles.detailVal]}>{user.city || '------'}</Text>
          </View>
        </View>

        <View style={styles.detailItem}>
          <MaterialIcons name="verified-user" size={20} color={theme.colors.onSurfaceVariant} />
          <View style={styles.detailTextCol}>
            <Text style={[theme.typography.labelCaps, styles.detailLabel]}>GST REGISTRATION</Text>
            {isEditing ? (
              <TextInput
                style={styles.fieldInput}
                value={gstNumber}
                onChangeText={setGstNumber}
                autoCapitalize="characters"
              />
            ) : (
              <Text style={[theme.typography.bodyLg, styles.detailVal]}>{user.gstNumber || '------'}</Text>
            )}
          </View>
        </View>
      </View>

      {isEditing && (
        <View style={styles.actionsRow}>
          <TouchableOpacity style={[styles.actionButton, styles.cancelBtn]} onPress={handleCancel}>
            <Text style={styles.cancelBtnText}>CANCEL</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.saveBtn]} onPress={handleSave}>
            <Text style={styles.saveBtnText}>SAVE CHANGES</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  container: {
    padding: 24,
    alignItems: 'center',
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 28,
    marginTop: 16,
    width: '100%',
  },
  avatarBox: {
    width: 80,
    height: 80,
    borderRadius: theme.rounded.md,
    backgroundColor: theme.colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
  title: {
    color: theme.colors.onSurface,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 4,
  },
  nameInput: {
    width: '100%',
    textAlign: 'center',
    color: theme.colors.onSurface,
    fontSize: 22,
    fontWeight: '800',
    backgroundColor: theme.colors.surfaceContainer,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.rounded.sm,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  card: {
    backgroundColor: theme.colors.surfaceContainer,
    borderRadius: theme.rounded.lg,
    padding: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    marginBottom: 28,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardHeading: {
    color: theme.colors.brandTeal,
    fontWeight: '700',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editButtonText: {
    ...theme.typography.labelCaps,
    color: theme.colors.brandTeal,
    fontWeight: '700',
  },
  cardSubtitle: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 18,
    marginBottom: 16,
  },
  pinBox: {
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: theme.rounded.DEFAULT,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
  pinText: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.primary,
    letterSpacing: 4,
  },
  detailsGroup: {
    width: '100%',
    backgroundColor: theme.colors.surfaceContainer,
    borderRadius: theme.rounded.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    gap: 16,
  },
  groupTitle: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: 4,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  detailTextCol: {
    flex: 1,
  },
  detailLabel: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 9,
    marginBottom: 2,
  },
  detailVal: {
    color: theme.colors.onSurface,
    fontWeight: '600',
  },
  fieldInput: {
    color: theme.colors.onSurface,
    backgroundColor: theme.colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.rounded.sm,
    paddingVertical: 4,
    paddingHorizontal: 8,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
    marginTop: 24,
  },
  actionButton: {
    flex: 1,
    borderRadius: theme.rounded.DEFAULT,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: theme.colors.surfaceContainer,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
  cancelBtnText: {
    ...theme.typography.labelCaps,
    color: theme.colors.onSurface,
    fontWeight: '700',
  },
  saveBtn: {
    backgroundColor: theme.colors.brandTeal,
  },
  saveBtnText: {
    ...theme.typography.labelCaps,
    color: theme.colors.onPrimary,
    fontWeight: '700',
  },
});

export default ProfileScreen;
