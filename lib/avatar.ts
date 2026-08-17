import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';

// Returns the public URL for an avatar given the owning user id + file name.
// Falls back to null when there's no avatar.
export function avatarPublicUrl(userId: string, fileName: string): string | null {
  if (!userId || !fileName) return null;
  const { data } = supabase.storage.from('avatars').getPublicUrl(`${userId}/${fileName}`);
  return data?.publicUrl ?? null;
}

// Uploads an image file (from expo-image-picker) into the user's avatar folder.
// Returns the stored file name, or throws on error.
export async function uploadAvatar(
  userId: string,
  file: { uri: string; mimeType?: string; fileName?: string }
): Promise<string> {
  const mime = file.mimeType || 'image/jpeg';
  const ext = mime.split('/')[1]?.split(';')[0] || 'jpg';
  const fileName = `avatar-${Date.now()}.${ext}`;
  const objectPath = `${userId}/${fileName}`;

  if (Platform.OS === 'web') {
    // On web, fetch the image blob and upload it directly. The RN-style
    // {uri,name,type} FormData hack sends an empty body in browsers.
    const res = await fetch(file.uri);
    if (!res.ok) throw new Error('Could not read the selected image.');
    const blob = await res.blob();
    const { error } = await supabase.storage.from('avatars').upload(objectPath, blob, {
      contentType: mime,
      upsert: true,
    });
    if (error) throw new Error(error.message);
    return fileName;
  }

  // On native, React Native fetch can upload a file uri via FormData.
  const form = new FormData();
  // @ts-expect-error React Native FormData accepts the {uri,name,type} object.
  form.append('file', {
    uri: file.uri,
    name: fileName,
    type: mime,
  });

  const { error } = await supabase.storage.from('avatars').upload(objectPath, form as unknown as Blob, {
    contentType: mime,
    upsert: true,
  });

  if (error) throw new Error(error.message);
  return fileName;
}

// Convenience: given a Profile with avatar_url (the stored file name), return full URL.
export function profileAvatarUrl(userId: string, avatarFileName: string | null): string | null {
  return avatarFileName ? avatarPublicUrl(userId, avatarFileName) : null;
}
