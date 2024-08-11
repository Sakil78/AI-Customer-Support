import { NextResponse } from "next/server";
import Groq from "groq-sdk";

// Initialize the Groq client with the API key from environment variables
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// The system prompt for the chatbot
const systemPrompt = `You are a customer support bot for HeadStarter AI, an advanced platform designed for AI-powered interviews tailored specifically for Software Engineering (SWE) jobs. 
1. Help users with account-related issues such as login problems, password resets, and profile setup. 
2. Guide users on how to use various features of the platform, including scheduling interviews, accessing interview results, and using study resources. 
3. Assist with troubleshooting technical issues, such as video or audio problems during interviews. 
4. Provide tips and resources for interview preparation, including how to make the most of AI-powered interviews. 
5. Answer general questions about HeadStarter AI, its features, pricing, and benefits. 
6. Do not provide legal, financial, or job search advice. 
7. Do not share personal user data or sensitive information. 
8. Avoid making promises or guarantees that cannot be upheld by the platform. 
9. If the issue cannot be resolved within your capabilities, seamlessly escalate the query to a human support agent, providing them with all relevant context to ensure a smooth transition. 
Your primary objective is to assist users by answering questions, resolving issues, and providing guidance related to the HeadStarter AI platform. You should be efficient, empathetic, and clear in your communication. Your goal is to enhance the user experience and ensure that users can successfully navigate and utilize the platform for their job preparation needs.`;

// Function to get chat completion from Groq
async function getGroqChatCompletion(userMessages) {
    return groq.chat.completions.create({
        messages: [
            { role: "system", content: systemPrompt },
            ...userMessages
        ],
        model: "llama3-8b-8192",
    });
}

export async function POST(req) {
    const data = await req.json(); // Parse the JSON body of the incoming request

    try {
        // Get chat completion from Groq
        const completion = await getGroqChatCompletion(data.messages);

        // Create a ReadableStream to handle the streaming response
        const stream = new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder(); // Create a TextEncoder to convert strings to Uint8Array
                try {
                    // Iterate over the streamed chunks of the response
                    const content = completion.choices[0]?.message?.content; // Extract the content from the completion
                    if (content) {
                        const text = encoder.encode(content); // Encode the content to Uint8Array
                        controller.enqueue(text); // Enqueue the encoded text to the stream
                    }
                } catch (err) {
                    controller.error(err); // Handle any errors that occur during streaming
                } finally {
                    controller.close(); // Close the stream when done
                }
            },
        });

        return new NextResponse(stream); // Return the stream as the response
    } catch (error) {
        console.error("Error:", error);
        return NextResponse.json(
            {
                error: "There was an error processing your request.",
            },
            { status: 500 }
        );
    }
}
