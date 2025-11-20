import { useConversation, type SessionConfig } from "@elevenlabs/react";
import { useEffect, useState, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

// 1. Configuração do Firebase
const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

type Message = {
  source: "user" | "ai";
  message: string;
};

type UserData = {
  resume?: {
    skills: string[];
    suggestedLocation: string;
  };
};

export default function App() {
  const [status, setStatus] = useState<
    "loading" | "ready" | "connected" | "error"
  >("loading");

  const [userData, setUserData] = useState<UserData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isMuted, setIsMuted] = useState(false);

  // Referência para o stream de áudio (para poder mutar)
  const audioStreamRef = useRef<MediaStream | null>(null);

  const conversation = useConversation({
    onConnect: () => {
      setStatus("connected");
    },
    onDisconnect: () => {
      setStatus("ready");
      setMessages([]); // Limpa mensagens ao desconectar
      setIsMuted(false);
    },
    onMessage: (message: Message) => {
      // Adiciona a mensagem ao histórico visual
      setMessages((prev) => [...prev, message]);
    },
    onError: (error) => {
      console.error("ElevenLabs Error:", error);
      setStatus("error");
    },
  });

  const params = new URLSearchParams(window.location.search);
  const userId = params.get("userId");
  const userName = params.get("name") || "Candidato";
  const jobTitle = params.get("title") || "Vaga";
  const company = params.get("company") || "Empresa";
  const jobDescription = params.get("description") || "";

  // 2. Buscar dados no Firebase
  useEffect(() => {
    async function fetchData() {
      if (!userId) {
        setStatus("error");
        return;
      }
      try {
        const docRef = doc(db, "users", userId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setUserData(docSnap.data());
          setStatus("ready");
        } else {
          console.error("Usuário não encontrado");
          setStatus("error");
        }
      } catch (err) {
        console.error("Erro ao buscar no Firebase:", err);
        setStatus("error");
      }
    }
    fetchData();
  }, [userId]);

  const startInterview = async () => {
    try {
      setStatus("loading");
      // Captura o stream de áudio
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;

      const resumeContext = `Skills: ${userData?.resume?.skills?.join(
        ", "
      )}. Localização: ${userData?.resume?.suggestedLocation}`;

      await conversation.startSession({
        agentId: "agent_7401kacjnt4eeyz9m8jgn65xn4ev",
        connectionType: "websocket",
        dynamicVariables: {
          job_title: jobTitle,
          company_name: company,
          job_description: jobDescription,
          candidate_resume: resumeContext,
          candidate_name: userName,
        },
      } as SessionConfig);
      // O status mudará para 'connected' via callback onConnect
    } catch (error) {
      console.error(error);
      setStatus("error");
    }
  };

  const endInterview = async () => {
    await conversation.endSession();
    // Para o uso do microfone
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }
  };

  const toggleMute = () => {
    if (audioStreamRef.current) {
      const audioTrack = audioStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled; // Inverte o estado (enabled = false é mudo)
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  if (status === "loading")
    return <div style={styles.container}>Carregando dados...</div>;
  if (status === "error")
    return (
      <div style={styles.container}>Erro ao carregar perfil ou conectar.</div>
    );

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>{jobTitle}</h2>

      {/* Área de Chat / Transcrição */}
      <div style={styles.chatBox}>
        {messages.length === 0 && (
          <p style={{ color: "#888", textAlign: "center", marginTop: 20 }}>
            A entrevista começará em breve...
          </p>
        )}
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              ...styles.messageBubble,
              alignSelf: msg.source === "user" ? "flex-end" : "flex-start",
              background: msg.source === "user" ? "rgb(71, 2, 225)" : "#333",
            }}
          >
            <strong>{msg.source === "user" ? "Você" : "Recrutador"}:</strong>{" "}
            {msg.message}
          </div>
        ))}
      </div>

      {/* Controles */}
      <div style={styles.controls}>
        {status === "connected" ? (
          <>
            <button
              onClick={toggleMute}
              style={{
                ...styles.btnMute,
                background: isMuted ? "#F59E0B" : "#555",
              }}
            >
              {isMuted ? "🔇 Desmutar" : "🎤 Mutar"}
            </button>

            <button onClick={endInterview} style={styles.btnStop}>
              Encerrar
            </button>
          </>
        ) : (
          <button onClick={startInterview} style={styles.btnStart}>
            Começar Entrevista
          </button>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    width: "100vw",
    height: "100vh",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "rgb(13, 11, 13)",
    color: "rgb(255, 229, 255)",
    fontFamily: "sans-serif",
    padding: "20px",
    boxSizing: "border-box",
  },
  title: {
    marginBottom: "20px",
    textAlign: "center",
  },
  chatBox: {
    flex: 1,
    width: "100%",
    maxWidth: "600px",
    background: "rgba(255,255,255,0.05)",
    borderRadius: "10px",
    padding: "15px",
    overflowY: "auto",
    marginBottom: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  messageBubble: {
    padding: "10px 15px",
    borderRadius: "10px",
    maxWidth: "80%",
    lineHeight: "1.4",
    fontSize: "14px",
  },
  controls: {
    display: "flex",
    gap: "15px",
    justifyContent: "center",
  },
  btnStart: {
    padding: "15px 30px",
    borderRadius: "30px",
    background: "rgb(71, 2, 225)",
    color: "white",
    border: "none",
    fontSize: "18px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  btnStop: {
    padding: "15px 30px",
    borderRadius: "30px",
    background: "rgb(239, 68, 68)",
    color: "white",
    border: "none",
    fontSize: "18px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  btnMute: {
    padding: "15px 30px",
    borderRadius: "30px",
    color: "white",
    border: "none",
    fontSize: "18px",
    cursor: "pointer",
    fontWeight: "bold",
  },
} as const;
