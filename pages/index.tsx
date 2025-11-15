import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'

interface Message {
  text: string
  isUser: boolean
  timestamp: Date
}

interface PhoneApp {
  name: string
  icon: string
  color: string
}

export default function Home() {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [currentAction, setCurrentAction] = useState('')
  const [apps, setApps] = useState<PhoneApp[]>([
    { name: 'Phone', icon: '📞', color: '#34C759' },
    { name: 'Messages', icon: '💬', color: '#007AFF' },
    { name: 'Camera', icon: '📷', color: '#5856D6' },
    { name: 'Photos', icon: '🖼️', color: '#FF9500' },
    { name: 'Music', icon: '🎵', color: '#FF2D55' },
    { name: 'Settings', icon: '⚙️', color: '#8E8E93' },
    { name: 'Maps', icon: '🗺️', color: '#30D158' },
    { name: 'Calendar', icon: '📅', color: '#FF3B30' },
  ])
  const [activeApp, setActiveApp] = useState<string | null>(null)
  const [brightness, setBrightness] = useState(80)
  const [volume, setVolume] = useState(50)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true

      recognitionRef.current.onresult = (event: any) => {
        const current = event.resultIndex
        const transcript = event.results[current][0].transcript
        setTranscript(transcript)

        if (event.results[current].isFinal) {
          processCommand(transcript.toLowerCase())
        }
      }

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
      }

      recognitionRef.current.onend = () => {
        if (isListening) {
          recognitionRef.current.start()
        }
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [isListening])

  const toggleListening = () => {
    if (!recognitionRef.current) {
      addMessage('Speech recognition not supported in this browser', false)
      return
    }

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      recognitionRef.current.start()
      setIsListening(true)
      addMessage('Listening...', false)
    }
  }

  const addMessage = (text: string, isUser: boolean) => {
    setMessages(prev => [...prev, { text, isUser, timestamp: new Date() }])
  }

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 1.1
      utterance.pitch = 1
      window.speechSynthesis.speak(utterance)
    }
  }

  const processCommand = (command: string) => {
    addMessage(command, true)

    let response = ''
    let action = ''

    if (command.includes('open') || command.includes('launch')) {
      const appNames = ['phone', 'messages', 'camera', 'photos', 'music', 'settings', 'maps', 'calendar']
      const foundApp = appNames.find(app => command.includes(app))

      if (foundApp) {
        const app = apps.find(a => a.name.toLowerCase() === foundApp)
        if (app) {
          setActiveApp(app.name)
          response = `Opening ${app.name}`
          action = `Launched ${app.name} app`
          setTimeout(() => setActiveApp(null), 3000)
        }
      } else {
        response = "Which app would you like me to open?"
      }
    } else if (command.includes('call')) {
      const nameMatch = command.match(/call\s+(\w+)/i)
      const name = nameMatch ? nameMatch[1] : 'contact'
      response = `Calling ${name}...`
      action = `Initiating call to ${name}`
      setActiveApp('Phone')
      setTimeout(() => setActiveApp(null), 3000)
    } else if (command.includes('send message') || command.includes('text')) {
      const nameMatch = command.match(/(?:to|message)\s+(\w+)/i)
      const name = nameMatch ? nameMatch[1] : 'contact'
      response = `Opening messages to ${name}`
      action = `Composing message to ${name}`
      setActiveApp('Messages')
      setTimeout(() => setActiveApp(null), 3000)
    } else if (command.includes('take picture') || command.includes('take photo')) {
      response = 'Opening camera'
      action = 'Camera ready'
      setActiveApp('Camera')
      setTimeout(() => setActiveApp(null), 3000)
    } else if (command.includes('play music') || command.includes('play song')) {
      const songMatch = command.match(/play\s+(.+)/i)
      const song = songMatch ? songMatch[1] : 'music'
      response = `Playing ${song}`
      action = `Music player active`
      setActiveApp('Music')
      setTimeout(() => setActiveApp(null), 3000)
    } else if (command.includes('increase brightness') || command.includes('brightness up')) {
      const newBrightness = Math.min(100, brightness + 20)
      setBrightness(newBrightness)
      response = `Brightness increased to ${newBrightness}%`
      action = 'Brightness adjusted'
    } else if (command.includes('decrease brightness') || command.includes('brightness down')) {
      const newBrightness = Math.max(0, brightness - 20)
      setBrightness(newBrightness)
      response = `Brightness decreased to ${newBrightness}%`
      action = 'Brightness adjusted'
    } else if (command.includes('volume up') || command.includes('increase volume')) {
      const newVolume = Math.min(100, volume + 20)
      setVolume(newVolume)
      response = `Volume increased to ${newVolume}%`
      action = 'Volume adjusted'
    } else if (command.includes('volume down') || command.includes('decrease volume')) {
      const newVolume = Math.max(0, volume - 20)
      setVolume(newVolume)
      response = `Volume decreased to ${newVolume}%`
      action = 'Volume adjusted'
    } else if (command.includes('what time') || command.includes('time is it')) {
      const time = new Date().toLocaleTimeString()
      response = `It's ${time}`
      action = 'Time query'
    } else if (command.includes('battery') || command.includes('charge')) {
      response = 'Battery is at 85% and charging'
      action = 'Battery status check'
    } else if (command.includes('wifi') || command.includes('wi-fi')) {
      response = 'WiFi is connected'
      action = 'WiFi status check'
    } else if (command.includes('hello') || command.includes('hi jarvis')) {
      response = 'Hello! How can I assist you today?'
      action = 'Greeting'
    } else {
      response = 'I can help you open apps, make calls, send messages, adjust settings, and more. What would you like me to do?'
      action = 'Awaiting command'
    }

    setCurrentAction(action)
    addMessage(response, false)
    speak(response)
  }

  return (
    <>
      <Head>
        <title>JARVIS - AI Voice Assistant</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>J.A.R.V.I.S.</h1>
          <p style={styles.subtitle}>Your Personal AI Assistant</p>
        </div>

        <div style={styles.mainContent}>
          <div style={styles.visualizer}>
            <div style={{
              ...styles.orb,
              ...(isListening ? styles.orbActive : {}),
            }}>
              {isListening && (
                <>
                  <div style={styles.ripple}></div>
                  <div style={{ ...styles.ripple, animationDelay: '0.5s' }}></div>
                  <div style={{ ...styles.ripple, animationDelay: '1s' }}></div>
                </>
              )}
              <span style={styles.orbIcon}>🎙️</span>
            </div>
          </div>

          <button
            onClick={toggleListening}
            style={{
              ...styles.button,
              ...(isListening ? styles.buttonActive : {}),
            }}
          >
            {isListening ? 'Stop Listening' : 'Start Listening'}
          </button>

          {transcript && (
            <div style={styles.transcript}>
              <p style={styles.transcriptLabel}>Hearing:</p>
              <p style={styles.transcriptText}>{transcript}</p>
            </div>
          )}

          {currentAction && (
            <div style={styles.action}>
              <span style={styles.actionIcon}>⚡</span>
              {currentAction}
            </div>
          )}
        </div>

        <div style={styles.phonePreview}>
          <div style={styles.phoneScreen}>
            <div style={styles.statusBar}>
              <span>9:41</span>
              <span>🔋 85%</span>
            </div>

            {activeApp ? (
              <div style={styles.activeAppView}>
                <div style={styles.activeAppIcon}>
                  {apps.find(a => a.name === activeApp)?.icon}
                </div>
                <h2 style={styles.activeAppName}>{activeApp}</h2>
                <p style={styles.activeAppStatus}>App is running...</p>
              </div>
            ) : (
              <div style={styles.appGrid}>
                {apps.map((app, index) => (
                  <div
                    key={index}
                    style={{
                      ...styles.appIcon,
                      backgroundColor: app.color,
                    }}
                  >
                    <span style={styles.appIconEmoji}>{app.icon}</span>
                    <p style={styles.appName}>{app.name}</p>
                  </div>
                ))}
              </div>
            )}

            <div style={styles.controlPanel}>
              <div style={styles.controlItem}>
                <span>🔆</span>
                <div style={styles.slider}>
                  <div style={{ ...styles.sliderFill, width: `${brightness}%` }}></div>
                </div>
                <span>{brightness}%</span>
              </div>
              <div style={styles.controlItem}>
                <span>🔊</span>
                <div style={styles.slider}>
                  <div style={{ ...styles.sliderFill, width: `${volume}%` }}></div>
                </div>
                <span>{volume}%</span>
              </div>
            </div>
          </div>
        </div>

        <div style={styles.messagesContainer}>
          <h3 style={styles.messagesTitle}>Conversation</h3>
          <div style={styles.messages}>
            {messages.map((msg, index) => (
              <div
                key={index}
                style={{
                  ...styles.message,
                  ...(msg.isUser ? styles.userMessage : styles.assistantMessage),
                }}
              >
                <span style={styles.messageIcon}>{msg.isUser ? '👤' : '🤖'}</span>
                <p style={styles.messageText}>{msg.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.commands}>
          <h3 style={styles.commandsTitle}>Try saying:</h3>
          <div style={styles.commandList}>
            <span style={styles.commandChip}>"Open camera"</span>
            <span style={styles.commandChip}>"Call John"</span>
            <span style={styles.commandChip}>"Send message to Sarah"</span>
            <span style={styles.commandChip}>"Play music"</span>
            <span style={styles.commandChip}>"Increase brightness"</span>
            <span style={styles.commandChip}>"What time is it?"</span>
          </div>
        </div>
      </div>
    </>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
    overflowY: 'auto',
    maxHeight: '100vh',
  },
  header: {
    textAlign: 'center',
    marginBottom: '20px',
  },
  title: {
    fontSize: '48px',
    fontWeight: 'bold',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '10px',
    letterSpacing: '4px',
  },
  subtitle: {
    fontSize: '16px',
    color: '#a0a0a0',
    letterSpacing: '2px',
  },
  mainContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
    width: '100%',
    maxWidth: '500px',
  },
  visualizer: {
    position: 'relative',
    width: '200px',
    height: '200px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orb: {
    width: '150px',
    height: '150px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    position: 'relative',
    zIndex: 2,
  },
  orbActive: {
    animation: 'pulse 2s ease-in-out infinite',
    boxShadow: '0 0 50px rgba(102, 126, 234, 0.8)',
  },
  ripple: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    border: '3px solid #667eea',
    animation: 'ripple 2s ease-out infinite',
    zIndex: 1,
  },
  orbIcon: {
    fontSize: '60px',
  },
  button: {
    padding: '15px 40px',
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#ffffff',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    borderRadius: '30px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
  },
  buttonActive: {
    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    boxShadow: '0 4px 20px rgba(240, 147, 251, 0.6)',
  },
  transcript: {
    padding: '15px',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '15px',
    width: '100%',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  transcriptLabel: {
    fontSize: '12px',
    color: '#a0a0a0',
    marginBottom: '5px',
  },
  transcriptText: {
    fontSize: '16px',
    color: '#ffffff',
  },
  action: {
    padding: '10px 20px',
    background: 'rgba(102, 126, 234, 0.2)',
    borderRadius: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    animation: 'slideUp 0.3s ease',
    border: '1px solid rgba(102, 126, 234, 0.3)',
  },
  actionIcon: {
    fontSize: '20px',
  },
  phonePreview: {
    width: '100%',
    maxWidth: '350px',
    marginTop: '20px',
  },
  phoneScreen: {
    background: 'linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%)',
    borderRadius: '30px',
    padding: '20px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
    border: '2px solid rgba(255, 255, 255, 0.1)',
  },
  statusBar: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    marginBottom: '20px',
    color: '#a0a0a0',
  },
  activeAppView: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '300px',
    animation: 'slideUp 0.3s ease',
  },
  activeAppIcon: {
    fontSize: '80px',
    marginBottom: '20px',
  },
  activeAppName: {
    fontSize: '28px',
    marginBottom: '10px',
  },
  activeAppStatus: {
    color: '#a0a0a0',
  },
  appGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '15px',
    marginBottom: '20px',
  },
  appIcon: {
    aspectRatio: '1',
    borderRadius: '15px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'transform 0.2s ease',
    padding: '10px',
  },
  appIconEmoji: {
    fontSize: '30px',
    marginBottom: '5px',
  },
  appName: {
    fontSize: '10px',
    textAlign: 'center',
    color: '#ffffff',
  },
  controlPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginTop: '20px',
  },
  controlItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '14px',
  },
  slider: {
    flex: 1,
    height: '6px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
    transition: 'width 0.3s ease',
  },
  messagesContainer: {
    width: '100%',
    maxWidth: '500px',
    marginTop: '20px',
  },
  messagesTitle: {
    fontSize: '18px',
    marginBottom: '10px',
    color: '#a0a0a0',
  },
  messages: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    maxHeight: '200px',
    overflowY: 'auto',
    padding: '10px',
    background: 'rgba(255, 255, 255, 0.02)',
    borderRadius: '15px',
  },
  message: {
    display: 'flex',
    gap: '10px',
    padding: '10px',
    borderRadius: '10px',
    animation: 'slideUp 0.3s ease',
  },
  userMessage: {
    background: 'rgba(102, 126, 234, 0.2)',
    alignSelf: 'flex-end',
  },
  assistantMessage: {
    background: 'rgba(118, 75, 162, 0.2)',
    alignSelf: 'flex-start',
  },
  messageIcon: {
    fontSize: '20px',
  },
  messageText: {
    flex: 1,
    fontSize: '14px',
  },
  commands: {
    width: '100%',
    maxWidth: '500px',
    marginTop: '20px',
    marginBottom: '20px',
  },
  commandsTitle: {
    fontSize: '18px',
    marginBottom: '10px',
    color: '#a0a0a0',
  },
  commandList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
  },
  commandChip: {
    padding: '8px 15px',
    background: 'rgba(102, 126, 234, 0.2)',
    borderRadius: '20px',
    fontSize: '12px',
    border: '1px solid rgba(102, 126, 234, 0.3)',
  },
}
