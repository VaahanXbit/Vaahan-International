import { Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { File, Directory, Paths } from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DOC_LIST_KEY = 'rtoDocumentList';

export interface DocumentMeta {
  id: string;          
  label: string;        
  fileName: string;
  localUri: string;
  uploadedAt: string;
  type: string;
}

export async function pickAndStoreRTO(label: string): Promise<DocumentMeta | null> {
  if (Platform.OS === 'web') {
    console.warn('File system storage not supported on web — test on a physical device.');
    return null;
  }

  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/pdf', 'image/*'],
    copyToCacheDirectory: true,
  });
  if (result.canceled) return null;

  const picked = result.assets[0];

  const docsDir = new Directory(Paths.document, 'rto_docs');
  if (!docsDir.exists) docsDir.create({ intermediates: true });

  const id = `${label.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
  const extension = picked.name.split('.').pop() || 'pdf';
  const sourceFile = new File(picked.uri);
  const destFile = new File(docsDir, `${id}.${extension}`);

  sourceFile.copy(destFile);

  const meta: DocumentMeta = {
    id,
    label,
    fileName: picked.name,
    localUri: destFile.uri,
    uploadedAt: new Date().toISOString(),
    type: picked.mimeType || 'application/octet-stream',
  };

  const list = await getStoredDocuments();
  // Replace if a document with the same label already exists, otherwise add
  const updated = [...list.filter((d) => d.label !== label), meta];
  await AsyncStorage.setItem(DOC_LIST_KEY, JSON.stringify(updated));

  return meta;
}

export async function getStoredDocuments(): Promise<DocumentMeta[]> {
  const json = await AsyncStorage.getItem(DOC_LIST_KEY);
  return json ? JSON.parse(json) : [];
}

export async function deleteDocument(id: string): Promise<void> {
  const list = await getStoredDocuments();
  const doc = list.find((d) => d.id === id);
  if (doc) {
    const file = new File(doc.localUri);
    if (file.exists) file.delete();
  }
  const updated = list.filter((d) => d.id !== id);
  await AsyncStorage.setItem(DOC_LIST_KEY, JSON.stringify(updated));
}
