'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
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
  ExternalLink,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  actions?: Action[]
}

interface Action {
  id: string
  type: 'link' | 'action'
  path: string
  label: string
  params?: Record<string, string>
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
  const router = useRouter()
  const { theme } = useTheme()

  // Handler pour les clics sur les actions
  const handleActionClick = useCallback((action: Action) => {
    if (action.type === 'link') {
      router.push(action.path)
    } else if (action.type === 'action' && action.params) {
      // Encoder les paramètres directement dans l'URL comme query params
      const searchParams = new URLSearchParams()
      Object.entries(action.params).forEach(([key, value]) => {
        searchParams.set(key, value)
      })
      const urlWithParams = `${action.path}?${searchParams.toString()}`

      // Aussi stocker dans localStorage comme fallback
      localStorage.setItem('chatbot_prefill', JSON.stringify({
        path: action.path,
        params: action.params,
        timestamp: Date.now()
      }))

      router.push(urlWithParams)
    }
  }, [router])

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

  // Attacher les event listeners aux liens cliquables après chaque rendu
  useEffect(() => {
    const handleActionElementClick = (e: Event) => {
      const target = e.target as HTMLElement
      const actionId = target.getAttribute('data-action-id')

      if (actionId) {
        // Trouver le message qui contient cette action
        const message = messages.find(msg =>
          msg.actions?.some(a => a.id === actionId)
        )

        if (message && message.actions) {
          const action = message.actions.find(a => a.id === actionId)
          if (action) {
            e.preventDefault()
            handleActionClick(action)
          }
        }
      }
    }

    // Attacher les listeners à tous les éléments .chatbot-action
    const actionElements = document.querySelectorAll('.chatbot-action')
    actionElements.forEach(el => {
      el.addEventListener('click', handleActionElementClick)
    })

    // Cleanup
    return () => {
      actionElements.forEach(el => {
        el.removeEventListener('click', handleActionElementClick)
      })
    }
  }, [messages, handleActionClick])

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
        actions: data.actions || [],
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

  // Formatter le texte avec du markdown basique et rendre les actions cliquables
  const formatMessage = (text: string, actions?: Action[]) => {
    let formatted = text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/\n/g, '<br/>')

    // Remplacer les balises <action> par des liens cliquables
    if (actions && actions.length > 0) {
      actions.forEach(action => {
        const actionRegex = new RegExp(`<action data-id="${action.id}">(.*?)<\\/action>`, 'g')
        formatted = formatted.replace(
          actionRegex,
          `<span class="chatbot-action" data-action-id="${action.id}">$1</span>`
        )
      })
    }

    return formatted
  }


  return (
    <>
      {/* Chatbot Panel */}
      <div
        className={cn(
          'fixed bottom-6 right-6 z-50 flex flex-col transition-all duration-500 ease-out',
          'rounded-2xl overflow-hidden border shadow-elevated glass',
          isOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95 pointer-events-none',
          isMinimized ? 'h-[60px] w-[500px]' : 'h-[calc(100vh-3rem)] w-[50vw] max-w-[800px] min-w-[500px]'
        )}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3.5 cursor-pointer select-none shrink-0 bg-gradient-primary/10 border-b"
          onClick={() => isMinimized && setIsMinimized(false)}
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-primary shadow-glow-primary">
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
              className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors"
              title={isMinimized ? 'Agrandir' : 'Réduire'}
            >
              {isMinimized ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <Minimize2 className="h-4 w-4 text-muted-foreground" />}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setIsOpen(false) }}
              className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors"
              title="Fermer"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Messages */}
        {!isMinimized && (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 scrollbar-thin">
              {/* Welcome */}
              {showWelcome && messages.length === 0 && (
                <div className="flex flex-col items-center text-center py-8 animate-fade-in">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-primary/10 border border-primary/20">
                    <Bot className="h-8 w-8 text-primary" />
                  </div>
                  <h4 className="text-base font-semibold text-foreground mb-1">
                    Bienvenue sur Granto
                  </h4>
                  <p className="text-sm text-muted-foreground mb-6 max-w-md">
                    Je suis votre assistant IA. Posez-moi vos questions sur les subventions et la plateforme. Je peux vous guider directement vers les bonnes fonctionnalités.
                  </p>

                  {/* Suggestions */}
                  <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                    {suggestions.map((suggestion, i) => (
                      <button
                        key={i}
                        onClick={() => sendMessage(suggestion)}
                        className="text-xs px-3 py-2 rounded-xl border border-primary/25 bg-primary/5 hover:bg-primary/10 text-primary transition-all duration-200 hover:scale-[1.03] active:scale-[0.98]"
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
                    'flex gap-3 animate-slide-up',
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {msg.role === 'assistant' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5 bg-gradient-primary">
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                  )}

                  <div
                    className={cn(
                      'rounded-2xl px-4 py-3 text-sm leading-relaxed break-words cursor-text',
                      msg.role === 'user'
                        ? 'rounded-br-md bg-gradient-primary text-white max-w-[75%]'
                        : 'rounded-bl-md bg-card border max-w-[85%]'
                    )}
                    dangerouslySetInnerHTML={{ __html: formatMessage(msg.content, msg.actions) }}
                  />

                  {msg.role === 'user' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5 bg-muted border">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))}

              {/* Typing indicator */}
              {isLoading && (
                <div className="flex gap-3 animate-slide-up">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5 bg-gradient-primary">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  <div className="rounded-2xl rounded-bl-md px-4 py-3 bg-card border">
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
                <div className="flex flex-wrap gap-2 pt-1 animate-fade-in">
                  {suggestions.slice(0, 3).map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(suggestion)}
                      className="text-xs px-2.5 py-1.5 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary transition-all duration-200 hover:scale-[1.02]"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="shrink-0 px-6 py-4 border-t bg-card/50">
              <div className="flex items-end gap-2 rounded-xl px-3 py-2 bg-input border transition-all duration-200 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Posez votre question..."
                  rows={1}
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none max-h-[100px] py-1"
                  style={{ scrollbarWidth: 'thin' }}
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isLoading}
                  className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 bg-gradient-primary',
                    input.trim() && !isLoading
                      ? 'hover:scale-110 active:scale-95 shadow-glow-primary'
                      : 'opacity-30 cursor-not-allowed'
                  )}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 text-white animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 text-white" />
                  )}
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground/50 text-center mt-2">
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
          'w-14 h-14 rounded-2xl transition-all duration-300 bg-gradient-primary shadow-glow-primary',
          'hover:scale-110 active:scale-95',
          isOpen && 'opacity-0 pointer-events-none'
        )}
        title="Assistant Granto"
      >
        {pulseButton && (
          <span className="absolute inset-0 rounded-2xl animate-ping-slow opacity-40 bg-gradient-primary" />
        )}
        <MessageCircle className="h-6 w-6 text-white transition-transform duration-300" />
      </button>

      {/* Styles */}
      <style jsx global>{`
        .chatbot-action {
          color: #2563eb;
          font-weight: 700;
          cursor: pointer;
          text-decoration: underline;
          text-decoration-color: #2563eb;
          text-underline-offset: 2px;
          transition: all 0.2s ease;
          padding: 0 2px;
          border-radius: 2px;
        }

        .chatbot-action:hover {
          color: #1d4ed8;
          text-decoration-color: #1d4ed8;
          background: rgba(37, 99, 235, 0.1);
        }

        .dark .chatbot-action {
          color: #60a5fa;
          text-decoration-color: #60a5fa;
        }

        .dark .chatbot-action:hover {
          color: #93c5fd;
          text-decoration-color: #93c5fd;
          background: rgba(96, 165, 250, 0.1);
        }

        .typing-dot {
          display: inline-block;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: hsl(var(--primary));
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
          scrollbar-color: hsl(var(--muted)) transparent;
        }

        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }

        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: hsl(var(--muted));
          border-radius: 4px;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--muted-foreground));
        }
      `}</style>
    </>
  )
}
