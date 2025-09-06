import { app } from './firebase';
import { getAuth, type Auth } from 'firebase/auth';

// Simple approach - just use basic getAuth for now
// We'll add persistence later once basic auth works
export const auth: Auth = getAuth(app);
