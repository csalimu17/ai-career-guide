"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageSquare, Send, Sparkles, User, Loader2 } from "lucide-react"
import { interactiveAiCareerAssistant } from "@/ai/flows/interactive-ai-career-assistant-flow"
import { cn } from "@/lib/utils"

type Message = {
  role: 'assistant' | 'user'
  content: string
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hi! I'm your AI Career Guide. How can I help you today? I can review your CV, suggest career paths, or help with interview preparation." }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)

    try {
      const response = await interactiveAiCareerAssistant({ message: userMessage })
      setMessages(prev => [...prev, { role: 'assistant', content: response.response }])
    } catch (error) {
      console.error(error)
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error. Please try again." }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-10rem)] flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">AI Career Assistant</h1>
          <p className="text-muted-foreground">Your personal mentor for career success.</p>
        </div>
        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 gap-1 py-1">
          <Sparkles className="h-3 w-3" /> Powered by Gemini
        </Badge>
      </div>

      <Card className="flex-1 flex flex-col border-none shadow-lg overflow-hidden bg-white">
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6">
            {messages.map((message, i) => (
              <div key={i} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-3 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <Avatar className={cn(
                    "h-10 w-10 shrink-0 transition-transform duration-500 hover:scale-110 border shadow-sm",
                    message.role === 'assistant' ? 'bg-white' : 'bg-secondary'
                  )}>
                    {message.role === 'assistant' ? (
                      <AvatarImage src="/avatars/assistant-avatar.png" className="object-cover" />
                    ) : (
                      <User className="h-4 w-4 text-white" />
                    )}
                    <AvatarFallback className="bg-primary text-white">
                      {message.role === 'assistant' ? <Sparkles className="h-4 w-4" /> : <User className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    message.role === 'user' 
                    ? 'bg-secondary text-white rounded-tr-none' 
                    : 'bg-[#F5F5F5] text-primary rounded-tl-none border'
                  }`}>
                    {message.content}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex gap-3">
                  <Avatar className="h-10 w-10 shrink-0 bg-white border shadow-sm">
                    <AvatarImage src="/avatars/assistant-avatar.png" className="object-cover" />
                    <AvatarFallback className="bg-primary text-white">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-[#F5F5F5] p-4 rounded-2xl rounded-tl-none border flex items-center gap-2">
                    <span className="text-xs text-muted-foreground italic">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <div className="p-4 bg-[#F5F5F5] border-t">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex gap-2 max-w-3xl mx-auto"
          >
            <Input 
              placeholder="Ask about your CV, a job description, or career advice..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="bg-white border-none shadow-sm h-12 rounded-xl focus-visible:ring-primary"
            />
            <Button size="icon" className="h-12 w-12 rounded-xl shrink-0 bg-primary hover:bg-primary/90 shadow-md transition-transform active:scale-95">
              <Send className="h-5 w-5" />
            </Button>
          </form>
          <p className="text-[10px] text-center mt-2 text-muted-foreground">
            AI can make mistakes. Consider checking important information.
          </p>
        </div>
      </Card>
    </div>
  )
}

import { Badge } from "@/components/ui/badge"