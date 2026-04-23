# Google Sign-In — Design Spec
_Date: 2026-04-23_

## Overview
Add Google Sign-In to the calorie recorder app. The package `@react-native-google-signin/google-signin` v16.1.2 is already installed and native-linked. A "Continue with Google" button appears on both the Login and Register screens. Auth logic lives exclusively in the Zustand auth-store.

---

## Scope

| File | Change |
|------|--------|
| `stores/auth-store.ts` | Add `googleSignIn()` action |
| `components/google-sign-in-button.tsx` | New reusable button component |
| `app/(auth)/login.tsx` | Add divider + `<GoogleSignInButton />` |
| `app/(auth)/register.tsx` | Add divider + `<GoogleSignInButton />` |

No other files change.

---

## 1. Auth Store — `googleSignIn()` action

### Interface addition
```ts
googleSignIn: () => Promise<void>;
```

### Logic (in order)
1. `GoogleSignin.configure({ webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID })`
2. `await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true })`
3. `const { data } = await GoogleSignin.signIn()` — get `idToken`
4. Build Firebase credential: `auth.GoogleAuthProvider.credential(data.idToken)`
5. `const { user } = await auth().signInWithCredential(credential)`
6. **New vs. returning user detection:**
   - Fetch Firestore doc at `users/{uid}`
   - If doc **does not exist** → create minimal profile (uid, email, displayName, dailyCalorieTarget: 2000, createdAt, updatedAt) → `router.replace('/(onboarding)/step1-goal')`
   - If doc **exists** → `router.replace('/(tabs)')`
7. Errors caught and written to `state.error` (same pattern as `signIn`/`signUp`)
8. `loading` flag set true at entry, false in `finally`

---

## 2. GoogleSignInButton Component — `components/google-sign-in-button.tsx`

### Behaviour
- Calls `useAuthStore().googleSignIn()` on press
- Manages its own `loading` boolean (spinner while Google flow is in progress)
- Reads `colors` from `useTheme()` for full dark/light support

### Visual design
- White/surface background, 1px border (`colors.border`), 8px border-radius
- "G" logo: bold coloured letters (B=blue, r=red, a=amber, g=green, second o=blue, l=green, e=red) — no image asset needed — rendered as a `<Text>` with per-letter colours inside a `<View>`  
  Alternative simpler approach: single bold "G" in Google Blue `#4285F4` — cleaner and avoids 7-colour complexity. **Use this.**
- Label: "Continue with Google" in `colors.text`
- Accepts optional `style` prop for layout overrides

### OR divider
Rendered inside each auth screen (not inside the component itself):
```
[—————  or  —————]
```
Two `View` flex-1 lines in `colors.border`, "or" text in `colors.textSecondary`, `fontSize: 12`.

---

## 3. Screen Updates

### `app/(auth)/login.tsx`
After `<Button label="Sign In" ... />`, add:
```jsx
<OrDivider />   {/* inline helper or extracted */}
<GoogleSignInButton />
```

### `app/(auth)/register.tsx`
After `<Button label="Create Account" ... />`, add:
```jsx
<OrDivider />
<GoogleSignInButton />
```

The `OrDivider` is a small inline component defined once in each file (or extracted to a shared spot — keep it inline to avoid over-engineering a 6-line component).

---

## Error Handling
- Google sign-in cancelled by user → silently ignored (no error shown)
- `SIGN_IN_CANCELLED` and `IN_PROGRESS` status codes caught and swallowed
- All other errors surface through `auth-store.error` → displayed by existing error banner on each screen

## New vs. Returning User
Detection is based on Firestore doc existence at `users/{uid}`, not Firebase's `additionalUserInfo.isNewUser`, because the app's profile doc is the source of truth (contains `onboardingComplete`). This is robust to edge cases like a profile created via email that then signs in with Google.

---

## Out of Scope
- iOS-specific configuration (SHA certificates, GoogleService-Info.plist) — Android only for now
- Linking existing email account to Google credential
- Sign-out from Google (Firebase sign-out is sufficient for this app)
