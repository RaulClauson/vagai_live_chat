// --- App.tsx (Site na Vercel) ---
import { useConversation, type SessionConfig } from "@elevenlabs/react";
import { useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

// 1. Configuração do Firebase (Copie do seu console)
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

export default function App() {
  const [status, setStatus] = useState<
    "loading" | "ready" | "connected" | "error"
  >("loading");
  interface UserData {
    resume?: {
      skills: string[];
      suggestedLocation: string;
    };
  }

  const [userData, setUserData] = useState<UserData | null>(null);
  const conversation = useConversation();

  // Parâmetros da URL (Vindos do Mobile)
  const params = new URLSearchParams(window.location.search);
  const userId = params.get("userId");

  // Dados da vaga (podemos passar texto na URL pois é menos sensível/menor, ou buscar no banco pelo jobID)
  const userName = params.get("name") || "Candidato";
  const jobTitle = params.get("title") || "Vaga";
  const company = params.get("company") || "Empresa";
  const jobDescription = params.get("description") || ""; // Descrição truncada vinda da URL

  // 2. Buscar dados no Firebase ao carregar
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
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // 3. Preparar o texto do currículo para a IA
      // Se você tiver o texto completo extraído, use-o. Se não, monte com o que tem.
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
      setStatus("connected");
    } catch (error) {
      console.error(error);
      setStatus("error");
    }
  };

  if (status === "loading")
    return <div style={styles.container}>Carregando dados...</div>;
  if (status === "error")
    return <div style={styles.container}>Erro ao carregar perfil.</div>;

  return (
    <div style={styles.container}>
      <h2>Entrevista: {jobTitle}</h2>
      {status === "connected" ? (
        <button onClick={conversation.endSession} style={styles.btnStop}>
          Encerrar
        </button>
      ) : (
        <button onClick={startInterview} style={styles.btnStart}>
          Começar
        </button>
      )}
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
  },
  btnStart: {
    padding: "15px 30px",
    borderRadius: "30px",
    background: "rgb(71, 2, 225)",
    color: "rgb(255, 229, 255)",
    border: "none",
    fontSize: "18px",
    cursor: "pointer",
  },
  btnStop: {
    padding: "15px 30px",
    borderRadius: "30px",
    background: "rgb(239, 68, 68)",
    color: "rgb(255, 229, 255)",
    border: "none",
    fontSize: "18px",
    cursor: "pointer",
  },
} as const;
