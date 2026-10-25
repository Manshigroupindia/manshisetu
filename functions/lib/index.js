"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteStaffAccount = exports.createStaffAccount = exports.getNextStaffId = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
const AUTHORIZED_DIRECTOR_EMAIL = 'devenjhaofficial@gmail.com';
const COUNTER_DOC_PATH = 'systemMetadata/staffCounter';
const DEFAULT_BASE_NUMBER = 100;
const ID_PREFIX = 'MGS-';
/**
 * Recursively omit `undefined` properties from Firestore payloads.
 * Preserves 0, false, empty strings, arrays, null, FieldValues, and Dates.
 */
function sanitizeFirestorePayload(input) {
    if (input === null || input === undefined) {
        return input;
    }
    if (typeof input !== 'object') {
        return input;
    }
    if (input instanceof Date) {
        return input;
    }
    const maybeFieldValue = input;
    if (maybeFieldValue._methodName ||
        maybeFieldValue.constructor?.name === 'FieldValue' ||
        maybeFieldValue.constructor?.name === 'Timestamp' ||
        typeof maybeFieldValue.toMillis === 'function') {
        return input;
    }
    if (Array.isArray(input)) {
        return input.map((item) => sanitizeFirestorePayload(item));
    }
    const sanitized = {};
    for (const [key, value] of Object.entries(input)) {
        if (value === undefined) {
            continue;
        }
        sanitized[key] = sanitizeFirestorePayload(value);
    }
    return sanitized;
}
/**
 * Callable Cloud Function: getNextStaffId
 * Concurrency-safe atomic transaction to issue the next permanent non-reusable employee ID.
 */
exports.getNextStaffId = functions.https.onCall(async (_data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The caller must be authenticated to invoke this function.');
    }
    const callerEmail = (context.auth.token.email || '').trim().toLowerCase();
    if (callerEmail !== AUTHORIZED_DIRECTOR_EMAIL) {
        throw new functions.https.HttpsError('permission-denied', `Access denied: Only the authorized Director (${AUTHORIZED_DIRECTOR_EMAIL}) can allocate employee IDs.`);
    }
    const db = admin.firestore();
    const counterRef = db.doc(COUNTER_DOC_PATH);
    return await db.runTransaction(async (transaction) => {
        const snap = await transaction.get(counterRef);
        let currentNumber = DEFAULT_BASE_NUMBER;
        if (snap.exists) {
            const val = snap.data()?.lastIssuedNumber;
            if (typeof val === 'number' && !isNaN(val)) {
                currentNumber = val;
            }
        }
        else {
            // Find highest from existing staff collection
            const staffSnap = await db.collection('staff').get();
            staffSnap.forEach((d) => {
                const rawId = (d.data().employeeId || d.id || '').toString().trim().toUpperCase();
                const match = rawId.match(/MGS-?(\d+)/i);
                if (match) {
                    const num = parseInt(match[1], 10);
                    if (!isNaN(num) && num > currentNumber) {
                        currentNumber = num;
                    }
                }
            });
        }
        const nextNumber = currentNumber + 1;
        const nextId = `${ID_PREFIX}${nextNumber}`;
        transaction.set(counterRef, {
            lastIssuedNumber: nextNumber,
            lastIssuedId: nextId,
            prefix: ID_PREFIX,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        return { nextId, nextNumber };
    });
});
/**
 * Callable Cloud Function: createStaffAccount
 * Creates a Firebase Authentication user, users/{uid} authorization document,
 * and staff/{employeeId} record under strict director-only authorization.
 * All payloads are sanitized to omit `undefined` values.
 */
exports.createStaffAccount = functions.https.onCall(async (data, context) => {
    // 1. Verify caller authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The caller must be authenticated to invoke this function.');
    }
    // 2. Verify caller is authorized Director
    const callerEmail = (context.auth.token.email || '').trim().toLowerCase();
    if (callerEmail !== AUTHORIZED_DIRECTOR_EMAIL) {
        throw new functions.https.HttpsError('permission-denied', `Access denied: Only the authorized Director (${AUTHORIZED_DIRECTOR_EMAIL}) can provision staff accounts.`);
    }
    const { staffData, initialPassword } = data || {};
    if (!staffData || !staffData.officialEmail || !staffData.employeeId || !staffData.fullName) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required employee details (officialEmail, employeeId, fullName).');
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
        throw new functions.https.HttpsError('already-exists', `An employee with ID "${employeeId}" already exists.`);
    }
    // 4. Create Firebase Auth user
    let userRecord;
    try {
        userRecord = await admin.auth().createUser({
            email,
            password,
            displayName: staffData.fullName.trim(),
            disabled: staffData.status === 'inactive',
        });
    }
    catch (authError) {
        if (authError.code === 'auth/email-already-exists') {
            throw new functions.https.HttpsError('already-exists', `The email "${email}" is already registered in Firebase Authentication.`);
        }
        throw new functions.https.HttpsError('internal', `Failed to create Firebase Auth user: ${authError.message}`);
    }
    const uid = userRecord.uid;
    try {
        // Sanitize staffData so undefined values (e.g. alternateContact, notes) are omitted
        const sanitizedStaffData = sanitizeFirestorePayload(staffData);
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
            ...sanitizedStaffData,
            uid,
            employeeId,
            officialEmail: email,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        // 7. Update counter if higher
        const idMatch = employeeId.match(/MGS-?(\d+)/i);
        if (idMatch) {
            const num = parseInt(idMatch[1], 10);
            if (!isNaN(num)) {
                const counterRef = db.doc(COUNTER_DOC_PATH);
                await db.runTransaction(async (txn) => {
                    const cSnap = await txn.get(counterRef);
                    const current = cSnap.data()?.lastIssuedNumber || DEFAULT_BASE_NUMBER;
                    if (num > current) {
                        txn.set(counterRef, {
                            lastIssuedNumber: num,
                            lastIssuedId: employeeId,
                            prefix: ID_PREFIX,
                            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                        }, { merge: true });
                    }
                });
            }
        }
        // 8. Audit Log
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
    }
    catch (firestoreError) {
        // Rollback auth user creation if Firestore documents failed
        try {
            await admin.auth().deleteUser(uid);
        }
        catch (cleanupError) {
            console.error('Failed to cleanup auth user after Firestore write error:', cleanupError);
        }
        throw new functions.https.HttpsError('internal', `Firestore record creation failed: ${firestoreError.message}`);
    }
});
/**
 * Callable Cloud Function: deleteStaffAccount
 * Permanently deletes a staff member:
 * 1. Permanently deletes their Firebase Authentication account via Admin SDK using stored UID.
 * 2. If Auth account deletion fails, throws an error immediately and aborts Firestore deletion.
 * 3. Atomically removes staff/{employeeId} profile document and linked users/{uid} authorization document.
 * 4. Cleans up active uncompleted assignments (pending, in_progress).
 * 5. Preserves historical attendance records, payroll slips, advances, expenses, and audit logs.
 * 6. Guarantees Director account (devenjhaofficial@gmail.com / devenjhaoffical@gmail.com) can never be deleted.
 */
exports.deleteStaffAccount = functions.https.onCall(async (data, context) => {
    // 1. Verify caller authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The caller must be authenticated to invoke this function.');
    }
    // 2. Verify caller is authorized Director
    const callerEmail = (context.auth.token.email || '').trim().toLowerCase();
    const PROTECTED_DIRECTOR_EMAILS = [
        'devenjhaofficial@gmail.com',
        'devenjhaoffical@gmail.com',
        AUTHORIZED_DIRECTOR_EMAIL.toLowerCase(),
    ];
    if (!PROTECTED_DIRECTOR_EMAILS.includes(callerEmail)) {
        throw new functions.https.HttpsError('permission-denied', `Access denied: Only the authorized Director (${AUTHORIZED_DIRECTOR_EMAIL}) can delete staff accounts.`);
    }
    const { employeeId, uid: clientPassedUid } = data || {};
    if (!employeeId || typeof employeeId !== 'string') {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required employeeId parameter.');
    }
    const cleanEmployeeId = employeeId.trim().toUpperCase();
    const db = admin.firestore();
    // Find staff profile and stored UID
    const staffDocRef = db.doc(`staff/${cleanEmployeeId}`);
    const staffSnap = await staffDocRef.get();
    const staffData = staffSnap.exists ? staffSnap.data() : null;
    // SAFETY CHECK: Ensure Director/Admin account can NEVER be deleted
    const targetEmail = (staffData?.officialEmail || '').trim().toLowerCase();
    if (PROTECTED_DIRECTOR_EMAILS.includes(targetEmail) ||
        PROTECTED_DIRECTOR_EMAILS.includes(cleanEmployeeId.toLowerCase())) {
        throw new functions.https.HttpsError('permission-denied', 'Security Violation: The Director / Administrator account can never be deleted through staff management.');
    }
    // Use the employee's stored Firebase Authentication UID to identify the exact account to delete.
    // Never identify by email alone!
    let targetUid = clientPassedUid || staffData?.uid;
    if (!targetUid) {
        const userQuery = await db.collection('users').where('employeeId', '==', cleanEmployeeId).get();
        if (!userQuery.empty) {
            targetUid = userQuery.docs[0].id;
        }
    }
    // Refuse if target UID matches caller's own UID
    if (targetUid && targetUid === context.auth.uid) {
        throw new functions.https.HttpsError('permission-denied', 'Security Violation: You cannot delete your own Administrator account.');
    }
    // Step A: Permanently delete Firebase Authentication user using Admin SDK by stored UID
    let authDeleted = false;
    if (targetUid) {
        try {
            const userRecord = await admin.auth().getUser(targetUid);
            const email = (userRecord.email || '').trim().toLowerCase();
            if (PROTECTED_DIRECTOR_EMAILS.includes(email)) {
                throw new functions.https.HttpsError('permission-denied', 'Security Violation: The Director / Administrator account can never be deleted through staff management.');
            }
        }
        catch (checkErr) {
            if (checkErr instanceof functions.https.HttpsError) {
                throw checkErr;
            }
            // If user not found in Auth, proceed to let deleteUser handle it
        }
        try {
            await admin.auth().deleteUser(targetUid);
            authDeleted = true;
        }
        catch (authErr) {
            if (authErr.code === 'auth/user-not-found') {
                // Account already deleted or not in Auth; proceed to Firestore cleanup
                authDeleted = true;
            }
            else {
                // Critical: Do NOT proceed to delete Firestore profile if Auth deletion failed!
                // Abort and report error so records do not end up in an inconsistent state.
                console.error(`Admin SDK deleteUser failed for uid ${targetUid}:`, authErr);
                throw new functions.https.HttpsError('internal', `Failed to delete Firebase Authentication account (${targetUid}): ${authErr.message}. Staff profile was NOT deleted. Please retry.`);
            }
        }
    }
    // Step B: Atomically remove Firestore documents via batch
    const batch = db.batch();
    // 1. Delete staff document
    if (staffSnap.exists) {
        batch.delete(staffDocRef);
    }
    // 2. Delete linked users/{uid} documents so portal login access is permanently removed
    if (targetUid) {
        batch.delete(db.doc(`users/${targetUid}`));
    }
    const linkedUsersSnap = await db.collection('users').where('employeeId', '==', cleanEmployeeId).get();
    linkedUsersSnap.forEach((uDoc) => {
        batch.delete(uDoc.ref);
    });
    // 3. Clean up active uncompleted assignments specifically assigned to this employee
    const activeTasks = await db
        .collection('workAssignments')
        .where('staffId', '==', cleanEmployeeId)
        .where('status', 'in', ['pending', 'in_progress'])
        .get();
    activeTasks.forEach((tDoc) => {
        batch.delete(tDoc.ref);
    });
    // CRUCIAL: Historical attendance (attendanceSessions), payroll (salaryRecords), advances (salaryAdvances),
    // expenses (expenses), and audit logs are safely preserved!
    await batch.commit();
    // Step C: Log audit trail
    await db.collection('auditLogs').add({
        action: 'STAFF_DELETED_BY_FUNCTION',
        performedBy: callerEmail,
        targetId: cleanEmployeeId,
        details: `Staff member ${staffData?.fullName || cleanEmployeeId} (${cleanEmployeeId}) permanently deleted by Director. Auth UID ${targetUid || 'N/A'} deleted via Admin SDK. Active tasks cleaned; Historical attendance, payroll, and expenses preserved.`,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
    return {
        success: true,
        employeeId: cleanEmployeeId,
        uid: targetUid,
        authDeleted,
    };
});
//# sourceMappingURL=index.js.map