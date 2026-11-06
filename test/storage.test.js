import { describe, it, before, after, beforeEach } from 'node:test';
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { ref, uploadBytes, getBytes, deleteObject } from 'firebase/storage';
import { createStorageEnv } from './helpers.js';

let env;

const MB = 1024 * 1024;
const PNG = { contentType: 'image/png' };
const JPEG = { contentType: 'image/jpeg' };

before(async () => {
  env = await createStorageEnv();
});

after(async () => {
  await env.cleanup();
});

beforeEach(async () => {
  await env.clearStorage();
  // Seed one file with security rules disabled.
  await env.withSecurityRulesDisabled(async (ctx) => {
    await uploadBytes(ref(ctx.storage(), 'users/alice/avatar/seed.png'), new Uint8Array(1024), PNG);
  });
});

const anon = () => env.unauthenticatedContext().storage();
const alice = () => env.authenticatedContext('alice').storage();
const bob = () => env.authenticatedContext('bob').storage();
const admin = () => env.authenticatedContext('admin1', { admin: true }).storage();

describe('avatar: upload', () => {
  it('allows an owner to upload a small PNG', async () => {
    await assertSucceeds(uploadBytes(ref(alice(), 'users/alice/avatar/new.png'), new Uint8Array(1024), PNG));
  });

  it('allows an owner to upload a small JPEG', async () => {
    await assertSucceeds(uploadBytes(ref(alice(), 'users/alice/avatar/new.jpg'), new Uint8Array(1024), JPEG));
  });

  it('allows an upload of exactly 2 MB', async () => {
    await assertSucceeds(uploadBytes(ref(alice(), 'users/alice/avatar/limit.png'), new Uint8Array(2 * MB), PNG));
  });

  it('denies an upload larger than 2 MB', async () => {
    await assertFails(uploadBytes(ref(alice(), 'users/alice/avatar/big.png'), new Uint8Array(2 * MB + 1), PNG));
  });

  it('denies a file that is not a JPEG or PNG image', async () => {
    await assertFails(
      uploadBytes(ref(alice(), 'users/alice/avatar/notes.txt'), new Uint8Array(1024), { contentType: 'text/plain' }),
    );
  });

  it('denies uploading to another user folder', async () => {
    await assertFails(uploadBytes(ref(bob(), 'users/alice/avatar/new.png'), new Uint8Array(1024), PNG));
  });

  it('denies an anonymous upload', async () => {
    await assertFails(uploadBytes(ref(anon(), 'users/alice/avatar/new.png'), new Uint8Array(1024), PNG));
  });

  it('denies an upload outside the avatar path', async () => {
    await assertFails(uploadBytes(ref(alice(), 'users/alice/documents/new.png'), new Uint8Array(1024), PNG));
  });
});

describe('avatar: read and delete', () => {
  it('allows an owner to read their own file', async () => {
    await assertSucceeds(getBytes(ref(alice(), 'users/alice/avatar/seed.png')));
  });

  it('denies another user from reading the file', async () => {
    await assertFails(getBytes(ref(bob(), 'users/alice/avatar/seed.png')));
  });

  it('denies an anonymous user from reading the file', async () => {
    await assertFails(getBytes(ref(anon(), 'users/alice/avatar/seed.png')));
  });

  it('allows an admin to read any avatar', async () => {
    await assertSucceeds(getBytes(ref(admin(), 'users/alice/avatar/seed.png')));
  });

  it('allows an owner to delete their own file', async () => {
    await assertSucceeds(deleteObject(ref(alice(), 'users/alice/avatar/seed.png')));
  });

  it('denies another user from deleting the file', async () => {
    await assertFails(deleteObject(ref(bob(), 'users/alice/avatar/seed.png')));
  });
});
