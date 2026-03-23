import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Image, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { getDb, makeId } from '../database/db';
import { useTheme } from '../context/ThemeContext';
import { theme, buildTypography } from '../constants/theme';
import Header from '../components/Header';

export default function ClientDocUploadScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { requestId, caseId, title, description } = route.params || {};
  const { uploadDocumentForRequest, logActivity } = useApp();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);


  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [previewUri, setPreviewUri] = useState(null);
  const [previewKind, setPreviewKind] = useState(null); // 'image' | 'pdf' | other

  const inferFileMeta = (asset) => {
    const uri = asset?.uri || null;
    if (!uri) return null;

    const name = asset?.name || asset?.fileName || 'Unnamed';
    const mimeType = asset?.mimeType || '';
    const extFromName = name?.split('.').pop()?.toLowerCase() || '';
    const extFromMime = mimeType?.includes('/') ? mimeType.split('/').pop()?.toLowerCase() : '';
    const ext = extFromName || extFromMime || '';

    const fileType = ['pdf'].includes(ext)
      ? 'pdf'
      : ['jpg', 'jpeg', 'png', 'gif'].includes(ext)
        ? 'image'
        : (ext || 'file');

    return {
      uri,
      name,
      size: asset?.size ?? asset?.fileSize ?? null,
      fileType,
    };
  };

  const saveDocumentAssetToRequest = async (asset) => {
    const meta = inferFileMeta(asset);
    if (!meta) return;

    setUploading(true);
    try {
      const db = await getDb();
      const now = new Date().toISOString();
      const docId = makeId('doc');

      await db.runAsync(
        'INSERT INTO documents (id, case_id, name, uri, category, tags, created_at, file_size, file_type, uploaded_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [docId, caseId || null, meta.name || 'Unnamed', meta.uri || null, 'Client Upload', 'client-upload', now, meta.size, meta.fileType, now]
      );

      // Link document to request
      await uploadDocumentForRequest(requestId, docId);
      await logActivity('document', docId, 'client_uploaded', `Client uploaded: ${meta.name || 'file'}`);

      setPreviewUri(meta.uri);
      setPreviewKind(meta.fileType);
      setUploaded(true);
      Alert.alert('Success!', 'Your document has been uploaded and sent to your lawyer.');
    } catch (e) {
      Alert.alert('Error', 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handlePickFile = async () => {
    try {
      const DocumentPicker = require('expo-document-picker');
      const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
      if (result.canceled) return;
      const file = result.assets?.[0];
      if (!file) return;

      await saveDocumentAssetToRequest(file);
    } catch (e) {
      Alert.alert('Error', 'File picker not available. Please ensure expo-document-picker is installed.');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const ImagePicker = require('expo-image-picker');
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm?.granted) {
        Alert.alert('Camera permission required', 'Please allow camera access to take a photo.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset) return;
      await saveDocumentAssetToRequest(asset);
    } catch (e) {
      Alert.alert('Error', 'Camera not available on this device.');
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Upload Document" showBack onBack={() => navigation.goBack()} />

      <View style={styles.content}>
        <View style={styles.requestCard}>
          <Text style={styles.requestLabel}>REQUESTED DOCUMENT</Text>
          <Text style={styles.requestTitle}>{title || 'Document'}</Text>
          {!!description && <Text style={styles.requestDesc}>{description}</Text>}
        </View>

        <View style={styles.uploadArea}>
          <Text style={styles.uploadIcon}>📎</Text>
          <Text style={styles.uploadHint}>
            {uploaded
              ? 'Document uploaded successfully!'
              : 'Choose a file, or take a photo of the document.'}
          </Text>

          {!uploaded && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.cameraHeaderBtn, uploading && styles.btnDisabled]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  handleTakePhoto();
                }}
                disabled={uploading}
              >
                <View style={styles.cameraCircle}>
                  <Text style={styles.cameraEmoji}>📷</Text>
                </View>
                <Text style={styles.cameraActionText}>Capture Document</Text>
                <Text style={styles.cameraActionSub}>Use your camera to take a clear photo</Text>
              </TouchableOpacity>

              <View style={styles.orDivider}>
                <View style={styles.dividerLine} />
                <Text style={styles.orText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={[styles.pickBtn, uploading && styles.btnDisabled]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  handlePickFile();
                }}
                disabled={uploading}
              >
                <Text style={styles.pickBtnText}>
                  {uploading ? 'Processing...' : '📁 Choose from Files'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {uploaded && (
            <View style={styles.uploadedBlock}>
              {previewUri && previewKind === 'image' && (
                <View style={styles.previewWrap}>
                  <Image source={{ uri: previewUri }} style={styles.previewImage} resizeMode="cover" />
                </View>
              )}
              <View style={styles.successBadge}>
                <Text style={styles.successText}>✅ Submitted Successfully</Text>
              </View>
              {previewUri && previewKind !== 'image' && (
                <Text style={styles.fileNameText}>Saved: {title || 'Document'}</Text>
              )}

              <TouchableOpacity 
                style={styles.doneBtn} 
                onPress={() => {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  navigation.goBack();
                }}
              >
                <Text style={styles.doneBtnText}>Return to Case</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <Text style={styles.disclaimer}>
          Supported formats: PDF, JPEG, PNG, DOCX. Camera captures images (photos).
        </Text>
      </View>
    </View>
  );
}

const createStyles = (colors) => {
  const typo = buildTypography(colors);
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20 },

  requestCard: {
    backgroundColor: colors.surface, padding: 20, borderRadius: theme.radius.xl,
    borderWidth: 1, borderColor: colors.slate100, ...theme.shadows.sm, marginBottom: 24,
  },
  requestLabel: { ...typo.tiny, color: colors.slate400, marginBottom: 8 },
  requestTitle: { ...typo.h2, color: colors.slate950, marginBottom: 8 },
  requestDesc: { ...typo.body, color: colors.slate600 },

  uploadArea: {
    backgroundColor: colors.surface, padding: 32, borderRadius: theme.radius.xl,
    borderWidth: 2, borderColor: colors.slate200, borderStyle: 'dashed',
    alignItems: 'center', marginBottom: 20,
  },
  uploadIcon: { fontSize: 48, marginBottom: 12 },
  uploadHint: { ...typo.body, color: colors.slate500, textAlign: 'center', marginBottom: 20 },

  actionButtons: { width: '100%', gap: 12 },

  pickBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: theme.radius.md,
    ...theme.shadows.md,
    alignItems: 'center',
  },
  pickBtnText: { color: colors.white, fontWeight: '800', fontSize: 15 },

  cameraHeaderBtn: {
    backgroundColor: colors.surface,
    padding: 24,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: colors.slate200,
    alignItems: 'center',
    width: '100%',
    ...theme.shadows.md,
  },
  cameraCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cameraEmoji: { fontSize: 32 },
  cameraActionText: { ...typo.bodyBold, color: colors.slate900, fontSize: 17 },
  cameraActionSub: { ...typo.caption, color: colors.slate500, marginTop: 4 },

  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
    gap: 12,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.slate200 },
  orText: { ...typo.tiny, color: colors.slate400, fontWeight: '700' },

  cameraBtn: {
    backgroundColor: colors.slate800,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: theme.radius.md,
    ...theme.shadows.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.slate200,
  },
  cameraBtnText: { color: colors.white, fontWeight: '800', fontSize: 15 },

  btnDisabled: { opacity: 0.6 },

  successBadge: {
    backgroundColor: colors.successLight, paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: theme.radius.md,
  },
  successText: { color: '#166534', fontWeight: '800', fontSize: 15 },

  uploadedBlock: { alignItems: 'center' },

  previewWrap: {
    marginTop: -4,
    marginBottom: 12,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.slate200,
  },
  previewImage: { width: 160, height: 160, backgroundColor: colors.slate50 },

  fileNameText: { ...typo.caption, color: colors.slate400, marginTop: 10, textAlign: 'center' },

  doneBtn: {
    marginTop: 14,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: theme.radius.md,
    ...theme.shadows.md,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  doneBtnText: { color: colors.white, fontWeight: '800', fontSize: 15 },

  disclaimer: { ...typo.caption, color: colors.slate400, textAlign: 'center' },
});
};
