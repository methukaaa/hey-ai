import { auth, db } from "../firebase.js";


import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword
}
from
"https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";


import {
    doc,
    setDoc
}
from
"https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";




// ============================
// REGISTER
// ============================

const registerForm = document.getElementById("registerForm");


if(registerForm){


    registerForm.addEventListener("submit", async (e)=>{


        e.preventDefault();



        const username =
        document.getElementById("username").value;


        const fullName =
        document.getElementById("fullName").value;


        const email =
        document.getElementById("email").value;



        const password =
        document.getElementById("password").value;



        try{


            const userCredential =
            await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );


            const user =
            userCredential.user;



            // Save user information

            await setDoc(
                doc(db,"users",user.uid),
                {

                    fullName: fullName,

                    username: username,

                    email: email,

                    createdAt: new Date()

                }
            );



            console.log("Account created");



            window.location.href =
            "chat.html";



        }
        catch(error){


            console.error(error);


            alert(error.message);


        }


    });


}






// ============================
// LOGIN
// ============================

const loginForm =
document.getElementById("loginForm");



if(loginForm){


    loginForm.addEventListener("submit", async(e)=>{


        e.preventDefault();



        const email =
        document.getElementById("email").value;



        const password =
        document.getElementById("password").value;



        try{


            await signInWithEmailAndPassword(

                auth,

                email,

                password

            );



            console.log("Logged in");



            window.location.href =
            "chat.html";



        }


        catch(error){


            console.error(error);


            alert("wrong email or password");


        }



    });


}