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

  // React Native fetch can upload a file uri as FormData.
  const form = new FormData();
  form.append('file', {
    uri: file.uri,
    name: fileName,
    type: mime,
  } as unknown as Blob);

  const { error } = await supabase.storage.from('avatars').upload(`${userId}/${fileName}`, form as unknown as Blob, {
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
