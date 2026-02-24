'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import {
  MessageCircle,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  Loader2,
  ChevronDown,
  Minimize2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showWelcome, setShowWelcome] = useState(true)
  const [pulseButton, setPulseButton] = useState(true)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const pathname = usePathname()

  // Charger les suggestions contextuelles
  useEffect(() => {
    const page = pathname === '/' ? 'dashboard' : pathname.split('/')[1] || 'default'
    fetch(`/api/chatbot/suggestions?page=${page}`)
      .then(r => r.json())
      .then(data => setSuggestions(data.suggestions || []))
      .catch(() => setSuggestions([
        'Comment fonctionne Granto ?',
        'Quelles subventions pour ma commune ?',
        'Comment monter un dossier ?',
        'Aidez-moi à trouver une aide'
      ]))
  }, [pathname])

  // Scroll auto vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Focus input quand ouvert
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen, isMinimized])

  // Arrêter le pulse après 10s
  useEffect(() => {
    const timer = setTimeout(() => setPulseButton(false), 10000)
    return () => clearTimeout(timer)
  }, [])

  const sendMessage = useCallback(async (text?: string) => {
    const messageText = text || input.trim()
    if (!messageText || isLoading) return

    setInput('')
    setShowWelcome(false)

    const userMessage: Message = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      const res = await fetch('/api/chatbot/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          conversationId,
        }),
      })

      const data = await res.json()

      if (data.conversationId) {
        setConversationId(data.conversationId)
      }

      const assistantMessage: Message = {
        id: `msg_${Date.now()}_assistant`,
        role: 'assistant',
        content: data.response || 'Désolé, je n\'ai pas pu traiter votre message.',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch {
      const errorMessage: Message = {
        id: `msg_${Date.now()}_error`,
        role: 'assistant',
        content: 'Désolé, je rencontre un problème de connexion. Veuillez réessayer.',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading, conversationId])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const toggleChat = () => {
    if (isOpen && isMinimized) {
      setIsMinimized(false)
    } else {
      setIsOpen(!isOpen)
      setIsMinimized(false)
    }
    setPulseButton(false)
  }

  // Formatter le texte avec du markdown basique
  const formatMessage = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-primary font-semibold">$1</strong>')
      .replace(/\n/g, '<br/>')
  }

  return (
    <>
      {/* Chatbot Panel */}
      <div
        className={cn(
          'fixed bottom-24 right-6 z-50 flex flex-col transition-all duration-500 ease-out',
          'w-[400px] rounded-2xl overflow-hidden',
          'border border-border/50',
          'shadow-elevated',
          isOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95 pointer-events-none',
          isMinimized ? 'h-[60px]' : 'h-[560px]'
        )}
        style={{
          background: 'oklch(0.11 0.015 260 / 0.97)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3.5 cursor-pointer select-none shrink-0"
          onClick={() => isMinimized && setIsMinimized(false)}
          style={{
            background: 'linear-gradient(135deg, oklch(0.60 0.20 265 / 0.15) 0%, oklch(0.55 0.20 245 / 0.10) 100%)',
            borderBottom: '1px solid oklch(0.25 0.02 260 / 0.5)',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center w-9 h-9 rounded-xl"
              style={{
                background: 'linear-gradient(135deg, oklch(0.60 0.20 265) 0%, oklch(0.50 0.24 280) 100%)',
                boxShadow: '0 0 15px oklch(0.55 0.22 265 / 0.3)',
              }}
            >
              <Sparkles className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Assistant Granto</h3>
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-xs text-muted-foreground">En ligne</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized) }}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              title={isMinimized ? 'Agrandir' : 'Réduire'}
            >
              {isMinimized ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <Minimize2 className="h-4 w-4 text-muted-foreground" />}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setIsOpen(false) }}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              title="Fermer"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Messages */}
        {!isMinimized && (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin">
              {/* Welcome */}
              {showWelcome && messages.length === 0 && (
                <div className="flex flex-col items-center text-center py-6 animate-fade-in">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                    style={{
                      background: 'linear-gradient(135deg, oklch(0.60 0.20 265 / 0.2) 0%, oklch(0.55 0.20 245 / 0.15) 100%)',
                      border: '1px solid oklch(0.60 0.20 265 / 0.2)',
                    }}
                  >
                    <Bot className="h-8 w-8 text-primary" />
                  </div>
                  <h4 className="text-base font-semibold text-foreground mb-1">
                    Bienvenue sur Granto
                  </h4>
                  <p className="text-sm text-muted-foreground mb-5 max-w-[280px]">
                    Je suis votre assistant IA. Posez-moi vos questions sur les subventions et la plateforme.
                  </p>

                  {/* Suggestions */}
                  <div className="flex flex-wrap gap-2 justify-center">
                    {suggestions.map((suggestion, i) => (
                      <button
                        key={i}
                        onClick={() => sendMessage(suggestion)}
                        className="text-xs px-3 py-2 rounded-xl border transition-all duration-200 hover:scale-[1.03] active:scale-[0.98]"
                        style={{
                          borderColor: 'oklch(0.60 0.20 265 / 0.25)',
                          background: 'oklch(0.60 0.20 265 / 0.06)',
                          color: 'oklch(0.80 0.10 265)',
                        }}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Message list */}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    'flex gap-2.5 animate-slide-up',
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {msg.role === 'assistant' && (
                    <div
                      className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center mt-0.5"
                      style={{
                        background: 'linear-gradient(135deg, oklch(0.60 0.20 265) 0%, oklch(0.50 0.24 280) 100%)',
                      }}
                    >
                      <Sparkles className="h-3.5 w-3.5 text-white" />
                    </div>
                  )}

                  <div
                    className={cn(
                      'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                      msg.role === 'user'
                        ? 'rounded-br-md'
                        : 'rounded-bl-md'
                    )}
                    style={
                      msg.role === 'user'
                        ? {
                            background: 'linear-gradient(135deg, oklch(0.60 0.20 265) 0%, oklch(0.50 0.24 280) 100%)',
                            color: 'white',
                          }
                        : {
                            background: 'oklch(0.15 0.015 260)',
                            border: '1px solid oklch(0.22 0.015 260)',
                            color: 'oklch(0.90 0.005 260)',
                          }
                    }
                    dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                  />

                  {msg.role === 'user' && (
                    <div
                      className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center mt-0.5"
                      style={{
                        background: 'oklch(0.20 0.02 265)',
                        border: '1px solid oklch(0.25 0.02 260)',
                      }}
                    >
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))}

              {/* Typing indicator */}
              {isLoading && (
                <div className="flex gap-2.5 animate-slide-up">
                  <div
                    className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center mt-0.5"
                    style={{
                      background: 'linear-gradient(135deg, oklch(0.60 0.20 265) 0%, oklch(0.50 0.24 280) 100%)',
                    }}
                  >
                    <Sparkles className="h-3.5 w-3.5 text-white" />
                  </div>
                  <div
                    className="rounded-2xl rounded-bl-md px-4 py-3"
                    style={{
                      background: 'oklch(0.15 0.015 260)',
                      border: '1px solid oklch(0.22 0.015 260)',
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="typing-dot" style={{ animationDelay: '0ms' }} />
                      <span className="typing-dot" style={{ animationDelay: '150ms' }} />
                      <span className="typing-dot" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}

              {/* Suggestions after first response */}
              {!showWelcome && messages.length > 0 && messages.length <= 2 && !isLoading && (
                <div className="flex flex-wrap gap-1.5 pt-1 animate-fade-in">
                  {suggestions.slice(0, 3).map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(suggestion)}
                      className="text-xs px-2.5 py-1.5 rounded-lg border transition-all duration-200 hover:scale-[1.02]"
                      style={{
                        borderColor: 'oklch(0.60 0.20 265 / 0.2)',
                        background: 'oklch(0.60 0.20 265 / 0.05)',
                        color: 'oklch(0.75 0.08 265)',
                      }}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div
              className="shrink-0 px-4 py-3"
              style={{
                borderTop: '1px solid oklch(0.22 0.015 260)',
                background: 'oklch(0.09 0.015 260 / 0.8)',
              }}
            >
              <div
                className="flex items-end gap-2 rounded-xl px-3 py-2 transition-all duration-200"
                style={{
                  background: 'oklch(0.14 0.015 260)',
                  border: '1px solid oklch(0.25 0.015 260)',
                }}
              >
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Posez votre question..."
                  rows={1}
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none max-h-[80px] py-1"
                  style={{ scrollbarWidth: 'thin' }}
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isLoading}
                  className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200',
                    input.trim() && !isLoading
                      ? 'hover:scale-110 active:scale-95'
                      : 'opacity-30 cursor-not-allowed'
                  )}
                  style={
                    input.trim() && !isLoading
                      ? {
                          background: 'linear-gradient(135deg, oklch(0.60 0.20 265) 0%, oklch(0.50 0.24 280) 100%)',
                          boxShadow: '0 0 12px oklch(0.55 0.22 265 / 0.3)',
                        }
                      : {
                          background: 'oklch(0.20 0.02 265)',
                        }
                  }
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 text-white animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 text-white" />
                  )}
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground/50 text-center mt-1.5">
                Propulsé par IA Generative
              </p>
            </div>
          </>
        )}
      </div>

      {/* Floating Button */}
      <button
        onClick={toggleChat}
        className={cn(
          'fixed bottom-6 right-6 z-50 flex items-center justify-center',
          'w-14 h-14 rounded-2xl transition-all duration-300',
          'hover:scale-110 active:scale-95',
          isOpen ? 'rotate-0' : 'rotate-0'
        )}
        style={{
          background: 'linear-gradient(135deg, oklch(0.60 0.20 265) 0%, oklch(0.50 0.24 280) 100%)',
          boxShadow: pulseButton
            ? '0 0 25px oklch(0.55 0.22 265 / 0.5), 0 0 50px oklch(0.55 0.22 265 / 0.2)'
            : '0 0 20px oklch(0.55 0.22 265 / 0.3), 0 4px 12px oklch(0 0 0 / 0.3)',
        }}
        title="Assistant Granto"
      >
        {pulseButton && (
          <span className="absolute inset-0 rounded-2xl animate-ping-slow opacity-40"
            style={{
              background: 'linear-gradient(135deg, oklch(0.60 0.20 265) 0%, oklch(0.50 0.24 280) 100%)',
            }}
          />
        )}
        {isOpen ? (
          <X className="h-6 w-6 text-white transition-transform duration-300" />
        ) : (
          <MessageCircle className="h-6 w-6 text-white transition-transform duration-300" />
        )}
      </button>

      {/* Styles */}
      <style jsx>{`
        .typing-dot {
          display: inline-block;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: oklch(0.60 0.20 265);
          animation: typing-bounce 1.2s ease-in-out infinite;
        }

        @keyframes typing-bounce {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.4;
          }
          30% {
            transform: translateY(-8px);
            opacity: 1;
          }
        }

        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-slide-up {
          animation: slideUp 0.3s ease-out forwards;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-ping-slow {
          animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }

        @keyframes ping-slow {
          0% {
            transform: scale(1);
            opacity: 0.4;
          }
          75%, 100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }

        .scrollbar-thin {
          scrollbar-width: thin;
          scrollbar-color: oklch(0.25 0.02 260) transparent;
        }

        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }

        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: oklch(0.25 0.02 260);
          border-radius: 4px;
        }
      `}</style>
    </>
  )
}
