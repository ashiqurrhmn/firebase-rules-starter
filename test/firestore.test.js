import { describe, it, before, after, beforeEach } from 'node:test';
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { createFirestoreEnv } from './helpers.js';

let env;

before(async () => {
  env = await createFirestoreEnv();
});

after(async () => {
  await env.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  // Seed data with security rules disabled.
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'users/alice'), { displayName: 'Alice', role: 'user', pointsBalance: 100 });
    await setDoc(doc(db, 'users/bob'), { displayName: 'Bob', role: 'user', pointsBalance: 50 });
    await setDoc(doc(db, 'users/alice/tasks/t1'), { title: 'Read the documentation', done: false });
    await setDoc(doc(db, 'appConfig/features'), { newDashboard: true });
  });
});

const anon = () => env.unauthenticatedContext().firestore();
const alice = () => env.authenticatedContext('alice').firestore();
const bob = () => env.authenticatedContext('bob').firestore();
const carol = () => env.authenticatedContext('carol').firestore();
const admin = () => env.authenticatedContext('admin1', { admin: true }).firestore();

describe('users: read', () => {
  it('denies an anonymous user from reading a profile', async () => {
    await assertFails(getDoc(doc(anon(), 'users/alice')));
  });

  it('allows an owner to read their own profile', async () => {
    await assertSucceeds(getDoc(doc(alice(), 'users/alice')));
  });

  it('denies a user from reading another user profile', async () => {
    await assertFails(getDoc(doc(alice(), 'users/bob')));
  });

  it('allows an admin to read any profile', async () => {
    await assertSucceeds(getDoc(doc(admin(), 'users/bob')));
  });
});

describe('users: create', () => {
  it('allows a user to create their own profile with role "user"', async () => {
    await assertSucceeds(setDoc(doc(carol(), 'users/carol'), { displayName: 'Carol', role: 'user' }));
  });

  it('denies creating a profile with role "admin"', async () => {
    await assertFails(setDoc(doc(carol(), 'users/carol'), { displayName: 'Carol', role: 'admin' }));
  });

  it('denies creating a profile that contains pointsBalance', async () => {
    await assertFails(
      setDoc(doc(carol(), 'users/carol'), { displayName: 'Carol', role: 'user', pointsBalance: 1000 }),
    );
  });

  it('denies creating a profile for a different uid', async () => {
    await assertFails(setDoc(doc(carol(), 'users/dave'), { displayName: 'Dave', role: 'user' }));
  });
});

describe('users: update and delete', () => {
  it('allows an owner to change their displayName', async () => {
    await assertSucceeds(updateDoc(doc(alice(), 'users/alice'), { displayName: 'Alice A.' }));
  });

  it('denies an owner from changing pointsBalance', async () => {
    await assertFails(updateDoc(doc(alice(), 'users/alice'), { pointsBalance: 999999 }));
  });

  it('denies an owner from changing their role', async () => {
    await assertFails(updateDoc(doc(alice(), 'users/alice'), { role: 'admin' }));
  });

  it('denies a user from changing another user profile', async () => {
    await assertFails(updateDoc(doc(alice(), 'users/bob'), { displayName: 'Hacked' }));
  });

  it('denies an owner from deleting their own profile', async () => {
    await assertFails(deleteDoc(doc(alice(), 'users/alice')));
  });
});

describe('tasks', () => {
  it('allows an owner to read their own task', async () => {
    await assertSucceeds(getDoc(doc(alice(), 'users/alice/tasks/t1')));
  });

  it('denies another user from reading the task', async () => {
    await assertFails(getDoc(doc(bob(), 'users/alice/tasks/t1')));
  });

  it('allows an owner to create a valid task', async () => {
    await assertSucceeds(setDoc(doc(alice(), 'users/alice/tasks/t2'), { title: 'Write rules', done: false }));
  });

  it('denies creating a task with a title longer than 60 characters', async () => {
    await assertFails(setDoc(doc(alice(), 'users/alice/tasks/t2'), { title: 'x'.repeat(61), done: false }));
  });

  it('denies creating a task with an empty title', async () => {
    await assertFails(setDoc(doc(alice(), 'users/alice/tasks/t2'), { title: '', done: false }));
  });

  it('denies creating a task with an unexpected extra field', async () => {
    await assertFails(
      setDoc(doc(alice(), 'users/alice/tasks/t2'), { title: 'Write rules', done: false, hidden: true }),
    );
  });

  it('denies creating a task under another user', async () => {
    await assertFails(setDoc(doc(bob(), 'users/alice/tasks/t2'), { title: 'Intruder', done: false }));
  });

  it('allows an owner to mark a task as done', async () => {
    await assertSucceeds(updateDoc(doc(alice(), 'users/alice/tasks/t1'), { done: true }));
  });

  it('allows an owner to delete their own task', async () => {
    await assertSucceeds(deleteDoc(doc(alice(), 'users/alice/tasks/t1')));
  });
});

describe('appConfig', () => {
  it('allows a signed-in user to read configuration', async () => {
    await assertSucceeds(getDoc(doc(alice(), 'appConfig/features')));
  });

  it('denies an anonymous user from reading configuration', async () => {
    await assertFails(getDoc(doc(anon(), 'appConfig/features')));
  });

  it('denies a regular user from writing configuration', async () => {
    await assertFails(setDoc(doc(alice(), 'appConfig/features'), { newDashboard: false }));
  });

  it('allows an admin to write configuration', async () => {
    await assertSucceeds(setDoc(doc(admin(), 'appConfig/features'), { newDashboard: false }));
  });
});

describe('default deny', () => {
  it('denies access to an unknown collection', async () => {
    await assertFails(getDoc(doc(admin(), 'unknown/doc1')));
  });
});

describe('additional attack tests', () => {
  it('denies an admin from changing a user pointsBalance', async () => {
    await assertFails(
      updateDoc(doc(admin(), 'users/alice'), {
        pointsBalance: 999999,
      }),
    );
  });

  it('denies creating a task when done is not a boolean', async () => {
    await assertFails(
      setDoc(doc(alice(), 'users/alice/tasks/invalid-done'), {
        title: 'Invalid task',
        done: 'yes',
      }),
    );
  });
});