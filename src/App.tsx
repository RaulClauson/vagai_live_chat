// --- App.tsx (Site na Vercel) ---
import { useConversation, type SessionConfig } from "@elevenlabs/react";
import { useEffect, useState } from "react";
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

  const conversation = useConversation({
    onConnect: () => {
      setStatus("connected");
    },
    onDisconnect: () => {
      setStatus("ready");
    },
    onMessage: (message: Message) => {
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
      setMessages([]); // Limpa o chat anterior

      // Solicita permissão antes apenas para garantir que o navegador não bloqueie
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const skillsArray = userData?.resume?.skills || [];
      const skillsText =
        skillsArray.length > 0 ? skillsArray.join(", ") : "Geral";
      const locationText = userData?.resume?.suggestedLocation || "Brasil";
      const resumeContext = `Skills: ${skillsText}. Localização: ${locationText}`;

      // Inicia a sessão padrão (a lib gerencia o microfone)
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
    } catch (error) {
      console.error("Erro ao iniciar:", error);
      setStatus("error");
    }
  };

  const endInterview = async () => {
    await conversation.endSession();
  };

  // Renderizações
  if (status === "loading")
    return <div style={styles.container}>Carregando dados...</div>;
  if (status === "error")
    return (
      <div style={styles.container}>Erro ao carregar. Tente recarregar.</div>
    );

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>{jobTitle}</h2>

      {/* Área de Chat / Transcrição */}
      <div style={styles.chatBox}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", marginTop: 40, color: "#888" }}>
            <div style={{ fontSize: "40px", marginBottom: 10 }}>🎙️</div>
            <p>Toque em começar e aguarde o recrutador falar.</p>
          </div>
        )}
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              ...styles.messageBubble,
              alignSelf: msg.source === "user" ? "flex-end" : "flex-start",
              background: msg.source === "user" ? "rgb(71, 2, 225)" : "#333",
              color: "white",
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
          <button onClick={endInterview} style={styles.btnStop}>
            Encerrar Entrevista
          </button>
        ) : (
          <button onClick={startInterview} style={styles.btnStart}>
            {messages.length > 0 ? "Nova Entrevista" : "Começar Entrevista"}
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
    background: "rgb(13, 11, 13)",
    color: "rgb(255, 229, 255)",
    fontFamily: "sans-serif",
    padding: "20px",
    boxSizing: "border-box",
  },
  title: {
    marginBottom: "15px",
    textAlign: "center",
    fontSize: "1.1rem",
    fontWeight: "600",
  },
  chatBox: {
    flex: 1,
    width: "100%",
    maxWidth: "600px",
    background: "rgba(255,255,255,0.05)",
    borderRadius: "16px",
    padding: "15px",
    overflowY: "auto",
    marginBottom: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    border: "1px solid rgba(255,255,255,0.1)",
  },
  messageBubble: {
    padding: "12px 16px",
    borderRadius: "12px",
    maxWidth: "85%",
    lineHeight: "1.5",
    fontSize: "15px",
    wordWrap: "break-word" as const,
    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
  },
  controls: {
    display: "flex",
    justifyContent: "center",
    width: "100%",
    paddingBottom: "10px",
  },
  btnStart: {
    padding: "16px 32px",
    borderRadius: "50px",
    background:
      "linear-gradient(135deg, rgb(71, 2, 225) 0%, rgb(120, 50, 255) 100%)",
    color: "white",
    border: "none",
    fontSize: "16px",
    cursor: "pointer",
    fontWeight: "bold",
    width: "100%",
    maxWidth: "300px",
    boxShadow: "0 4px 15px rgba(71, 2, 225, 0.4)",
    transition: "transform 0.1s",
  },
  btnStop: {
    padding: "16px 32px",
    borderRadius: "50px",
    background: "#EF4444",
    color: "white",
    border: "none",
    fontSize: "16px",
    cursor: "pointer",
    fontWeight: "bold",
    width: "100%",
    maxWidth: "300px",
    boxShadow: "0 4px 15px rgba(239, 68, 68, 0.4)",
  },
} as const;
