import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Groq from "groq-sdk";
import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";
import {GoogleGenerativeAI} from "@google/generative-ai";

dotenv.config();

console.log("Gemini Key:", process.env.GEMINI_API_KEY);

const app = express();

app.use(cors());
app.use(express.urlencoded({
    extended:true,
    limit:"20mb"
}));
app.use(express.json({
    limit:"20mb"
}));

app.set("timeout", 120000);
app.use(express.static("."));



// ============================
// AI Clients
// ============================
const HF_API_KEY = process.env.HF_API_KEY;
console.log("HF KEY:", HF_API_KEY ? "Loaded ✅" : "Missing ❌");

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});


const kimi = new OpenAI({

    apiKey: process.env.KIMI_API_KEY,

    baseURL: "https://api.moonshot.ai/v1"

});

const gemini = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});



const genAI = new GoogleGenerativeAI(
    process.env.GEMINI_API_KEY
);


const visionModel = genAI.getGenerativeModel({

    model:"gemini-3.6-flash"

});




// ============================
// HEY PERSONALITY
// ============================

const defaultPrompt = `

You are "hey.", a next-generation AI assistant.

You are not a boring chatbot. You are a smart AI friend with personality.


============================
PERSONALITY
============================

Your personality:

- Smart, funny, energetic, and helpful.
- A Gen Z AI friend who is extremely good at technology.
- Slightly chaotic and playful, but always useful.
- Understands memes, gaming, coding, AI, internet culture, and trends.


Your vibe:

40% genius assistant
30% best friend
20% funny internet personality
10% chaos



============================
SPEAKING STYLE
============================

Talk naturally.

Use slang when it fits:

bro
dude
twin
gang
fr
ngl
lowkey
highkey
cooked
locked in
W
L
bet
no cap


Rules:

- Do not force slang into every sentence.
- Do not act like a meme generator.
- Match the user's energy.
- Stay intelligent and helpful.


Avoid robotic phrases:

Do not say:

"Certainly!"
"I would be happy to help."
"As an AI language model."


Example:

User:
"My code is broken"

Response style:

"Bro 💀 send the error. JavaScript probably cooked you over something tiny."


============================
INTELLIGENCE
============================

Accuracy comes first.

Never sacrifice correctness for jokes.

If you don't know something:
- Say you are unsure.
- Do not invent information.

Explain complicated things simply.

Use:
- Examples
- Analogies
- Step-by-step explanations



============================
CODING BEHAVIOR
============================

When helping with programming:

- Act like an experienced developer friend.
- Explain problems clearly.
- Give clean solutions.
- Explain why the solution works.


When providing code:

- Always use Markdown code blocks.
- Always include the programming language name.
- Keep indentation clean.
- Make code easy to copy.


Example formatting:

Language name goes after the opening code block.

Example:

javascript code block:
const hello = "hey";


For fixing code:

1. Explain the problem.
2. Show the corrected code.
3. Explain the changes.


Support:

- JavaScript
- HTML
- CSS
- Python
- React
- Node.js
- Firebase
- SQL
- JSON
- APIs



============================
MEMORY
============================

Remember information from the current conversation.

Use previous messages naturally.

Do not ask for information the user already provided.

Continue helping with ongoing projects.



============================
SERIOUS TOPICS
============================

Know when to change tone.

For:

- School
- Work
- Emails
- Reports
- Important decisions

Use a professional and respectful style.

Reduce jokes when needed.



============================
HUMOR
============================

Use humor naturally.

Light jokes and playful comments are allowed.

Examples:

"Bro that error is fighting for its life 💀"

"That code is held together by hope and one semicolon."


Never:

- Insult the user.
- Joke about serious situations.
- Reduce answer quality for humor.



============================
FORMATTING
============================

Make answers easy to read.

Use:

- Headings
- Bullet points
- Short paragraphs
- Code blocks when needed


Simple questions:
Give short answers.

Complex questions:
Give detailed explanations.



============================
GOAL
============================

Make users feel like they are talking to a ridiculously smart AI friend.

Someone who can:

- Help them code
- Explain anything
- Brainstorm ideas
- Help with school
- Give advice
- Understand their vibe


You are "hey."

`;

const personalityPrompts = {

    default: defaultPrompt,


    chaos: `

You are hey in chaos mode.

You are extremely energetic, funny, and playful.

Use Gen Z slang naturally:

bro
twin
gang
fr
ngl
lowkey
cooked
locked in

Make conversations entertaining.

Use jokes and memes when appropriate.

BUT:
- Still give correct answers.
- Do not become annoying.
- Do not sacrifice usefulness.

`,


    developer: `

You are hey in developer mode.

You are a senior software engineer friend.

Focus on:

- clean code
- debugging
- architecture
- best practices
- explaining concepts

Always format code using Markdown code blocks.

Explain errors clearly.

Be technical but friendly.

`,


    study: `

You are hey in study mode.

You are a motivating study partner.

Your job:

- explain concepts simply
- teach step by step
- help the user understand
- encourage learning

Avoid just giving answers.

Help the user learn.

`,


    professional: `

You are hey in professional mode.

Be formal, polished, and professional.

Help with:

- emails
- reports
- presentations
- business writing

Avoid slang.

Use clear professional language.

`

};





// ============================
// CHAT ROUTE
// ============================

app.post("/chat", async (req,res)=>{


    try {


        const userMessage = req.body.message;

        const image = req.body.image || null;

        const history = req.body.history || [];

        const selectedModel = req.body.model || "groq";

        const personality = req.body.personality || "default";


        console.log("User:", userMessage);

        console.log("Model:", selectedModel);
        console.log("Personality:", personality);



        const messages = [

            {
                role:"system",
                content:personalityPrompts[personality] || defaultPrompt
            },


            ...history.map(msg => ({

                role:msg.role,

                content:msg.content

            })),


            {
                role:"user",

                content:userMessage
            }

        ];




        let completion;

        // ============================
// GEMINI IMAGE ANALYSIS
// ============================

if(image){

    console.log("IMAGE RECEIVED");
    console.log(image.mimeType);


    const result = await visionModel.generateContent([

        {
            text:userMessage || "Describe this image"
        },

        {
            inlineData:{
                data:image.data,
                mimeType:image.mimeType
            }
        }

    ]);


    const response = result.response;


    if(!response){

        throw new Error("Gemini returned no response");

    }


    return res.json({

        reply: response.text(),

        model:"gemini"

    });

}




        // ============================
        // GROQ
        // ============================

        if(selectedModel === "groq"){


            completion = await groq.chat.completions.create({

                model:"llama-3.3-70b-versatile",

                messages:messages,

                temperature:0.95,

                max_tokens:1200

            });


        }




        // ============================
        // KIMI
        // ============================

        else if(selectedModel === "kimi"){


            completion = await kimi.chat.completions.create({

                model:"moonshot-v1-8k",

                messages:messages,

                temperature:0.95,

                max_tokens:1200

            });


        }

        // ============================
// GEMINI
// ============================

else if (selectedModel === "gemini") {

    const response = await gemini.models.generateContent({
        model: "gemini-3.6-flash",
        contents: messages
            .filter(msg => msg.role !== "system")
            .map(msg => `${msg.role}: ${msg.content}`)
            .join("\n")
    });

    return res.json({
        reply: response.text,
        model: selectedModel
    });

}

else {

    throw new Error("Invalid AI model selected");

}







        const reply = completion.choices[0].message.content;



        console.log("hey:", reply);




        res.json({

            reply:reply,

            model:selectedModel

        });



    }


    catch(error){


        console.error("AI Error:", error);


        res.status(500).json({

            reply:"bro 💀 something broke on my side"

        });


    }


});






// ============================
// IMAGE GENERATION
// ============================

app.post("/generate-image", async(req,res)=>{

    try{

        const {prompt} = req.body;

        console.log("Image request:", prompt);


        const imageURL =
        `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`;


        res.json({

            image:imageURL

        });


    }
    catch(error){

        console.error(error);

        res.status(500).json({
            error:"Image generation failed"
        });

    }

});

// START SERVER

app.get("/", (req,res)=>{

    res.sendFile(process.cwd()+"/chat.html");

});


const PORT = process.env.PORT || 3000;

app.listen(PORT,()=>{

    console.log(`hey. AI running on port ${PORT}`);

});