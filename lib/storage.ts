import { storage } from './firebase';

/**
 * Uploads a meal photo to Firebase Storage.
 * @returns The public download URL.
 */
export async function uploadMealPhoto(
  uid: string,
  mealId: string,
  localUri: string
): Promise<string> {
  const path = `meals/${uid}/${mealId}.jpg`;
  const ref = storage().ref(path);
  await ref.putFile(localUri);
  return ref.getDownloadURL();
}
