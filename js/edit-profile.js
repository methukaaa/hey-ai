import { auth, db } from "../firebase.js";


import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";


import {
    doc,
    getDoc,
    setDoc
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";



const fullNameInput = document.getElementById("fullName");
const usernameInput = document.getElementById("username");
const bioInput = document.getElementById("bio");

const saveBtn = document.getElementById("saveBtn");


let currentUser = null;



onAuthStateChanged(auth, async(user)=>{


    if(user){


        currentUser = user;


        const userRef = doc(db,"users",user.uid);


        const snapshot = await getDoc(userRef);



        if(snapshot.exists()){


            const data = snapshot.data();


            fullNameInput.value = data.fullName || "";

            usernameInput.value = data.username || "";

            bioInput.value = data.bio || "";


        }


    }


});





saveBtn.addEventListener("click", async()=>{


    console.log("Save button clicked");


    if(!currentUser){

        console.log("No user logged in");
        return;

    }



    try{


        await setDoc(

            doc(db,"users",currentUser.uid),

            {

                fullName: fullNameInput.value,

                username: usernameInput.value,

                bio: bioInput.value,

                email: currentUser.email

            },

            {
                merge:true
            }

        );


        console.log("Profile saved");


        window.location.href="profile.html";


    }


    catch(error){

        console.log("SAVE ERROR:", error);

    }


});