import { auth, db } from "../firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

const avatar = document.getElementById("avatar");
const fullName = document.getElementById("fullName");
const username = document.getElementById("username");
const email = document.getElementById("email");
const bio = document.getElementById("bio");

onAuthStateChanged(auth, async (user) => {

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {

        const data = userSnap.data();

        // Full Name
        fullName.textContent = data.fullName || "Unknown User";

        // Username
        username.textContent = data.username || "username";

        // Email
        email.textContent = data.email || "No email";

        // Bio
        bio.textContent = data.bio || "No bio yet.";

        // Avatar Initial
        if (data.fullName) {
            avatar.textContent = data.fullName.charAt(0).toUpperCase();
        } else {
            avatar.textContent = "?";
        }

    }

});

const logoutBtn = document.getElementById("logoutBtn");

logoutBtn.addEventListener("click", async () => {

    await signOut(auth);

    window.location.href = "login.html";

});