import { auth, db } from "../firebase.js";

import { 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";


import {
    doc,
    getDoc,
    collection,
    addDoc,
    updateDoc,
    getDocs,
    deleteDoc,
    serverTimestamp,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";


let selectedImage = null;




console.log("chat.js loaded");
// ============================
// Markdown Renderer
// ============================

function renderMarkdown(text){

    if(window.marked){

        return marked.parse(text);

    }

    return text;

}


// ============================
// Welcome text rotation
// ============================

const welcomeText = document.getElementById("welcomeText");

const welcomeMessages = [
    "hey, what can i help with?",
    "umm so... what's on the agenda today?",
    "got a question? throw it at me.",
    "need ideas? i'm listening.",
    "curious about something?",
    "let's figure something out.",
    "i'm here. what's up?",
    "no pressure, but i am ready to be useful.",
    "alright, what are we cooking today?",
    "brain loading... just kidding, i'm ready.",
    "tell me something interesting.",
    "need help or just avoiding work? 👀",
    "i promise i won't judge your search history.",
    "another day, another question. hit me.",
    "drop a thought. i'll do the thinking part.",
    "your move. i'm listening.",
    "hello human, what shall we create?",
    "ready when you are 🚀",
];


let welcomeIndex = 0;


function rotateWelcomeText(){

    if(!welcomeText) return;

    welcomeText.style.opacity = 0;

    setTimeout(()=>{

        welcomeText.textContent = welcomeMessages[welcomeIndex];

        welcomeIndex++;

        if(welcomeIndex >= welcomeMessages.length){

            welcomeIndex = 0;

        }

        welcomeText.style.opacity = 1;


    },500);

}


rotateWelcomeText();

setInterval(rotateWelcomeText,3500);




// ============================
// Chat System
// ============================

const chatForm = document.getElementById("chatForm");

const messageInput = document.getElementById("messageInput");

const messages = document.getElementById("messages");



let chatHistory = [];

let currentChatId = null;

let currentUserId = null;

let currentUserName = "User";



console.log("AUTH:", auth);
console.log("DATABASE:", db);



onAuthStateChanged(auth, async(user)=>{


    if(user){

        currentUserId = user.uid;

        await loadRecentChats();

        console.log("Logged in:", user.email);



        const userRef = doc(db,"users",user.uid);



        const userSnap = await getDoc(userRef);



        if(userSnap.exists()){


            const userData = userSnap.data();


            currentUserName = userData.name;


            console.log("AI user:", currentUserName);


        }


    }


});

let imageMode = false;

const imageModeLabel =
document.getElementById("imageModeLabel");


if(imageModeBtn){

    imageModeBtn.addEventListener(
    "click",
    ()=>{

        imageMode = !imageMode;


        imageModeBtn.classList.toggle(
            "active",
            imageMode
        );


        if(imageMode){

            messageInput.placeholder =
            "Describe the image you want... 🎨";


            if(imageModeLabel){

                imageModeLabel.classList.add("active");

            }


            console.log(
                "Image generation enabled"
            );

        }
        else{

            messageInput.placeholder =
            "Message hey...";


            if(imageModeLabel){

                imageModeLabel.classList.remove("active");

            }


            console.log(
                "Image generation disabled"
            );

        }


    });

}




// ============================
// MODEL SWITCH
// ============================


// ============================
// MODEL SWITCH
// ============================

let selectedModel = "groq";

const modelBtn = document.getElementById("modelBtn");

const models = [
    {
        id: "groq",
        label: "groq 🔍"
    },
    {
        id: "gemini",
        label: "gemini ✨"
    },
    
];

let currentModelIndex = 0;

if (modelBtn) {

    // Show the first model on page load
    modelBtn.textContent = models[currentModelIndex].label;


    modelBtn.addEventListener("click", () => {


        // prevent switching away from Gemini while image exists
        if(selectedImage){

            selectedModel = "gemini";

            modelBtn.textContent = "gemini ✨";

            console.log("Image attached → Gemini locked");

            return;

        }



        currentModelIndex++;


        if (currentModelIndex >= models.length) {

            currentModelIndex = 0;

        }


        selectedModel = models[currentModelIndex].id;

        modelBtn.textContent = models[currentModelIndex].label;


        console.log(
            "Current model:",
            selectedModel
        );


    });

}

// ============================
// PERSONALITY MODE
// ============================

let selectedPersonality = "default";


const personalityBtn = document.getElementById("personalityBtn");

const personalityMenu = document.getElementById("personalityMenu");



if(personalityBtn && personalityMenu){


    personalityBtn.addEventListener("click",()=>{


        personalityMenu.classList.toggle("show");


    });


}



document.querySelectorAll("[data-mode]").forEach(button=>{


    button.addEventListener("click",()=>{


        selectedPersonality = button.dataset.mode;


        if(personalityBtn){

            personalityBtn.textContent =
            "⚡ " + selectedPersonality;

        }


        personalityMenu.classList.remove("show");


        console.log(
            "Personality:",
            selectedPersonality
        );


    });


});




function scrollToBottom(){

    messages.scrollTop = messages.scrollHeight;

}

function startNewChat(){


    currentChatId = null;


    chatHistory = [];


    messages.innerHTML = `

        <div class="welcome">

            <h1 id="welcomeText">
                hey, what can i help with?
            </h1>

        </div>

    `;


    selectedImage = null;


    if(imagePreviewContainer){

        imagePreviewContainer.style.display="none";

    }


    selectedModel="groq";


    if(modelBtn){

        modelBtn.textContent="groq 🔍";

    }


    // reset input
    messageInput.value="";


    console.log("New chat started");


}

async function loadRecentChats(){

    if(!currentUserId) return;


    const chatsRef = collection(
        db,
        "users",
        currentUserId,
        "chats"
    );


    const q = query(
        chatsRef,
        orderBy(
            "createdAt",
            "desc"
        )
    );


    const snapshot = await getDocs(q);


    const chatList =
    document.getElementById("chatList");


    chatList.innerHTML="";


    snapshot.forEach((chat)=>{


        const data = chat.data();


        const button =
        document.createElement("button");


        button.className = "chat-item";


        button.textContent =
        data.title || "untitled chat";



        button.onclick = ()=>{

            openChat(
                chat.id,
                data.messages
            );

        };


        chatList.appendChild(button);


    });


}

function openChat(id,messagesData){


    currentChatId=id;


    chatHistory =
    messagesData || [];


    messages.innerHTML="";


    chatHistory.forEach(msg=>{


        messages.innerHTML += `

        <div class="message ${msg.role}">

            ${
            msg.role==="assistant"
            ?
            renderMarkdown(msg.content)
            :
            msg.content
            }

        </div>

        `;


    });


    scrollToBottom();


}




// ============================
// SEND MESSAGE
// ============================


chatForm.addEventListener("submit", async(event)=>{


    event.preventDefault();



    const userMessage = messageInput.value.trim();



    if(!userMessage && !selectedImage) return;

    if(!currentChatId && currentUserId){


    const chatRef = await addDoc(

        collection(
            db,
            "users",
            currentUserId,
            "chats"
        ),

        {

            title:"new chat",

            createdAt:
            serverTimestamp(),

            messages:[]

        }

    );


    currentChatId = chatRef.id;

    await loadRecentChats();


}




    const welcome = document.querySelector(".welcome");



    if(welcome){

        welcome.style.display="none";

    }




    chatHistory.push({

        role:"user",

        content:userMessage

    });





let imageHTML = "";

if(selectedImage){

    imageHTML = `
        <div class="sent-image-container">
            <img 
                src="${URL.createObjectURL(selectedImage)}"
                class="sent-image"
            >
        </div>
    `;

}


messages.innerHTML += `

    <div class="message user">

        ${userMessage.replace(/</g,"&lt;").replace(/>/g,"&gt;")}

        ${imageHTML}

    </div>

`;



    scrollToBottom();



    messageInput.value="";



    const loading = document.createElement("div");


    loading.className="message ai";


    loading.textContent="thinking...";


    messages.appendChild(loading);



    scrollToBottom();

// ============================
// IMAGE GENERATION MODE
// ============================

if(imageMode){

    const response = await fetch(
        "http://localhost:3000/generate-image",
        {
            method:"POST",

            headers:{
                "Content-Type":"application/json"
            },

            body:JSON.stringify({

                prompt:userMessage

            })

        }
    );


    const data = await response.json();


    loading.remove();


    if(data.image){

        messages.innerHTML += `

        <div class="message ai">

            <img 
            src="${data.image}"
            class="generated-image">

        </div>

        `;

    }
    else{

        messages.innerHTML += `

        <div class="message ai">

            image generation failed 💀

        </div>

        `;

    }


    scrollToBottom();


    chatHistory.push({

        role:"assistant",

        content:"Generated an image"

    });


    return;

}






    try{


        const image = await getImageBase64();



        // clear attachment AFTER conversion


if (selectedImage) {

    selectedImage = null;
    imageInput.value = "";

    if (imagePreviewContainer) {
        imagePreviewContainer.style.display = "none";
    }

    // Go back to Groq only after sending an image
    selectedModel = "groq";
    currentModelIndex = 0;

    if (modelBtn) {
        modelBtn.textContent = "groq 🔍";
    }
}

if(modelBtn){

    modelBtn.textContent="groq 🔍";

}


        const response = await fetch("http://localhost:3000/chat",{


            method:"POST",


            headers:{


                "Content-Type":"application/json"


            },


            body:JSON.stringify({


                message:userMessage,


                history:chatHistory,


                model:selectedModel,


                personality: selectedPersonality,


                username:currentUserName ,


                image:image

            })


        });





        console.log("Server status:", response.status);



        const data = await response.json();



        console.log("AI DATA:", data);




        loading.remove();




        if(data.reply){



            chatHistory.push({


                role:"assistant",


                content:data.reply


            });

            if(chatHistory.length === 2){

            generateChatTitle();

            }

    if(currentUserId && currentChatId){

        await updateDoc(

            doc(
                db,
                "users",
                currentUserId,
                "chats",
                currentChatId
            ),

            {
                messages: chatHistory
            }

        );

    }

            
            messages.innerHTML += `


                <div class="message ai">


                    ${renderMarkdown(data.reply)}


                </div>


            `;


        }

        else{


            messages.innerHTML += `


                <div class="message ai">


                    no response received 💀


                </div>


            `;


        }



        scrollToBottom();





    }


    catch(error){


        console.error("CHAT ERROR:", error);



        loading.remove();



        messages.innerHTML += `


        <div class="message ai">

            sorry, something went wrong.

        </div>


        `;



        scrollToBottom();


    }



});




// ============================
// SIDEBAR
// ============================


const sidebar = document.querySelector(".sidebar");

const logo = document.getElementById("logoBtn");



if(logo){


    logo.addEventListener("click",(e)=>{


        e.stopPropagation();


        sidebar.classList.toggle("open");


    });


}



document.addEventListener("click",(e)=>{


    if(

        sidebar &&

        !sidebar.contains(e.target) &&

        logo &&

        !logo.contains(e.target)

    ){


        sidebar.classList.remove("open");


    }


});

// ============================
// IMAGE UPLOAD
// ============================

const uploadBtn = document.getElementById("uploadBtn");
const imageInput = document.getElementById("imageInput");

const imagePreview = document.getElementById("imagePreview");
const imagePreviewContainer = document.getElementById("imagePreviewContainer");

const removeImage = document.getElementById("removeImage");

const imageName = document.getElementById("imageName");
const imageSize = document.getElementById("imageSize");



// Upload button

if(uploadBtn && imageInput){

    uploadBtn.addEventListener("click",()=>{

        imageInput.click();

    });

}



// Image selected

if(imageInput){

    imageInput.addEventListener("change",()=>{


        const file = imageInput.files[0];


        if(!file) return;



        selectedImage = file;



        // auto switch to Gemini

        selectedModel = "gemini";


        if(modelBtn){

            modelBtn.textContent = "gemini ✨";

        }



        console.log(
            "Image uploaded → Gemini mode"
        );



        // preview

        if(imagePreview){

            imagePreview.src =
            URL.createObjectURL(file);

        }



        if(imagePreviewContainer){

            imagePreviewContainer.style.display="flex";

        }



        if(imageName){

            imageName.textContent=file.name;

        }



        if(imageSize){

            imageSize.textContent =
            (file.size / 1024 / 1024)
            .toFixed(2)
            + " MB";

        }



    });

}



// Remove image

if(removeImage){

    removeImage.addEventListener("click",()=>{


        selectedImage=null;


        imageInput.value="";



        if(imagePreviewContainer){

            imagePreviewContainer.style.display="none";

        }



        if(imageName){

            imageName.textContent="";

        }



        if(imageSize){

            imageSize.textContent="";

        }



        // return back to normal model

        selectedModel="groq";



        if(modelBtn){

            modelBtn.textContent="groq 🔍";

        }



        console.log(
            "Image removed → Groq mode"
        );



    });

}


/* ===========================
   GEMINI IMAGE CONVERTER
=========================== */


function getImageBase64(){

    return new Promise((resolve)=>{


        if(!selectedImage){

            resolve(null);

            return;

        }


        const file = selectedImage;


        const reader = new FileReader();


        reader.onload = () => {


            const base64 = reader.result.split(",")[1];


            resolve({

                data: base64,

                mimeType: file.type

            });


        };


        reader.readAsDataURL(file);


    });

}




const voiceBtn = document.getElementById("voiceBtn");
const searchBtn = document.getElementById("searchBtn");

if(voiceBtn){

    voiceBtn.addEventListener("click",()=>{

        alert("Voice mode coming soon 🎤");

    });

}



// ============================
// QUICK ACTIONS
// ============================

const quickActions = document.querySelectorAll(".quick-action");


const quickPrompts = {

    code:
    "I need help with coding. Help me debug, explain, or improve my code step by step.",


    study:
    "Act as my study tutor. Explain concepts clearly and help me understand this topic:",


    brainstorm:
    "Help me brainstorm creative ideas. Give me multiple options and explain them.",


    writing:
    "Help me improve my writing. Fix grammar, structure, and make it sound better:",


    image:
    null

};



quickActions.forEach(button=>{


    button.addEventListener("click",()=>{


        const action = button.dataset.action;



        // Image action

        if(action === "image"){


            selectedModel = "gemini";


            if(modelBtn){

                modelBtn.textContent="gemini ✨";

            }


            imageInput.click();


            return;

        }



        // Normal prompts

        const prompt = quickPrompts[action];



        if(prompt){


            messageInput.value = prompt;


            messageInput.focus();


        }


    });


});

const newChatBtn =
document.getElementById("newChat");


if(newChatBtn){

    newChatBtn.addEventListener(
        "click",
        startNewChat
    );

}

async function generateChatTitle(){


    if(!currentChatId) return;


    try{


        const response = await fetch(
            "http://localhost:3000/chat",
            {

                method:"POST",

                headers:{
                    "Content-Type":"application/json"
                },

                body:JSON.stringify({

                    message:
                    `
                    Create a short chat title.
                    Maximum 5 words.
                    No quotes.
                    Topic:
                    ${chatHistory[0].content}
                    `,

                    model:"groq",

                    history:[]

                })

            }
        );



        const data = await response.json();



        if(data.reply){


            await updateDoc(

                doc(
                    db,
                    "users",
                    currentUserId,
                    "chats",
                    currentChatId
                ),

                {

                    title:data.reply.trim().toLowerCase()

                }

            );


            loadRecentChats();


        }


    }
    catch(error){

        console.log(
            "Title generation failed",
            error
        );

    }


}

const clearChatsBtn = document.getElementById("clearChatsBtn");

clearChatsBtn.addEventListener("click", async () => {

    if(!currentUserId){
        alert("No user found");
        return;
    }


    const confirmClear = confirm(
        "Delete all chat history?"
    );


    if(!confirmClear) return;


    try {

        const chatsRef = collection(db, "chats");


        const snapshot = await getDocs(chatsRef);


        const deleteTasks = snapshot.docs
            .filter(doc => 
                doc.data().userId === currentUserId
            )
            .map(doc =>
                deleteDoc(doc.ref)
            );


        await Promise.all(deleteTasks);


        document.getElementById("chatList").innerHTML = "";

        document.getElementById("messages").innerHTML = "";

        currentChatId = null;

        chatHistory = [];


        console.log("Deleted chats:", deleteTasks.length);


    } catch(error){

        console.error(
            "Delete failed:",
            error
        );

    }

});