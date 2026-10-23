import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

const AUTHORIZED_DIRECTOR_EMAIL = 'devenjhaofficial@gmail.com';

/**
 * Callable Cloud Function: createStaffAccount
 * Creates a Firebase Authentication user, users/{uid} authorization document,
 * and staff/{employeeId} record under strict director-only authorization.
 */
export const createStaffAccount = functions.https.onCall(async (data, context) => {
  // 1. Verify caller authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The caller must be authenticated to invoke this function.'
    );
  }

  // 2. Verify caller is authorized Director
  const callerEmail = (context.auth.token.email || '').trim().toLowerCase();
  if (callerEmail !== AUTHORIZED_DIRECTOR_EMAIL) {
    throw new functions.https.HttpsError(
      'permission-denied',
      `Access denied: Only the authorized Director (${AUTHORIZED_DIRECTOR_EMAIL}) can provision staff accounts.`
    );
  }

  const { staffData, initialPassword } = data || {};
  if (!staffData || !staffData.officialEmail || !staffData.employeeId || !staffData.fullName) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Missing required employee details (officialEmail, employeeId, fullName).'
    );
  }

  const email = staffData.officialEmail.trim().toLowerCase();
  const employeeId = staffData.employeeId.trim().toUpperCase();
  const password = initialPassword && initialPassword.trim().length >= 6
    ? initialPassword.trim()
    : `Manshi@${employeeId.replace(/[^a-zA-Z0-9]/g, '')}2026`;

  const db = admin.firestore();

  // 3. Verify employeeId uniqueness
  const existingStaffSnap = await db.doc(`staff/${employeeId}`).get();
  if (existingStaffSnap.exists) {
    throw new functions.https.HttpsError(
      'already-exists',
      `An employee with ID "${employeeId}" already exists.`
    );
  }

  // 4. Create Firebase Auth user
  let userRecord: admin.auth.UserRecord;
  try {
    userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: staffData.fullName.trim(),
      disabled: staffData.status === 'inactive',
    });
  } catch (authError: any) {
    if (authError.code === 'auth/email-already-exists') {
      throw new functions.https.HttpsError(
        'already-exists',
        `The email "${email}" is already registered in Firebase Authentication.`
      );
    }
    throw new functions.https.HttpsError(
      'internal',
      `Failed to create Firebase Auth user: ${authError.message}`
    );
  }

  const uid = userRecord.uid;

  try {
    // 5. Create users/{uid} authorization document
    const userDocRef = db.doc(`users/${uid}`);
    await userDocRef.set({
      uid,
      email,
      role: 'staff',
      employeeId,
      active: staffData.status !== 'inactive',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 6. Create staff/{employeeId} profile document
    const staffDocRef = db.doc(`staff/${employeeId}`);
    await staffDocRef.set({
      ...staffData,
      uid,
      employeeId,
      officialEmail: email,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 7. Audit Log
    await db.collection('auditLogs').add({
      action: 'STAFF_PROVISIONED_BY_FUNCTION',
      performedBy: callerEmail,
      targetId: employeeId,
      details: `Provisioned staff account for ${staffData.fullName} (${email})`,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      uid,
      employeeId,
      email,
    };
  } catch (firestoreError: any) {
    // Rollback auth user creation if Firestore documents failed
    try {
      await admin.auth().deleteUser(uid);
    } catch (cleanupError) {
      console.error('Failed to cleanup auth user after Firestore write error:', cleanupError);
    }
    throw new functions.https.HttpsError(
      'internal',
      `Firestore record creation failed: ${firestoreError.message}`
    );
  }
});
