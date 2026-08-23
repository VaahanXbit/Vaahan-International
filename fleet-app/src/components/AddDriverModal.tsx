import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import theme from '../theme';
import { addDriver, updateDriver } from '../data/mockFleetData';

interface AddDriverModalProps {
  visible: boolean;
  onClose: () => void;
  onDriverAdded: () => void;
  editDriverId?: string;
  initialName?: string;
  initialVehicle?: string;
}

export const AddDriverModal: React.FC<AddDriverModalProps> = ({
  visible,
  onClose,
  onDriverAdded,
  editDriverId,
  initialName = '',
  initialVehicle = '',
}) => {
  const [name, setName] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setName(initialName);
      setVehicle(initialVehicle);
    }
  }, [visible, initialName, initialVehicle]);

  const handleSave = async () => {
    if (!name.trim() || !vehicle.trim()) return;

    setLoading(true);

    if (editDriverId) {
      // TODO(backend): PUT/POST updated driver/vehicle to backend instead of local
      // state only; update mockFleetData source once persistence exists.
      await updateDriver(editDriverId, name.trim(), vehicle.trim());
    } else {
      // TODO(backend): POST new driver/vehicle to backend instead of local
      // state only; update mockFleetData source once persistence exists.
      await addDriver(name.trim(), vehicle.trim());
    }

    setLoading(false);
    setName('');
    setVehicle('');
    onDriverAdded();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <SafeAreaView edges={['bottom']} style={styles.safeArea}>
            <View style={styles.modalContent}>
              <View style={styles.header}>
                <Text style={[theme.typography.headlineMd, { color: theme.colors.onSurface }]}>
                  {editDriverId ? 'Edit Driver Profile' : 'Add New Driver'}
                </Text>
                <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
                  <Text style={[theme.typography.bodyLg, { color: theme.colors.onSurfaceVariant }]}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.form}>
                <View style={styles.inputContainer}>
                  <Text style={[theme.typography.labelCaps, styles.label]}>Driver Name</Text>
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="Enter driver name"
                    placeholderTextColor={theme.colors.onSurfaceVariant}
                    autoCapitalize="words"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={[theme.typography.labelCaps, styles.label]}>Vehicle Number / Name</Text>
                  <TextInput
                    style={styles.input}
                    value={vehicle}
                    onChangeText={setVehicle}
                    placeholder="e.g. Truck #402"
                    placeholderTextColor={theme.colors.onSurfaceVariant}
                    autoCapitalize="characters"
                  />
                </View>

                <TouchableOpacity
                  style={[
                    styles.saveButton,
                    { opacity: (!name.trim() || !vehicle.trim() || loading) ? 0.6 : 1 }
                  ]}
                  onPress={handleSave}
                  disabled={!name.trim() || !vehicle.trim() || loading}
                  activeOpacity={0.8}
                >
                  <Text style={[theme.typography.labelCaps, { color: theme.colors.onPrimary, fontSize: 13 }]}>
                    {loading ? 'SAVING...' : editDriverId ? 'SAVE CHANGES' : 'SAVE DRIVER'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  keyboardView: {
    width: '100%',
  },
  safeArea: {
    width: '100%',
  },
  modalContent: {
    backgroundColor: theme.colors.surfaceContainer,
    borderTopLeftRadius: theme.rounded.xl,
    borderTopRightRadius: theme.rounded.xl,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    padding: theme.spacing.gutter,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.gutter,
  },
  form: {
    gap: theme.spacing.unit * 5,
  },
  inputContainer: {
    gap: theme.spacing.unit * 2,
  },
  label: {
    color: theme.colors.onSurfaceVariant,
  },
  input: {
    backgroundColor: theme.colors.surfaceContainerLow,
    color: theme.colors.onSurface,
    borderRadius: theme.rounded.DEFAULT,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    paddingHorizontal: theme.spacing.unit * 4,
    paddingVertical: theme.spacing.unit * 3,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.rounded.DEFAULT,
    paddingVertical: theme.spacing.unit * 4,
    alignItems: 'center',
    marginTop: theme.spacing.unit * 2,
  },
});
export default AddDriverModal;
