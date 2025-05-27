
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useChat } from '@/contexts/ChatContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; // Using Input, can be Textarea if preferred
import { Send, Zap, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

const MessageInput = () => {
  const { sendMessage, getSmartReplies, activeChatMessages } = useChat();
  const [messageText, setMessageText] = useState('');
  const [smartReplies, setSmartReplies] = useState<string[]>([]);
  const [isLoadingReplies, setIsLoadingReplies] = useState(false);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || messageText;
    if (text.trim()) {
      await sendMessage(text.trim());
      setMessageText('');
      setSmartReplies([]); // Clear replies after sending
    }
  };

  const handleSmartReplyClick = (reply: string) => {
    handleSendMessage(reply);
  };
  
  const fetchSmartReplies = useCallback(async () => {
    if (!messageText.trim() && activeChatMessages.length === 0) {
      setSmartReplies([]);
      return;
    }

    setIsLoadingReplies(true);
    const conversationHistory = activeChatMessages
      .slice(-5) // Take last 5 messages for context
      .map(msg => `${msg.senderId === 'currentUser' ? 'User' : 'Other'}: ${msg.text}`) // Simplified sender for AI
      .join('\n');
    
    try {
      const replies = await getSmartReplies(conversationHistory, messageText.trim());
      setSmartReplies(replies.slice(0, 3)); // Show up to 3 replies
    } catch (error) {
      console.error("Failed to fetch smart replies", error);
      setSmartReplies([]);
    } finally {
      setIsLoadingReplies(false);
    }
  }, [messageText, activeChatMessages, getSmartReplies]);

  // Debounce effect for fetching smart replies
  useEffect(() => {
    if (!messageText.trim() && activeChatMessages.length === 0) {
      setSmartReplies([]); // Clear suggestions if input is empty and no history
      return;
    }
    
    const handler = setTimeout(() => {
      if (messageText.trim() || activeChatMessages.length > 0) { // Fetch if input has text or there's history
         fetchSmartReplies();
      }
    }, 1000); // Fetch after 1 second of inactivity or if history exists

    return () => {
      clearTimeout(handler);
    };
  }, [messageText, fetchSmartReplies, activeChatMessages.length]);


  return (
    <div className="p-4 border-t bg-card">
      {isLoadingReplies && (
        <div className="flex items-center text-sm text-muted-foreground mb-2">
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          <span>Generating smart replies...</span>
        </div>
      )}
      {!isLoadingReplies && smartReplies.length > 0 && (
        <ScrollArea className="mb-2 h-auto max-h-24">
          <div className="flex gap-2 pb-2 flex-wrap">
            {smartReplies.map((reply, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleSmartReplyClick(reply)}
                className="bg-accent/20 hover:bg-accent/40 border-accent/50 text-accent-foreground/80"
              >
                <Zap className="h-3 w-3 mr-1.5" /> {reply}
              </Button>
            ))}
          </div>
        </ScrollArea>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="flex items-center gap-3"
      >
        <Input
          type="text"
          placeholder="Type a message..."
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          className="flex-1 h-11 text-base focus-visible:ring-primary focus-visible:ring-offset-0"
          autoComplete="off"
          aria-label="Message input"
        />
        <Button type="submit" size="icon" className="h-11 w-11 bg-primary hover:bg-primary/90" disabled={!messageText.trim()}>
          <Send className="h-5 w-5" />
          <span className="sr-only">Send Message</span>
        </Button>
      </form>
    </div>
  );
};

export default MessageInput;
