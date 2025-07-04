import axios from "axios";
import {config} from "../config/config";

const cleanResponse = (response: string): string => {
    return response.replace(/\\boxed{(.*?)}/g, "$1"); // Removes \boxed{}
}

/**
 * @example
 * await streamChatWithAI(
 *     ["How would you build the tallest building ever?"],
 *     "You are a helpful assistant.",
 *     (chunk) => {
 *         // Handle each chunk of the response
 *         console.log(chunk);
 *         // Or update your UI with the chunk
 *     }
 * );
 */
export const streamChatWithAI = async (
    systemMessageContent: string,
    userMessageContents: string[],
    onChunk: (chunk: string) => void
): Promise<void> => {
    try {
        const API_URL = config.chatAi.api_url();
        const API_KEY = config.chatAi.api_key();
        const MODEL_NAME = config.chatAi.model_name();

        const systemMessage = {
            role: 'system',
            content: systemMessageContent
        };

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: MODEL_NAME,
                messages: [ systemMessage, ...userMessageContents.map(userMessageContent => ({
                    role: 'user',
                    content: userMessageContent
                  })) ],
                stream: true,
            }),
        });

        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error('Response body is not readable');
        }

        const decoder = new TextDecoder();
        let buffer = '';

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    if (response.status !== 200) {
                        throw new Error(buffer);
                    }
                    break;
                }

                // Append new chunk to buffer
                buffer += decoder.decode(value, { stream: true });

                // Process complete lines from buffer
                while (true) {
                    const lineEnd = buffer.indexOf('\n');
                    if (lineEnd === -1) break;

                    const line = buffer.slice(0, lineEnd).trim();
                    buffer = buffer.slice(lineEnd + 1);

                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') break;

                        try {
                            const parsed = JSON.parse(data);
                            const content = parsed.choices[0].delta.content;
                            if (content) {
                                onChunk(content);
                            }
                        } catch (e) {
                            // Ignore invalid JSON
                        }
                    }
                }
            }
        } finally {
            reader.cancel();
        }
    } catch (error) {
        console.error("Error streaming with OpenRouter:", error);
        throw error;
    }
}

export const chatWithAI = async (systemMessageContent: string, userMessageContents: string[]): Promise<string> => {
    try {
        const API_URL = config.chatAi.api_url();
        const API_KEY = config.chatAi.api_key();
        const MODEL_NAME = config.chatAi.model_name();

        const systemMessage = {
            role: 'system',
            content: systemMessageContent
        };

        const response = await axios.post(
            API_URL,
            {
                model: MODEL_NAME,
                messages: [ systemMessage, ...userMessageContents.map(userMessageContent => ({
                    role: 'user',
                    content: userMessageContent
                  })) ],
            },
            {
                headers: {
                    Authorization: `Bearer ${API_KEY}`,
                    "Content-Type": "application/json",
                },
            }
        );

        const answer = response.data.choices[0].message.content;
        const cleanedAnswer = cleanResponse(answer);
        return cleanedAnswer;
    } catch (error) {
        console.error("Error communicating with OpenRouter:", error);
        return "Sorry, an error occurred.";
    }
}
