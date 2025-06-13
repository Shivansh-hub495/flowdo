// Gemini API Configuration and Client using OpenAI SDK
import OpenAI from 'openai';

// Web search function using multiple fallback methods
async function performWebSearch(query: string): Promise<string> {
  console.log('Performing web search for:', query);

  try {
    // Method 1: Try DuckDuckGo instant answer API
    try {
      const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
      console.log('Trying DuckDuckGo API:', ddgUrl);

      const response = await fetch(ddgUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('DuckDuckGo response:', data);

        let results = '';

        if (data.AbstractText) {
          results += `Summary: ${data.AbstractText}\n`;
        }

        if (data.Definition) {
          results += `Definition: ${data.Definition}\n`;
        }

        if (data.Answer) {
          results += `Answer: ${data.Answer}\n`;
        }

        if (data.RelatedTopics && data.RelatedTopics.length > 0) {
          results += '\nRelated Information:\n';
          data.RelatedTopics.slice(0, 3).forEach((topic: any, index: number) => {
            if (topic.Text) {
              results += `${index + 1}. ${topic.Text}\n`;
            }
          });
        }

        if (results) {
          console.log('DuckDuckGo search successful');
          return results;
        }
      }
    } catch (ddgError) {
      console.log('DuckDuckGo API failed:', ddgError);
    }

    // Method 2: Fallback - provide search context to AI
    console.log('Using fallback search method');
    return `Web search requested for: "${query}"\n\nNote: Direct web search is temporarily unavailable due to CORS restrictions. Please provide the most current and accurate information you have about this topic, and mention if the information might be outdated.`;

  } catch (error) {
    console.error('All web search methods failed:', error);
    return `Web search temporarily unavailable for "${query}". Providing response based on available knowledge.`;
  }
}

const GEMINI_API_KEY = "AIzaSyCrtkMOzyietUvehdPthI4N-2ZCyFMgtVY";
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

// Test the API key format
console.log('Gemini API Key format check:', {
  length: GEMINI_API_KEY.length,
  prefix: GEMINI_API_KEY.substring(0, 15),
  hasHyphens: GEMINI_API_KEY.includes('-'),
  isValidFormat: GEMINI_API_KEY.startsWith('AIza') && GEMINI_API_KEY.length === 39
});

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string | Array<{
    type: "text" | "image_url";
    text?: string;
    image_url?: {
      url: string;
      detail?: "low" | "high" | "auto";
    };
  }>;
}

interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  content?: string; // Extracted text content
  processed: boolean;
  error?: string;
}

// Use OpenAI types for better compatibility
type OpenAIChatMessage = OpenAI.Chat.Completions.ChatCompletionMessageParam;

interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

class GeminiClient {
  private apiKey: string;
  private baseURL: string;

  constructor(apiKey: string, baseURL: string) {
    this.apiKey = apiKey;
    this.baseURL = baseURL;
    console.log('Gemini Client initialized with:', {
      baseURL: this.baseURL,
      apiKeyPrefix: this.apiKey.substring(0, 15) + '...'
    });
  }

  async createChatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    try {
      const model = request.model || "gemini-2.0-flash";
      console.log('Sending request to Gemini API:', {
        url: `${this.baseURL}/models/${model}:generateContent`,
        model: model,
        messageCount: request.messages.length,
        authKey: `${this.apiKey.substring(0, 15)}...`
      });

      // Convert OpenAI format to Gemini format
      const geminiRequest = this.convertToGeminiFormat(request);

      const response = await fetch(`${this.baseURL}/models/${model}:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(geminiRequest),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API error response:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: errorText
        });
        throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Gemini API response received:', {
        candidates: data.candidates?.length,
        usageMetadata: data.usageMetadata
      });

      // Convert Gemini response back to OpenAI format
      return this.convertFromGeminiFormat(data, model);
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      throw error;
    }
  }

  private convertToGeminiFormat(request: ChatCompletionRequest): any {
    const contents: any[] = [];

    for (const message of request.messages) {
      if (message.role === 'system') {
        // System messages are handled differently in Gemini
        continue;
      }

      const parts: any[] = [];

      if (typeof message.content === 'string') {
        parts.push({ text: message.content });
      } else if (Array.isArray(message.content)) {
        for (const item of message.content) {
          if (item.type === 'text' && item.text) {
            parts.push({ text: item.text });
          } else if (item.type === 'image_url' && item.image_url) {
            // Convert base64 image to Gemini format
            const imageUrl = item.image_url.url;
            if (imageUrl.startsWith('data:')) {
              const [mimeType, base64Data] = imageUrl.split(',');
              const mediaType = mimeType.split(':')[1].split(';')[0];
              parts.push({
                inlineData: {
                  mimeType: mediaType,
                  data: base64Data
                }
              });
            }
          }
        }
      }

      contents.push({
        role: message.role === 'assistant' ? 'model' : 'user',
        parts: parts
      });
    }

    const geminiRequest: any = {
      contents: contents
    };

    // Add generation config
    if (request.temperature !== undefined || request.max_tokens !== undefined) {
      geminiRequest.generationConfig = {};
      if (request.temperature !== undefined) {
        geminiRequest.generationConfig.temperature = request.temperature;
      }
      if (request.max_tokens !== undefined) {
        geminiRequest.generationConfig.maxOutputTokens = request.max_tokens;
      }
    }

    // Add system instruction if present
    const systemMessage = request.messages.find(msg => msg.role === 'system');
    if (systemMessage && typeof systemMessage.content === 'string') {
      geminiRequest.systemInstruction = {
        parts: [{ text: systemMessage.content }]
      };
    }

    return geminiRequest;
  }

  private convertFromGeminiFormat(geminiResponse: any, model: string): ChatCompletionResponse {
    const candidate = geminiResponse.candidates?.[0];
    const content = candidate?.content?.parts?.[0]?.text || '';

    return {
      id: `chatcmpl-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: model,
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: content
        },
        finish_reason: candidate?.finishReason?.toLowerCase() || 'stop'
      }],
      usage: {
        prompt_tokens: geminiResponse.usageMetadata?.promptTokenCount || 0,
        completion_tokens: geminiResponse.usageMetadata?.candidatesTokenCount || 0,
        total_tokens: geminiResponse.usageMetadata?.totalTokenCount || 0
      }
    };
  }

  async sendMessage(
    message: string,
    conversationHistory: ChatMessage[] = [],
    options: {
      webSearchEnabled?: boolean;
      attachments?: FileAttachment[];
    } = {}
  ): Promise<string> {
    const { webSearchEnabled = false, attachments = [] } = options;

    console.log('sendMessage called with:', {
      message: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
      conversationHistoryLength: conversationHistory.length,
      webSearchEnabled,
      attachmentsCount: attachments.length
    });

    // Prepare system message with enhanced capabilities
    let systemContent = "You are Vikram, a helpful AI assistant integrated into FlowDo, a productivity application. You help users with productivity tips, task management, focus techniques, and general assistance. Be friendly, concise, and helpful.";

    if (webSearchEnabled) {
      systemContent += " You have access to web search capabilities to provide up-to-date information.";
    }

    if (attachments.length > 0) {
      systemContent += " You can analyze uploaded files including PDFs and images.";
    }

    // Build messages array with multimodal content support
    const messages: OpenAIChatMessage[] = [
      {
        role: "system",
        content: systemContent
      },
      ...conversationHistory.map(msg => {
        if (typeof msg.content === 'string') {
          return {
            role: msg.role,
            content: msg.content
          } as OpenAIChatMessage;
        } else {
          return {
            role: msg.role,
            content: msg.content
          } as OpenAIChatMessage;
        }
      }),
    ];

    // Prepare user message with attachments
    let userContent: any = message;

    if (attachments.length > 0) {
      console.log('Processing attachments:', attachments.map(a => ({ name: a.name, type: a.type, hasContent: !!a.content })));

      userContent = [
        { type: "text", text: message }
      ];

      // Add image attachments
      for (const attachment of attachments) {
        if (attachment.type.startsWith('image/')) {
          console.log('Adding image attachment:', {
            name: attachment.name,
            type: attachment.type,
            urlLength: attachment.url.length,
            urlPrefix: attachment.url.substring(0, 50) + '...'
          });
          userContent.push({
            type: "image_url",
            image_url: {
              url: attachment.url,
              detail: "auto" // Changed from "high" to "auto" for better compatibility
            }
          });
        } else if (attachment.content) {
          // Add extracted text from PDFs
          console.log('Adding text content from:', attachment.name);
          userContent[0].text += `\n\nContent from ${attachment.name}:\n${attachment.content}`;
        }
      }
    }

    messages.push({
      role: "user",
      content: userContent
    });

    try {
      console.log('Sending message to Gemini API:', {
        model: "gemini-2.0-flash",
        messageCount: messages.length,
        webSearchEnabled,
        attachmentCount: attachments.length,
        timestamp: new Date().toISOString()
      });

      const requestBody: any = {
        model: "gemini-2.0-flash",
        messages,
        temperature: 0.7,
        max_tokens: 1000,
      };

      // Add web search if enabled
      if (webSearchEnabled) {
        console.log('Web search enabled, performing search...');

        // Extract search query from the user's message
        const userMessage = messages[messages.length - 1];
        const searchQuery = typeof userMessage.content === 'string' ? userMessage.content :
          Array.isArray(userMessage.content) ?
            (userMessage.content.find(c => c.type === 'text') as any)?.text || '' : '';

        if (searchQuery) {
          try {
            console.log('Performing web search for query:', searchQuery);
            const searchResults = await performWebSearch(searchQuery);
            console.log('Web search results received:', searchResults.substring(0, 200) + '...');

            // Add search results to the system message
            const systemMessage = messages.find(m => m.role === 'system');
            if (systemMessage && typeof systemMessage.content === 'string') {
              systemMessage.content += `\n\nCurrent web search results for "${searchQuery}":\n${searchResults}\n\nUse this current information to provide an accurate, up-to-date response.`;
              console.log('Web search results added to system message');
            }
          } catch (searchError) {
            console.error('Web search failed:', searchError);
            // Continue without search results
            const systemMessage = messages.find(m => m.role === 'system');
            if (systemMessage && typeof systemMessage.content === 'string') {
              systemMessage.content += " Note: Web search was requested but temporarily unavailable. Provide the best answer with available knowledge.";
            }
          }
        }
      }

      console.log('Final request body:', {
        model: requestBody.model,
        messageCount: requestBody.messages.length,
        temperature: requestBody.temperature,
        max_tokens: requestBody.max_tokens
      });

      // Use the direct Gemini API instead of OpenAI SDK
      let completion: ChatCompletionResponse;
      let retryCount = 0;
      const maxRetries = 2;

      while (retryCount <= maxRetries) {
        try {
          completion = await this.createChatCompletion(requestBody);
          break; // Success, exit retry loop
        } catch (error) {
          retryCount++;
          console.log(`Attempt ${retryCount} failed:`, error);

          if (retryCount > maxRetries) {
            throw error; // Re-throw after max retries
          }

          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }

      console.log('Gemini response received:', {
        id: completion.id,
        model: completion.model,
        usage: completion.usage,
        timestamp: new Date().toISOString()
      });

      const responseContent = completion.choices[0]?.message?.content;
      if (!responseContent) {
        console.warn('No content in response:', completion.choices[0]);
        return "I'm sorry, I couldn't process your request.";
      }

      return responseContent;
    } catch (error) {
      console.error('Error sending message to Gemini:', error);

      // More detailed error logging
      if (error instanceof Error) {
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      }

      // Check if it's an OpenAI API error with status code
      if (error && typeof error === 'object' && 'status' in error) {
        const apiError = error as any;
        console.error('API Error details:', {
          status: apiError.status,
          message: apiError.message,
          type: apiError.type,
          code: apiError.code
        });

        // Handle specific HTTP status codes - but still return fallback instead of throwing
        if (apiError.status === 401) {
          console.error('Authentication failed - API key may be invalid');
        } else if (apiError.status === 429) {
          console.error('Rate limit exceeded');
        } else if (apiError.status === 400) {
          console.error('Bad request - message format may be invalid');
        }
      }

      // Provide helpful fallback responses based on the user's message
      const fallbackResponses = {
        greeting: "Hello! I'm Vikram, your FlowDo assistant. I'm currently experiencing some technical difficulties, but I'm here to help with productivity tips and task management when I'm back online.",
        productivity: "Here are some quick productivity tips: 1) Use the Pomodoro Technique (25 min work, 5 min break), 2) Prioritize tasks using the Eisenhower Matrix, 3) Break large tasks into smaller ones. I'll be back online soon for more personalized help!",
        tasks: "For task management, try organizing your tasks by urgency and importance. Use FlowDo's matrix view to categorize them. I'm having connectivity issues but will be back to help you optimize your workflow soon!",
        focus: "To improve focus: eliminate distractions, use time-blocking, and try the 2-minute rule (if it takes less than 2 minutes, do it now). I'm temporarily offline but will return to provide more personalized focus strategies!",
        default: "I'm experiencing some technical difficulties connecting to my AI services. Please try again in a few moments. In the meantime, feel free to explore FlowDo's features like the task matrix, focus timer, and habit tracker!"
      };

      const lowerMessage = message.toLowerCase();
      let fallbackResponse = fallbackResponses.default;

      if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
        fallbackResponse = fallbackResponses.greeting;
      } else if (lowerMessage.includes('productiv') || lowerMessage.includes('efficient')) {
        fallbackResponse = fallbackResponses.productivity;
      } else if (lowerMessage.includes('task') || lowerMessage.includes('todo') || lowerMessage.includes('organize')) {
        fallbackResponse = fallbackResponses.tasks;
      } else if (lowerMessage.includes('focus') || lowerMessage.includes('concentration') || lowerMessage.includes('distract')) {
        fallbackResponse = fallbackResponses.focus;
      }

      return fallbackResponse;
    }
  }
}

// Create and export the Gemini client instance (keeping a4fClient name for compatibility)
export const a4fClient = new GeminiClient(GEMINI_API_KEY, GEMINI_BASE_URL);

// Export types for use in components
export type { ChatMessage, ChatCompletionRequest, ChatCompletionResponse, FileAttachment };

// Test function for debugging (keeping A4F name for compatibility)
export async function testA4FConnection(): Promise<string> {
  try {
    console.log('Testing Gemini connection...');
    console.log('API Configuration:', {
      baseURL: GEMINI_BASE_URL,
      apiKeyLength: GEMINI_API_KEY.length,
      apiKeyPrefix: GEMINI_API_KEY.substring(0, 15) + '...'
    });

    // First test basic connectivity and get available models
    console.log('Testing basic connectivity to Gemini API...');
    const testResponse = await fetch(`${GEMINI_BASE_URL}/models?key=${GEMINI_API_KEY}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Models endpoint response:', {
      status: testResponse.status,
      statusText: testResponse.statusText,
      headers: Object.fromEntries(testResponse.headers.entries())
    });

    if (testResponse.ok) {
      const modelsData = await testResponse.json();
      console.log('Available models:', modelsData.models?.slice(0, 5)); // Show first 5 models
    } else {
      const errorText = await testResponse.text();
      console.error('Models endpoint error:', errorText);
    }

    // Now test chat completion with Gemini model using direct API
    console.log('Testing chat completion...');
    const client = new GeminiClient(GEMINI_API_KEY, GEMINI_BASE_URL);
    const completion = await client.createChatCompletion({
      model: "gemini-2.0-flash",
      messages: [{ role: "user", content: "Hello, just testing the connection. Please respond with 'Connection successful!'" }],
      max_tokens: 50,
      temperature: 0.7,
    });

    console.log('Chat completion response:', {
      id: completion.id,
      model: completion.model,
      choices: completion.choices.length,
      usage: completion.usage
    });

    const response = completion.choices[0]?.message?.content || "No response";
    console.log('Gemini test successful:', response);
    return `✅ Connection Test Successful!\n\nAPI Response: "${response}"\n\nModel: ${completion.model}\nUsage: ${JSON.stringify(completion.usage, null, 2)}`;
  } catch (error) {
    console.error('Gemini test failed:', error);

    // More detailed error logging for debugging
    if (error instanceof Error) {
      console.error('Test error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }

    throw error;
  }
}

// Alternative test using direct fetch (no OpenAI SDK) - keeping A4F name for compatibility
export async function testA4FDirectFetch(): Promise<string> {
  try {
    console.log('Testing Gemini with direct fetch...');

    // Use direct Gemini API format
    const geminiRequest = {
      contents: [
        {
          role: "user",
          parts: [{ text: "Hello, just testing the connection. Please respond with 'Direct fetch successful!'" }]
        }
      ],
      generationConfig: {
        maxOutputTokens: 50,
        temperature: 0.7
      }
    };

    const model = "gemini-2.0-flash";
    console.log('Direct fetch request:', {
      url: `${GEMINI_BASE_URL}/models/${model}:generateContent`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      bodyPreview: {
        model: model,
        contentsCount: geminiRequest.contents.length,
        maxTokens: geminiRequest.generationConfig.maxOutputTokens
      }
    });

    let response: Response;
    try {
      response = await fetch(`${GEMINI_BASE_URL}/models/${model}:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(geminiRequest)
      });
    } catch (networkError) {
      console.error('Network error during fetch:', networkError);
      throw new Error(`Network error: ${networkError instanceof Error ? networkError.message : 'Unknown network error'}\n\nThis could be due to:\n- No internet connection\n- CORS restrictions\n- Firewall blocking the request\n- API server unavailable`);
    }

    console.log('Direct fetch response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Direct fetch error:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: errorText
      });

      // Provide more specific error messages
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      if (response.status === 401) {
        errorMessage = 'Authentication failed - Invalid API key';
      } else if (response.status === 400) {
        errorMessage = 'Bad Request - Invalid request format or model';
      } else if (response.status === 429) {
        errorMessage = 'Rate limit exceeded';
      } else if (response.status === 403) {
        errorMessage = 'Forbidden - Access denied';
      }

      throw new Error(`${errorMessage}\n\nDetails: ${errorText}`);
    }

    const data = await response.json();
    console.log('Direct fetch success:', data);

    const responseContent = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
    return `✅ Direct Fetch Test Successful!\n\nAPI Response: "${responseContent}"\n\nModel: ${model}\nUsage: ${JSON.stringify(data.usageMetadata, null, 2)}`;
  } catch (error) {
    console.error('Direct fetch test failed:', error);

    // If the first model fails, try a different Gemini model
    if (error instanceof Error && error.message.includes('400')) {
      console.log('Trying alternative Gemini model...');
      try {
        const altModel = "gemini-1.5-flash";
        const altRequest = {
          contents: [
            {
              role: "user",
              parts: [{ text: "Hello, testing with alternative model. Please respond with 'Alternative model successful!'" }]
            }
          ],
          generationConfig: {
            maxOutputTokens: 50,
            temperature: 0.7
          }
        };

        const altResponse = await fetch(`${GEMINI_BASE_URL}/models/${altModel}:generateContent?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(altRequest)
        });

        if (altResponse.ok) {
          const altData = await altResponse.json();
          const altContent = altData.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
          return `✅ Alternative Model Test Successful!\n\nAPI Response: "${altContent}"\n\nModel: ${altModel}\nUsage: ${JSON.stringify(altData.usageMetadata, null, 2)}`;
        }
      } catch (altError) {
        console.error('Alternative model also failed:', altError);
      }
    }

    throw error;
  }
}
