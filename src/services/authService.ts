// Firebase Authentication & Authorization Service for Manshi Group Setu

import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { auth, db, AUTHORIZED_DIRECTOR_EMAIL } from '../lib/firebase';
import { UserProfile, Staff } from '../types';

export interface AuthSession {
  isAuthenticated: boolean;
  role: 'admin' | 'staff' | null;
  username?: string;
  staffId?: string; // Links to staff.id
  employeeId?: string; // Links to staff.employeeId (e.g. MGS-101)
  uid?: string;
  email?: string;
}

export class AuthService {
  /**
   * Administrative Login - Strictly restricted to authorized Director: devenjhaofficial@gmail.com
   */
  async loginDirector(email: string, password: string): Promise<{ user: FirebaseUser; profile: UserProfile }> {
    // 1. Client-side normalization & pre-check against exact director email
    const normalizedEmail = (email || '').trim().toLowerCase();

    if (!normalizedEmail) {
      const err = new Error('Please enter the Director email address.');
      (err as any).code = 'auth/invalid-email';
      throw err;
    }

    if (normalizedEmail !== AUTHORIZED_DIRECTOR_EMAIL) {
      const err = new Error(
        `Access Denied [auth/unauthorized-email]: Only the authorized Director (${AUTHORIZED_DIRECTOR_EMAIL}) is permitted to access the Administrative Portal.`
      );
      (err as any).code = 'auth/unauthorized-email';
      throw err;
    }

    if (!password) {
      const err = new Error('Please enter the Director account password.');
      (err as any).code = 'auth/missing-password';
      throw err;
    }

    // 2. Stage 1: Firebase Authentication (Modular SDK signInWithEmailAndPassword)
    let cred;
    try {
      // Email is trimmed and normalized to lowercase; password is sent unmodified
      cred = await signInWithEmailAndPassword(auth, normalizedEmail, password);
    } catch (err: any) {
      const code = err?.code || 'auth/unknown';
      let message = '';
      switch (code) {
        case 'auth/invalid-credential':
          message = `Authentication failed [auth/invalid-credential]: Invalid credentials. The password entered is incorrect, or the account '${normalizedEmail}' has not been registered yet in Firebase Console under Authentication > Users.`;
          break;
        case 'auth/user-not-found':
          message = `Account not found [auth/user-not-found]: User '${normalizedEmail}' does not exist in Firebase Authentication.`;
          break;
        case 'auth/wrong-password':
          message = `Incorrect password [auth/wrong-password]: The password entered is incorrect for Director account '${normalizedEmail}'.`;
          break;
        case 'auth/invalid-email':
          message = `Invalid email format [auth/invalid-email]: The email address '${normalizedEmail}' is not formatted correctly.`;
          break;
        case 'auth/too-many-requests':
          message = `Access temporarily locked [auth/too-many-requests]: Too many consecutive failed attempts. Firebase has temporarily restricted sign-in for security. Please wait a few minutes or reset your password in Firebase Console.`;
          break;
        case 'auth/user-disabled':
          message = `Account disabled [auth/user-disabled]: The Director account '${normalizedEmail}' has been disabled in Firebase Console.`;
          break;
        case 'auth/network-request-failed':
          message = `Network request failed [auth/network-request-failed]: Unable to reach Firebase Authentication servers. Check your internet connection or network firewall.`;
          break;
        case 'auth/unauthorized-domain':
          message = `Unauthorized domain [auth/unauthorized-domain]: The current host is not in Firebase Console -> Authentication -> Settings -> Authorized domains.`;
          break;
        case 'auth/operation-not-allowed':
          message = `Provider disabled [auth/operation-not-allowed]: Email/Password sign-in provider is disabled in Firebase Console (Authentication > Sign-in method).`;
          break;
        case 'auth/invalid-api-key':
        case 'auth/api-key-not-valid':
          message = `Configuration error [auth/invalid-api-key]: The Firebase API Key is not valid.`;
          break;
        default:
          message = `Authentication error [${code}]: ${err.message || 'Firebase sign-in failed.'}`;
      }
      const authErr = new Error(message);
      (authErr as any).code = code;
      (authErr as any).stage = 'authentication';
      throw authErr;
    }

    const authUser = cred.user;
    const verifiedEmail = (authUser.email || '').trim().toLowerCase();

    // 3. Stage 2: Post-Authentication ID Token Email Verification
    if (verifiedEmail !== AUTHORIZED_DIRECTOR_EMAIL) {
      await signOut(auth);
      const authErr = new Error(
        `Authorization Rejected [auth/unauthorized-director]: Authenticated Firebase account (${verifiedEmail}) is not the authorized Director (${AUTHORIZED_DIRECTOR_EMAIL}). Session terminated.`
      );
      (authErr as any).code = 'auth/unauthorized-director';
      (authErr as any).stage = 'authorization';
      throw authErr;
    }

    // 4. Stage 3: Trusted Firestore Authorization & Profile Lookup
    let userDocSnap;
    const userDocRef = doc(db, 'users', authUser.uid);
    try {
      userDocSnap = await getDoc(userDocRef);
    } catch (firestoreErr: any) {
      console.error('Director authorization lookup failed in Firestore:', firestoreErr);
      const authErr = new Error(
        `Firestore Authorization check failed [${firestoreErr.code || 'firestore/read-failed'}]: Firebase Authentication succeeded as '${verifiedEmail}', but querying the Director profile in Firestore ('users/${authUser.uid}') failed. Cause: ${firestoreErr.message || 'Permission denied or Firestore unavailable.'}`
      );
      (authErr as any).code = firestoreErr.code || 'firestore/read-failed';
      (authErr as any).stage = 'firestore-authorization';
      throw authErr;
    }

    let profile: UserProfile;
    if (!userDocSnap.exists()) {
      try {
        profile = {
          uid: authUser.uid,
          email: verifiedEmail,
          role: 'director',
          employeeId: null,
          active: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await setDoc(userDocRef, {
          ...profile,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (writeErr: any) {
        console.error('Failed to create Director authorization profile in Firestore:', writeErr);
        const authErr = new Error(
          `Director authorization initialization failed [${writeErr.code || 'firestore/write-failed'}]: Firebase Authentication succeeded, but could not create the Director profile record in Firestore ('users/${authUser.uid}'). Cause: ${writeErr.message || 'Permission denied.'}`
        );
        (authErr as any).code = writeErr.code || 'firestore/write-failed';
        (authErr as any).stage = 'firestore-authorization';
        throw authErr;
      }
    } else {
      const data = userDocSnap.data() as any;
      if (data.active === false) {
        await signOut(auth);
        const authErr = new Error(
          `Authorization Rejected [auth/director-deactivated]: The Director account has been marked inactive in Firestore 'users/${authUser.uid}'. Access denied.`
        );
        (authErr as any).code = 'auth/director-deactivated';
        (authErr as any).stage = 'firestore-authorization';
        throw authErr;
      }

      profile = {
        uid: authUser.uid,
        email: verifiedEmail,
        role: 'director',
        employeeId: null,
        active: true,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Keep director role synchronized if needed
      if (data.role !== 'director' || !data.active) {
        try {
          await setDoc(userDocRef, { role: 'director', active: true, updatedAt: serverTimestamp() }, { merge: true });
        } catch (syncErr: any) {
          console.warn('Could not update director record in Firestore:', syncErr);
        }
      }
    }

    return { user: authUser, profile };
  }

  /**
   * Staff Login - Authenticate via Firebase Auth email & password
   * Supports entering either employee ID (e.g. MGS-101) or official email
   */
  async loginStaff(identifier: string, password: string): Promise<{ user: FirebaseUser; profile: UserProfile; staff: Staff }> {
    const rawIdentifier = identifier.trim();
    let emailToUse = rawIdentifier;

    // If identifier doesn't look like an email, lookup officialEmail from staff collection
    if (!rawIdentifier.includes('@')) {
      const staffRef = collection(db, 'staff');
      const q = query(staffRef, where('employeeId', '==', rawIdentifier.toUpperCase()));
      const snap = await getDocs(q);

      if (!snap.empty) {
        const staffData = snap.docs[0].data() as Staff;
        emailToUse = staffData.officialEmail;
      } else {
        // Also try lowercase/exact matching
        const q2 = query(staffRef, where('employeeId', '==', rawIdentifier));
        const snap2 = await getDocs(q2);
        if (!snap2.empty) {
          const staffData = snap2.docs[0].data() as Staff;
          emailToUse = staffData.officialEmail;
        }
      }
    }

    // Authenticate through Firebase Auth
    let cred;
    try {
      cred = await signInWithEmailAndPassword(auth, emailToUse.toLowerCase(), password);
    } catch (err: any) {
      const code = err?.code || 'auth/unknown';
      let message = '';
      switch (code) {
        case 'auth/invalid-credential':
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          message = `Invalid credentials [auth/invalid-credential]: Incorrect password, or employee account '${emailToUse}' is not registered in Firebase Authentication.`;
          break;
        case 'auth/invalid-email':
          message = `Invalid email format [auth/invalid-email]: '${emailToUse}' is not a valid email address.`;
          break;
        case 'auth/too-many-requests':
          message = `Access temporarily locked [auth/too-many-requests]: Too many consecutive failed attempts. Please wait a few minutes before trying again.`;
          break;
        case 'auth/user-disabled':
          message = `Account disabled [auth/user-disabled]: This staff account has been deactivated in Firebase Console.`;
          break;
        case 'auth/network-request-failed':
          message = `Network request failed [auth/network-request-failed]: Unable to reach Firebase Authentication servers. Check your internet connection.`;
          break;
        default:
          message = `Staff authentication error [${code}]: ${err.message || 'Staff sign-in failed.'}`;
      }
      const authErr = new Error(message);
      (authErr as any).code = code;
      throw authErr;
    }

    const authUser = cred.user;
    const authEmail = (authUser.email || '').trim().toLowerCase();

    // Check if account is the Director
    if (authEmail === AUTHORIZED_DIRECTOR_EMAIL) {
      // Allow director preview
      const dirProfile: UserProfile = {
        uid: authUser.uid,
        email: authEmail,
        role: 'director',
        employeeId: null,
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      // Provide fallback preview staff
      const previewStaff: Staff = {
        id: 'staff-director',
        employeeId: 'DIR-001',
        fullName: 'Chief Administrator (Director Preview)',
        designation: 'Director of Corporate Operations',
        department: 'Executive Governance',
        officialEmail: authEmail,
        contactNumber: '+91 11 4982 7700',
        joiningDate: '2023-01-01',
        status: 'active',
        officeLocation: 'Headquarters — New Delhi',
        monthlyFixedSalary: 0,
        emergencyContact: { name: 'Corporate Office', relation: 'Office', phone: '+91 11 4982 7700' },
        address: 'Barakhamba Road, New Delhi',
        bankDetails: { bankName: 'Corporate', accountNumber: '000000000000', ifscCode: 'CORP0000000', accountHolder: 'Director' },
        documents: [],
      };
      return { user: authUser, profile: dirProfile, staff: previewStaff };
    }

    // For ordinary staff: Load authorization record from users/{uid}
    const userDocRef = doc(db, 'users', authUser.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      await signOut(auth);
      throw new Error(
        'Account Not Provisioned: Your login is valid, but no employee profile has been linked to this account yet. Please contact the Director to activate your staff profile.'
      );
    }

    const userData = userDocSnap.data() as any;
    const profile: UserProfile = {
      uid: authUser.uid,
      email: authEmail,
      role: userData.role || 'staff',
      employeeId: userData.employeeId || null,
      active: userData.active !== false,
      createdAt: userData.createdAt?.toDate ? userData.createdAt.toDate().toISOString() : userData.createdAt || new Date().toISOString(),
      updatedAt: userData.updatedAt?.toDate ? userData.updatedAt.toDate().toISOString() : userData.updatedAt || new Date().toISOString(),
    };

    if (!profile.active) {
      await signOut(auth);
      throw new Error('Account Inactive: Your staff access has been deactivated. Please contact Administration.');
    }

    if (!profile.employeeId) {
      await signOut(auth);
      throw new Error('Account Not Provisioned: No Employee ID is assigned to your profile. Please contact the Director.');
    }

    // Load employee profile from staff collection
    const staffDocRef = doc(db, 'staff', profile.employeeId);
    let staffSnap = await getDoc(staffDocRef);
    let staffData: Staff | null = null;

    if (staffSnap.exists()) {
      staffData = staffSnap.data() as Staff;
    } else {
      // Query by employeeId or officialEmail
      const q = query(collection(db, 'staff'), where('employeeId', '==', profile.employeeId));
      const sQuery = await getDocs(q);
      if (!sQuery.empty) {
        staffData = sQuery.docs[0].data() as Staff;
      }
    }

    if (!staffData) {
      await signOut(auth);
      throw new Error(
        `Staff Profile Missing: Employee profile (${profile.employeeId}) was not found in the staff directory. Contact Administration.`
      );
    }

    if (staffData.status === 'inactive') {
      await signOut(auth);
      throw new Error(
        'Account Deactivated: This staff account has been deactivated. Please contact the Director/HR to reactivate your access.'
      );
    }

    return { user: authUser, profile, staff: staffData };
  }

  /**
   * Logout user from Firebase Auth
   */
  async logout(): Promise<void> {
    await signOut(auth);
  }

  /**
   * Listen to Firebase Auth state changes and resolve user profile
   */
  onAuthStateChange(
    callback: (session: {
      user: FirebaseUser | null;
      profile: UserProfile | null;
      staff: Staff | null;
      isAuthenticated: boolean;
      role: 'admin' | 'staff' | null;
    }) => void
  ): () => void {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        callback({
          user: null,
          profile: null,
          staff: null,
          isAuthenticated: false,
          role: null,
        });
        return;
      }

      const email = (firebaseUser.email || '').trim().toLowerCase();

      // Check if Director
      if (email === AUTHORIZED_DIRECTOR_EMAIL) {
        try {
          // Trusted Firestore authorization verification: query users/{uid}
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          let dirProfile: UserProfile;
          if (!userDocSnap.exists()) {
            // Provision director profile if missing
            dirProfile = {
              uid: firebaseUser.uid,
              email,
              role: 'director',
              employeeId: null,
              active: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            try {
              await setDoc(userDocRef, {
                ...dirProfile,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
            } catch (createErr) {
              console.warn('Could not provision initial director profile in Firestore:', createErr);
            }
          } else {
            const data = userDocSnap.data() as any;
            if (data.active === false) {
              console.warn('Director profile is deactivated in Firestore users record.');
              callback({
                user: firebaseUser,
                profile: null,
                staff: null,
                isAuthenticated: false,
                role: null,
              });
              return;
            }

            dirProfile = {
              uid: firebaseUser.uid,
              email,
              role: 'director',
              employeeId: null,
              active: true,
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString(),
              updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt || new Date().toISOString(),
            };

            if (data.role !== 'director') {
              try {
                await setDoc(userDocRef, { role: 'director', active: true, updatedAt: serverTimestamp() }, { merge: true });
              } catch (syncErr) {
                console.warn('Could not sync director role in Firestore:', syncErr);
              }
            }
          }

          callback({
            user: firebaseUser,
            profile: dirProfile,
            staff: null,
            isAuthenticated: true,
            role: 'admin',
          });
          return;
        } catch (firestoreErr) {
          console.error('Failed to verify Director authorization in Firestore:', firestoreErr);
          callback({
            user: firebaseUser,
            profile: null,
            staff: null,
            isAuthenticated: false,
            role: null,
          });
          return;
        }
      }

      // Check users/{uid}
      try {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
          callback({
            user: firebaseUser,
            profile: null,
            staff: null,
            isAuthenticated: false,
            role: null,
          });
          return;
        }

        const data = userDocSnap.data() as any;
        const profile: UserProfile = {
          uid: firebaseUser.uid,
          email,
          role: data.role || 'staff',
          employeeId: data.employeeId || null,
          active: data.active !== false,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt || new Date().toISOString(),
        };

        if (!profile.active || !profile.employeeId) {
          callback({
            user: firebaseUser,
            profile,
            staff: null,
            isAuthenticated: false,
            role: null,
          });
          return;
        }

        // Fetch staff profile
        let staffData: Staff | null = null;
        const staffDocRef = doc(db, 'staff', profile.employeeId);
        const staffSnap = await getDoc(staffDocRef);

        if (staffSnap.exists()) {
          staffData = staffSnap.data() as Staff;
        } else {
          const q = query(collection(db, 'staff'), where('employeeId', '==', profile.employeeId));
          const sQuery = await getDocs(q);
          if (!sQuery.empty) {
            staffData = sQuery.docs[0].data() as Staff;
          }
        }

        if (!staffData || staffData.status === 'inactive') {
          console.warn(`Staff profile ${profile.employeeId} is inactive or deleted.`);
          callback({
            user: firebaseUser,
            profile,
            staff: null,
            isAuthenticated: false,
            role: null,
          });
          return;
        }

        callback({
          user: firebaseUser,
          profile,
          staff: staffData,
          isAuthenticated: true,
          role: 'staff',
        });
      } catch (err) {
        console.error('Error resolving auth user profile:', err);
        callback({
          user: firebaseUser,
          profile: null,
          staff: null,
          isAuthenticated: false,
          role: null,
        });
      }
    });
  }
}

export const authService = new AuthService();
