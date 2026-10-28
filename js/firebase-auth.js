// ============================================================
//  MY TRADE - Firebase Authentication Module
//  Firebase Project: mytrade-fe152
// ============================================================

const firebaseConfig = {
    apiKey: "AIzaSyDMGGzFEQxIKv_0GRA54o3ScNqeomos7YU",
    authDomain: "mytrade-fe152.firebaseapp.com",
    projectId: "mytrade-fe152",
    storageBucket: "mytrade-fe152.firebasestorage.app",
    messagingSenderId: "752357652804",
    appId: "1:752357652804:web:680330127d833c1f383f11",
    measurementId: "G-DHNZCFDCPT"
};

// Initialize Firebase App
firebase.initializeApp(firebaseConfig);

// Firebase services
const auth = firebase.auth();
const analytics = firebase.analytics();

// Google Auth Provider
const googleProvider = new firebase.auth.GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');
googleProvider.setCustomParameters({ prompt: 'select_account' });

// ── Firebase Auth Module ──────────────────────────────────────
const FirebaseAuth = {

    // Sign in with Google Popup
    signInWithGoogle() {
        return auth.signInWithPopup(googleProvider)
            .then((result) => {
                const user = result.user;
                console.log('[MY TRADE] Google Sign-in success:', user.displayName);
                analytics.logEvent('login', { method: 'Google' });
                return user;
            })
            .catch((error) => {
                console.error('[MY TRADE] Google Sign-in error:', error);

                if (error.code === 'auth/popup-closed-by-user') {
                    App.showToast('Sign-in cancelled.', 'info');
                } else if (error.code === 'auth/popup-blocked') {
                    App.showToast('Popup blocked! Please allow popups for this site.', 'warning');
                    // Fallback to redirect
                    auth.signInWithRedirect(googleProvider);
                } else {
                    App.showToast('Sign-in failed: ' + error.message, 'error');
                }
                return null;
            });
    },

    // Sign Out
    signOut() {
        return auth.signOut().then(() => {
            console.log('[MY TRADE] User signed out.');
            analytics.logEvent('logout');
        });
    },

    // Listen to auth state changes (runs on every page load)
    listenAuthState() {
        auth.onAuthStateChanged((firebaseUser) => {
            if (firebaseUser) {
                // User is signed in - update AppState
                AppState.data.user = {
                    isLoggedIn: true,
                    uid: firebaseUser.uid,
                    name: firebaseUser.displayName || 'Trader',
                    email: firebaseUser.email,
                    avatar: firebaseUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
                    role: 'Algo & Discretionary Trader',
                    provider: 'google.com'
                };
                AppState.saveData();
                App.renderUserUI();

                // Only show toast on fresh login (not on page reload)
                if (window._freshGoogleLogin) {
                    App.showToast(`Welcome, ${firebaseUser.displayName || 'Trader'}! 🎉`, 'success');
                    window._freshGoogleLogin = false;
                }

                // Hide auth modal if open
                App.closeModal('modal-google-auth');
            } else {
                // User signed out
                if (AppState.data.user && AppState.data.user.isLoggedIn) {
                    AppState.data.user.isLoggedIn = false;
                    AppState.saveData();
                    App.renderUserUI();
                    App.showToast('Signed out of Google account.', 'info');
                }
            }
        });
    },

    // Get current user
    getCurrentUser() {
        return auth.currentUser;
    }
};
