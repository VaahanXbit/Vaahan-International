import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Image, FlatList, Alert, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { pickAndStoreRTO, getStoredDocuments, deleteDocument, DocumentMeta } from '../src/services/documents';
import { theme } from '../src/theme';

const DOC_TYPES = ['Registration', 'Insurance', 'Permit', 'Pollution certificate'];

export default function DocumentsScreen() {
  const [docs, setDocs] = useState<DocumentMeta[]>([]);
  const [loading, setLoading] = useState<string | null>(null);

  const refresh = () => getStoredDocuments().then(setDocs);

  useEffect(() => {
    refresh();
  }, []);

  const handlePick = async (label: string) => {
    setLoading(label);
    await pickAndStoreRTO(label);
    setLoading(null);
    refresh();
  };

  const handleOpen = async (doc: DocumentMeta) => {
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(doc.localUri);
    } else {
      Alert.alert('Cannot open file', 'Sharing is not available on this device.');
    }
  };

  const handleDelete = async (id: string) => {
    await deleteDocument(id);
    refresh();
  };

  const uploadedLabels = new Set(docs.map((d) => d.label));
  const missingTypes = DOC_TYPES.filter((t) => !uploadedLabels.has(t));

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerLabel}>RTO COMPLIANCE</Text>
          <Text style={styles.title}>DOCUMENTS</Text>
        </View>

        {/* Document List */}
        <FlatList
          data={docs}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Pressable style={styles.docCard} onPress={() => handleOpen(item)}>
              {item.type.startsWith('image/') ? (
                <Image source={{ uri: item.localUri }} style={styles.thumb} />
              ) : (
                <View style={styles.pdfBadge}>
                  <Text style={styles.pdfBadgeText}>PDF</Text>
                </View>
              )}
              <View style={styles.docInfo}>
                <Text style={styles.docLabel}>{item.label}</Text>
                <Text style={styles.fileName} numberOfLines={1}>
                  {item.fileName}
                </Text>
              </View>
              <Pressable onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
                <Text style={styles.deleteBtnText}>Remove</Text>
              </Pressable>
            </Pressable>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>No documents uploaded yet.</Text>
          }
        />

        {/* Upload Panel */}
        <View style={styles.uploadPanel}>
          <Text style={styles.sectionLabel}>ADD REQUIRED DOCUMENT</Text>
          {missingTypes.length === 0 ? (
            <Text style={styles.allUploadedText}>✓ All required documents uploaded</Text>
          ) : (
            missingTypes.map((label) => (
              <Pressable
                key={label}
                style={({ pressed }) => [
                  styles.uploadBtn,
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => handlePick(label)}
                disabled={!!loading}
              >
                <Text style={styles.uploadBtnText}>
                  {loading === label ? 'Uploading...' : `Upload ${label}`}
                </Text>
              </Pressable>
            ))
          )}

          <Pressable
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>BACK</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  header: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  headerLabel: {
    ...theme.typography.labelCaps,
    color: theme.colors.textMuted,
  },
  title: {
    ...theme.typography.headlineMd,
    color: theme.colors.text,
    marginTop: theme.spacing.xs,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingVertical: theme.spacing.xs,
  },
  empty: {
    color: theme.colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    marginTop: theme.spacing.xl,
  },
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.rounded.md,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.sm,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: theme.rounded.sm,
    marginRight: theme.spacing.md,
  },
  pdfBadge: {
    width: 48,
    height: 48,
    borderRadius: theme.rounded.sm,
    backgroundColor: '#EF444415',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  pdfBadgeText: {
    color: theme.colors.danger,
    fontWeight: '700',
    fontSize: 12,
  },
  docInfo: {
    flex: 1,
  },
  docLabel: {
    ...theme.typography.bodyLg,
    color: theme.colors.text,
    fontWeight: '600',
  },
  fileName: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  deleteBtn: {
    paddingLeft: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  deleteBtnText: {
    color: theme.colors.danger,
    fontSize: 13,
    fontWeight: '600',
  },
  uploadPanel: {
    marginTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  sectionLabel: {
    ...theme.typography.labelCaps,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.xs,
  },
  allUploadedText: {
    color: theme.colors.success,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: theme.spacing.md,
  },
  uploadBtn: {
    backgroundColor: theme.colors.primary,
    height: 48,
    borderRadius: theme.rounded.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadBtnText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  backButton: {
    backgroundColor: theme.colors.card,
    height: 48,
    borderRadius: theme.rounded.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginTop: theme.spacing.xs,
  },
  backButtonText: {
    color: theme.colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.85,
  },
});