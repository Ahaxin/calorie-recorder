import firebase from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';

// @react-native-firebase auto-initialises from google-services.json / GoogleService-Info.plist
// No manual initializeApp() call needed.

export { firebase, auth, firestore, storage };

export const USERS_COLLECTION = 'users';
export const MEALS_SUBCOLLECTION = 'meals';
