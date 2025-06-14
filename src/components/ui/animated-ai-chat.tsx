"use client";

import { useEffect, useRef, useCallback } from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { a4fClient, type ChatMessage, type FileAttachment, testA4FConnection, testA4FDirectFetch } from "@/lib/a4f-api";
import {
    ImageIcon,
    MonitorIcon,
    Paperclip,
    SendIcon,
    XIcon,
    LoaderIcon,
    Sparkles,
    Search,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import * as React from "react"
import { useIsMobile } from "@/hooks/use-mobile"

// Simple text formatter for AI responses
function formatAIResponse(text: string) {
    return text
        // Convert **text** to bold
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Convert *text* to italic (but not if it's part of **)
        .replace(/(?<!\*)\*([^*]+?)\*(?!\*)/g, '<em>$1</em>')
        // Convert only actual line breaks to HTML breaks
        .replace(/\n/g, '<br>')
        // Handle bullet points with proper spacing
        .replace(/\* \*\*(.*?)\*\*/g, '<br>• <strong>$1</strong>')
        // Handle numbered lists
        .replace(/^(\d+\.\s)/gm, '<br><strong>$1</strong>')
        // Clean up any leading breaks
        .replace(/^<br>/, '')
        // Clean up multiple consecutive breaks (max 2)
        .replace(/(<br>){3,}/g, '<br><br>');
}

interface UseAutoResizeTextareaProps {
    minHeight: number;
    maxHeight?: number;
}

function useAutoResizeTextarea({
    minHeight,
    maxHeight,
}: UseAutoResizeTextareaProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const adjustHeight = useCallback(
        (reset?: boolean) => {
            const textarea = textareaRef.current;
            if (!textarea) return;

            if (reset) {
                textarea.style.height = `${minHeight}px`;
                return;
            }

            textarea.style.height = `${minHeight}px`;
            const newHeight = Math.max(
                minHeight,
                Math.min(
                    textarea.scrollHeight,
                    maxHeight ?? Number.POSITIVE_INFINITY
                )
            );

            textarea.style.height = `${newHeight}px`;
        },
        [minHeight, maxHeight]
    );

    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = `${minHeight}px`;
        }
    }, [minHeight]);

    useEffect(() => {
        const handleResize = () => adjustHeight();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [adjustHeight]);

    return { textareaRef, adjustHeight };
}

interface CommandSuggestion {
    icon: React.ReactNode;
    label: string;
    description: string;
    prefix: string;
}

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  containerClassName?: string;
  showRing?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, containerClassName, showRing = true, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);
    
    return (
      <div className={cn(
        "relative",
        containerClassName
      )}>
        <textarea
          className={cn(
            "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
            "transition-all duration-200 ease-in-out",
            "placeholder:text-muted-foreground",
            "disabled:cursor-not-allowed disabled:opacity-50",
            showRing ? "focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0" : "",
            className
          )}
          ref={ref}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        
        {showRing && isFocused && (
          <motion.span 
            className="absolute inset-0 rounded-md pointer-events-none ring-2 ring-offset-0 ring-violet-500/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}

        {props.onChange && (
          <div 
            className="absolute bottom-2 right-2 opacity-0 w-2 h-2 bg-violet-500 rounded-full"
            style={{
              animation: 'none',
            }}
            id="textarea-ripple"
          />
        )}
      </div>
    )
  }
)
Textarea.displayName = "Textarea"

export function AnimatedAIChat() {
    const [value, setValue] = useState("");
    const [attachments, setAttachments] = useState<FileAttachment[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [webSearchEnabled, setWebSearchEnabled] = useState(false);
    const [activeSuggestion, setActiveSuggestion] = useState<number>(-1);
    const [showCommandPalette, setShowCommandPalette] = useState(false);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [conversation, setConversation] = useState<ChatMessage[]>([]);
    const isMobile = useIsMobile();

    // Debug: Log when component mounts
    useEffect(() => {
        console.log('AnimatedAIChat component mounted');
        console.log('A4F API configuration check:', {
            hasClient: !!a4fClient,
            testFunction: !!testA4FConnection
        });
    }, []);

    const { textareaRef, adjustHeight } = useAutoResizeTextarea({
        minHeight: 40,
        maxHeight: 100,
    });
    const [inputFocused, setInputFocused] = useState(false);
    const commandPaletteRef = useRef<HTMLDivElement>(null);
    const conversationRef = useRef<HTMLDivElement>(null);

    const commandSuggestions: CommandSuggestion[] = [
        { 
            icon: <ImageIcon className="w-4 h-4" />, 
            label: "Clone UI", 
            description: "Generate a UI from a screenshot", 
            prefix: "/clone" 
        },
        {
            icon: <Search className="w-4 h-4" />,
            label: "Web Search",
            description: "Search the web for information",
            prefix: "/search"
        },
        { 
            icon: <MonitorIcon className="w-4 h-4" />, 
            label: "Create Page", 
            description: "Generate a new web page", 
            prefix: "/page" 
        },
        { 
            icon: <Sparkles className="w-4 h-4" />, 
            label: "Improve", 
            description: "Improve existing UI design", 
            prefix: "/improve" 
        },
    ];

    useEffect(() => {
        if (value.startsWith('/') && !value.includes(' ')) {
            setShowCommandPalette(true);
            
            const matchingSuggestionIndex = commandSuggestions.findIndex(
                (cmd) => cmd.prefix.startsWith(value)
            );
            
            if (matchingSuggestionIndex >= 0) {
                setActiveSuggestion(matchingSuggestionIndex);
            } else {
                setActiveSuggestion(-1);
            }
        } else {
            setShowCommandPalette(false);
        }
    }, [value]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            const commandButton = document.querySelector('[data-command-button]');

            if (commandPaletteRef.current &&
                !commandPaletteRef.current.contains(target) &&
                !commandButton?.contains(target)) {
                setShowCommandPalette(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Scroll to bottom when conversation updates
    useEffect(() => {
        if (conversationRef.current) {
            conversationRef.current.scrollTop = conversationRef.current.scrollHeight;
        }
    }, [conversation]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (showCommandPalette) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveSuggestion(prev => 
                    prev < commandSuggestions.length - 1 ? prev + 1 : 0
                );
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveSuggestion(prev => 
                    prev > 0 ? prev - 1 : commandSuggestions.length - 1
                );
            } else if (e.key === 'Tab' || e.key === 'Enter') {
                e.preventDefault();
                if (activeSuggestion >= 0) {
                    const selectedCommand = commandSuggestions[activeSuggestion];
                    setValue(selectedCommand.prefix + ' ');
                    setShowCommandPalette(false);
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                setShowCommandPalette(false);
            }
        } else if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (value.trim()) {
                handleSendMessage();
            }
        }
    };

    const handleSendMessage = async () => {
        if (value.trim()) {
            const userMessage = value.trim();
            setValue("");
            adjustHeight(true);

            // Add user message to conversation
            const newUserMessage: ChatMessage = { role: "user", content: userMessage };
            setConversation(prev => [...prev, newUserMessage]);

            setIsTyping(true);

            try {
                console.log('Sending message to A4F API:', {
                    userMessage: userMessage.substring(0, 50) + '...',
                    conversationLength: conversation.length,
                    webSearchEnabled,
                    attachmentCount: attachments.length,
                    attachmentDetails: attachments.map(a => ({
                        name: a.name,
                        type: a.type,
                        hasUrl: !!a.url,
                        hasContent: !!a.content,
                        processed: a.processed,
                        error: a.error
                    }))
                });

                // Call A4F API with attachments and web search
                const response = await a4fClient.sendMessage(userMessage, conversation, {
                    webSearchEnabled,
                    attachments: attachments.filter(att => !att.error)
                });

                console.log('Received response from A4F API:', response.substring(0, 100) + '...');

                // Add assistant response to conversation
                const assistantMessage: ChatMessage = { role: "assistant", content: response };
                setConversation(prev => [...prev, assistantMessage]);

                // Clear attachments after sending
                setAttachments([]);

            } catch (error) {
                console.error('Error sending message in chat component:', error);

                // The A4F client already provides fallback responses, so we should get a response
                // But if there's still an error, provide a generic fallback
                const errorMessage: ChatMessage = {
                    role: "assistant",
                    content: "I'm experiencing some technical difficulties. Please try again in a moment, or feel free to explore FlowDo's other features while I get back online!"
                };
                setConversation(prev => [...prev, errorMessage]);
            } finally {
                setIsTyping(false);
            }
        }
    };

    const handleFilesSelected = (files: FileAttachment[]) => {
        setAttachments(prev => [...prev, ...files]);
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    // Test function for debugging API connection
    const testAPIConnection = async () => {
        console.log('Testing A4F API connection...');
        setIsTyping(true);

        try {
            // First try the OpenAI SDK method
            console.log('Trying OpenAI SDK method...');
            let testResult: string;
            try {
                testResult = await testA4FConnection();
                console.log('OpenAI SDK test successful:', testResult);
            } catch (sdkError) {
                console.log('OpenAI SDK test failed, trying direct fetch...', sdkError);
                testResult = await testA4FDirectFetch();
                console.log('Direct fetch test successful:', testResult);
            }

            const testMessage: ChatMessage = {
                role: "assistant",
                content: testResult
            };
            setConversation(prev => [...prev, testMessage]);
        } catch (error) {
            console.error('All API tests failed:', error);

            const errorMessage: ChatMessage = {
                role: "assistant",
                content: `❌ API Connection Test Failed\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease check the console for more details. This could be due to:\n\n1. Invalid API key\n2. Network connectivity issues\n3. CORS restrictions\n4. API service unavailable\n\nTry refreshing the page or check your internet connection.`
            };
            setConversation(prev => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
        }
    };
    
    const selectCommandSuggestion = (index: number) => {
        const selectedCommand = commandSuggestions[index];
        setValue(selectedCommand.prefix + ' ');
        setShowCommandPalette(false);
    };

    return (
        <div className="min-h-screen flex flex-col w-full bg-transparent text-white relative overflow-hidden">
            {/* Enhanced Background Effects */}
            <div className="absolute inset-0 w-full h-full overflow-hidden">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/15 rounded-full mix-blend-normal filter blur-[128px] animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/15 rounded-full mix-blend-normal filter blur-[128px] animate-pulse delay-700" />
                <div className="absolute top-1/4 right-1/3 w-64 h-64 bg-fuchsia-500/15 rounded-full mix-blend-normal filter blur-[96px] animate-pulse delay-1000" />
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-purple-500/5 via-violet-500/5 to-indigo-500/5 rounded-full filter blur-[200px]" />
            </div>

            {/* Header Section - Only show when no conversation */}
            {conversation.length === 0 && (
                <div className="relative z-10 pt-8 pb-6">
                    <div className="w-full max-w-4xl mx-auto px-6">
                        <motion.div
                            className="text-center space-y-4"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                        >
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2, duration: 0.5 }}
                                className="inline-block"
                            >
                                <h1 className="text-4xl md:text-5xl font-light tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-white/90 to-white/60 pb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                                    How can I help today?
                                </h1>
                                <motion.div
                                    className="h-px bg-gradient-to-r from-transparent via-violet-400/40 to-transparent"
                                    initial={{ width: 0, opacity: 0 }}
                                    animate={{ width: "100%", opacity: 1 }}
                                    transition={{ delay: 0.5, duration: 0.8 }}
                                />
                            </motion.div>
                            <motion.p
                                className="text-base text-white/50 max-w-md mx-auto leading-relaxed"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                style={{ fontFamily: 'Montserrat, sans-serif' }}
                            >
                                Ask Vikram anything about productivity, tasks, or get help with FlowDo
                            </motion.p>
                        </motion.div>
                    </div>
                </div>
            )}

            {/* Scrollable Conversation Area */}
            <div className="flex-1 relative z-10 overflow-hidden">
                {conversation.length > 0 && (
                    <div
                        ref={conversationRef}
                        className="h-full overflow-y-auto scrollbar-hide px-6 py-4 pb-32"
                        style={{
                            scrollbarWidth: 'none',
                            msOverflowStyle: 'none'
                        }}
                    >
                        <div className="w-full max-w-3xl mx-auto">
                            <motion.div
                                className="space-y-6"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                {/* Flash instruction for older messages */}
                                {conversation.length > 6 && (
                                    <motion.div
                                        className="text-center text-white/60 text-sm mb-6 py-2 px-4 rounded-full bg-white/[0.03] border border-white/[0.05]"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: [0, 1, 0] }}
                                        transition={{ duration: 2, repeat: 2 }}
                                        style={{ fontFamily: 'Montserrat, sans-serif' }}
                                    >
                                        Showing recent messages • {conversation.length - 6} older messages hidden
                                    </motion.div>
                                )}
                                {/* Show only last 6 messages */}
                                {conversation.slice(-6).map((message, index) => (
                                    <motion.div
                                        key={index}
                                        className={cn(
                                            "flex gap-4 items-start",
                                            message.role === "user" ? "justify-end" : "justify-start"
                                        )}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        {message.role === "assistant" && (
                                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-500 flex items-center justify-center text-white text-sm font-semibold shadow-lg">
                                                V
                                            </div>
                                        )}
                                        <div
                                            className={cn(
                                                "max-w-[75%] px-5 py-4 rounded-2xl text-sm leading-relaxed shadow-lg",
                                                message.role === "user"
                                                    ? "bg-gradient-to-r from-white to-gray-50 text-gray-800 ml-auto rounded-br-md"
                                                    : "bg-gradient-to-r from-white/[0.08] to-white/[0.04] text-white/95 border border-white/[0.08] rounded-bl-md"
                                            )}
                                            style={{ fontFamily: 'Montserrat, sans-serif' }}
                                        >
                                            {typeof message.content === 'string' ? (
                                                message.role === 'assistant' ? (
                                                    <div
                                                        dangerouslySetInnerHTML={{
                                                            __html: formatAIResponse(message.content)
                                                        }}
                                                        className="leading-relaxed formatted-ai-text"
                                                    />
                                                ) : (
                                                    message.content
                                                )
                                            ) : (
                                                <div className="space-y-2">
                                                    {message.content.map((item, idx) => (
                                                        <div key={idx}>
                                                            {item.type === 'text' && (
                                                                message.role === 'assistant' ? (
                                                                    <div
                                                                        dangerouslySetInnerHTML={{
                                                                            __html: formatAIResponse(item.text)
                                                                        }}
                                                                        className="leading-relaxed formatted-ai-text"
                                                                    />
                                                                ) : (
                                                                    item.text
                                                                )
                                                            )}
                                                            {item.type === 'image_url' && item.image_url && (
                                                                <img
                                                                    src={item.image_url.url}
                                                                    alt="Uploaded image"
                                                                    className="max-w-full h-auto rounded-lg"
                                                                />
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        {message.role === "user" && (
                                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-white/20 to-white/10 border border-white/[0.15] flex items-center justify-center text-white/80 text-xs font-medium shadow-lg">
                                                You
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </motion.div>
                        </div>
                    </div>
                )}
            </div>

            {/* Fixed Input Area */}
            <div className="fixed bottom-0 left-0 right-0 z-10 p-6 flex justify-center md:left-[--sidebar-width]">
                <div className="w-full max-w-3xl mx-auto">
                    <motion.div
                        className="relative backdrop-blur-2xl bg-white/[0.03] rounded-3xl border border-white/[0.08] shadow-2xl"
                        initial={{ scale: 0.98, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.1, duration: 0.5 }}
                    >
                        <AnimatePresence>
                            {showCommandPalette && (
                                <motion.div
                                    ref={commandPaletteRef}
                                    className="absolute left-6 right-6 bottom-full mb-3 backdrop-blur-xl bg-black/95 rounded-2xl z-50 shadow-2xl border border-white/[0.15] overflow-hidden"
                                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <div className="py-2">
                                        {commandSuggestions.map((suggestion, index) => (
                                            <motion.div
                                                key={suggestion.prefix}
                                                className={cn(
                                                    "flex items-center gap-3 px-4 py-3 text-sm transition-all cursor-pointer",
                                                    activeSuggestion === index
                                                        ? "bg-violet-500/20 text-white border-l-2 border-violet-400"
                                                        : "text-white/80 hover:bg-white/[0.08] hover:text-white"
                                                )}
                                                onClick={() => selectCommandSuggestion(index)}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                style={{ fontFamily: 'Montserrat, sans-serif' }}
                                            >
                                                <div className="w-6 h-6 flex items-center justify-center text-white/70">
                                                    {suggestion.icon}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="font-medium">{suggestion.label}</div>
                                                    <div className="text-white/50 text-xs">
                                                        {suggestion.prefix}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="px-4 py-3">
                            <div className="flex items-center gap-3">
                                {/* Hide file attachment and web search buttons on mobile */}
                                {!isMobile && (
                                    <div className="flex items-center gap-2">
                                        <div className="relative">
                                            <input
                                                type="file"
                                                multiple
                                                accept="image/*,application/pdf,text/*"
                                                onChange={(e) => {
                                                    if (e.target.files) {
                                                        const files = Array.from(e.target.files);
                                                        Promise.all(files.map(async (file) => {
                                                            try {
                                                                const { processFile } = await import('@/lib/file-utils');
                                                                return await processFile(file);
                                                            } catch (error) {
                                                                console.error('Error processing file:', error);
                                                                return null;
                                                            }
                                                        })).then(processedFiles => {
                                                            const validFiles = processedFiles.filter(f => f !== null) as FileAttachment[];
                                                            handleFilesSelected(validFiles);
                                                        });
                                                    }
                                                }}
                                                className="hidden"
                                                id="file-upload"
                                            />
                                            <motion.button
                                                type="button"
                                                onClick={() => document.getElementById('file-upload')?.click()}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                className="p-2 text-white/50 hover:text-white/90 rounded-lg transition-all relative group bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.05]"
                                                title="Attach file"
                                            >
                                                <Paperclip className="w-4 h-4" />
                                            </motion.button>
                                        </div>
                                        <motion.button
                                            type="button"
                                            onClick={() => setWebSearchEnabled(!webSearchEnabled)}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            className={cn(
                                                "p-2 rounded-lg transition-all relative group border border-white/[0.05]",
                                                webSearchEnabled
                                                    ? "bg-violet-500/20 text-violet-300 border-violet-400/30"
                                                    : "bg-white/[0.03] hover:bg-white/[0.08] text-white/50 hover:text-white/90"
                                            )}
                                            title={`Web search ${webSearchEnabled ? 'enabled' : 'disabled'}`}
                                        >
                                            <Search className="w-4 h-4" />
                                            {webSearchEnabled && (
                                                <motion.div
                                                    className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full"
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    exit={{ scale: 0 }}
                                                />
                                            )}
                                        </motion.button>
                                    </div>
                                )}
                                <Textarea
                                    ref={textareaRef}
                                    value={value}
                                    onChange={(e) => {
                                        setValue(e.target.value);
                                        adjustHeight();
                                    }}
                                    onKeyDown={handleKeyDown}
                                    onFocus={() => setInputFocused(true)}
                                    onBlur={() => setInputFocused(false)}
                                    placeholder="Ask Vikram anything about productivity, tasks, or FlowDo..."
                                    containerClassName="flex-1"
                                    className={cn(
                                        "w-full px-0 py-0",
                                        "resize-none",
                                        "bg-transparent",
                                        "border-none",
                                        "text-white/95 text-sm leading-relaxed",
                                        "focus:outline-none",
                                        "placeholder:text-white/30",
                                        "min-h-[50px]"
                                    )}
                                    style={{
                                        overflow: "hidden",
                                        fontFamily: 'Montserrat, sans-serif'
                                    }}
                                    showRing={false}
                                />
                                <motion.button
                                    type="button"
                                    onClick={handleSendMessage}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    disabled={isTyping || !value.trim()}
                                    className={cn(
                                        "rounded-lg text-sm font-medium transition-all",
                                        "flex items-center shadow-lg",
                                        // Mobile: icon-only button with padding
                                        isMobile ? "p-3" : "px-4 py-2 gap-2",
                                        value.trim()
                                            ? "bg-gradient-to-r from-white to-gray-100 text-gray-800 shadow-white/20 hover:from-gray-50 hover:to-white border border-white/20"
                                            : "bg-white/[0.05] text-white/40 border border-white/[0.05] cursor-not-allowed"
                                    )}
                                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                                >
                                    {isTyping ? (
                                        <LoaderIcon className="w-4 h-4 animate-[spin_2s_linear_infinite]" />
                                    ) : (
                                        <SendIcon className="w-4 h-4" />
                                    )}
                                    {/* Hide "Send" text on mobile */}
                                    {!isMobile && <span>Send</span>}
                                </motion.button>
                            </div>
                        </div>

                        <AnimatePresence>
                            {attachments.length > 0 && (
                                <motion.div
                                    className="px-4 pb-3 flex gap-2 flex-wrap"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                >
                                    {attachments.map((file, index) => (
                                        <motion.div
                                            key={index}
                                            className="flex items-center gap-2 text-xs bg-white/[0.03] py-1.5 px-3 rounded-lg text-white/70"
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                        >
                                            <span>{file.name}</span>
                                            {file.error && (
                                                <span className="text-red-400 text-xs ml-1">⚠</span>
                                            )}
                                            <button
                                                onClick={() => removeAttachment(index)}
                                                className="text-white/40 hover:text-white transition-colors"
                                            >
                                                <XIcon className="w-3 h-3" />
                                            </button>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            </div>



            {/* Typing Indicator - Left corner above chat bar */}
            <AnimatePresence>
                {isTyping && (
                    <motion.div
                        className="fixed bottom-24 left-0 right-0 z-10 px-6 pb-2 md:left-[--sidebar-width]"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="w-full max-w-3xl mx-auto">
                            <div className="flex items-center gap-3 text-sm text-white/70">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-500 flex items-center justify-center shadow-lg">
                                    <span className="text-xs font-semibold text-white">V</span>
                                </div>
                                <div className="flex items-center gap-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                                    <span className="font-medium">Vikram is thinking</span>
                                    <TypingDots />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {inputFocused && (
                <motion.div
                    className="fixed w-[50rem] h-[50rem] rounded-full pointer-events-none z-0 opacity-[0.02] bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-500 blur-[96px]"
                    animate={{
                        x: mousePosition.x - 400,
                        y: mousePosition.y - 400,
                    }}
                    transition={{
                        type: "spring",
                        damping: 25,
                        stiffness: 150,
                        mass: 0.5,
                    }}
                />
            )}
        </div>
    );
}

function TypingDots() {
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3].map((dot) => (
                <motion.div
                    key={dot}
                    className="w-1.5 h-1.5 bg-gradient-to-r from-violet-400 to-purple-400 rounded-full"
                    initial={{ opacity: 0.4, scale: 0.8 }}
                    animate={{
                        opacity: [0.4, 1, 0.4],
                        scale: [0.8, 1.1, 0.8],
                        y: [0, -2, 0]
                    }}
                    transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        delay: dot * 0.15,
                        ease: "easeInOut",
                    }}
                    style={{
                        boxShadow: "0 0 4px rgba(139, 92, 246, 0.3)"
                    }}
                />
            ))}
        </div>
    );
}



const rippleKeyframes = `
@keyframes ripple {
  0% { transform: scale(0.5); opacity: 0.6; }
  100% { transform: scale(2); opacity: 0; }
}
`;

const scrollbarHideStyles = `
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
`;

const formattedTextStyles = `
.formatted-ai-text {
  line-height: 1.6;
}
.formatted-ai-text strong {
  font-weight: 600;
  color: rgba(255, 255, 255, 0.98);
  font-family: 'Montserrat', sans-serif;
}
.formatted-ai-text em {
  font-style: italic;
  color: rgba(255, 255, 255, 0.9);
}
.formatted-ai-text br {
  line-height: 1.4;
}
`;

if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.innerHTML = rippleKeyframes + scrollbarHideStyles + formattedTextStyles;
    document.head.appendChild(style);
}
