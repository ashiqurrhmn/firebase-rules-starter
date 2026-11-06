import { readFileSync } from 'node:fs';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';

export const PROJECT_ID = 'demo-intern-rules';

const read = (name) => readFileSync(new URL(`../${name}`, import.meta.url), 'utf8');

export async function createFirestoreEnv() {
  return initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: read('firestore.rules'), host: '127.0.0.1', port: 8080 },
  });
}

export async function createStorageEnv() {
  return initializeTestEnvironment({
    projectId: PROJECT_ID,
    storage: { rules: read('storage.rules'), host: '127.0.0.1', port: 9199 },
  });
}
