// PASTE YOUR FIREBASE CONFIG OBJECT HERE
  const firebaseConfig = {
    apiKey: "AIzaSyCWOXIiag2S6fyuQB_ndO8LA8NAmXwPp6A",
    authDomain: "clinical-mood.firebaseapp.com",
    projectId: "clinical-mood",
    storageBucket: "clinical-mood.firebasestorage.app",
    messagingSenderId: "46969536685",
    appId: "1:46969536685:web:63aa3864a2a9d837c50624",
    measurementId: "G-XPZLC19SRV"
  };

// Initialize Firebase
 const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
// --- Register Logic ---
const registerForm = document.getElementById('register-form');
if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;

        auth.createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                console.log('User registered:', userCredential.user);
                window.location.href = 'index.html'; // Redirect to main app
            })
            .catch((error) => {
                alert(error.message);
            });
    });
}

// --- Login Logic ---
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        auth.signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                console.log('User logged in:', userCredential.user);
                window.location.href = 'index.html'; // Redirect to main app
            })
            .catch((error) => {
                alert(error.message);
            });
    });
}