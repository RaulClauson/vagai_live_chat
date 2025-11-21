# VagAI - Web Interview Agent 🎙️🤖

> Interface Web para simulação de entrevistas de emprego por voz, integrada ao App VagAI.

[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0-purple.svg)](https://vitejs.dev/)
[![ElevenLabs](https://img.shields.io/badge/ElevenLabs-Conversational_AI-orange.svg)](https://elevenlabs.io/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-yellow.svg)](https://firebase.google.com/)

Este projeto é um componente web desenvolvido com **React e Vite**, projetado para ser executado dentro de uma `WebView` no aplicativo mobile VagAI. Ele é responsável por gerenciar a conexão WebSocket de áudio em tempo real com a **ElevenLabs**, superando limitações de processamento de áudio nativo em ambientes móveis híbridos.

---

## ⚙️ Como Funciona

1.  **Chamada do Mobile:** O aplicativo mobile (React Native) abre este site em uma WebView invisível (ou estilizada), passando o `userId` e dados básicos da vaga via parâmetros de URL (Query Params).
2.  **Recuperação de Contexto:** O site lê o `userId` da URL e consulta o **Firebase Firestore** para obter o perfil completo do candidato (Habilidades/Skills e Localização).
3.  **Sessão de IA:** O site inicia uma sessão com o **ElevenLabs Conversational AI**, injetando dinamicamente o contexto da vaga e o perfil do candidato no prompt do sistema.
4.  **Entrevista:** O usuário conversa por voz com o agente. O site gerencia o microfone, a reprodução de áudio e exibe a transcrição em tempo real.

---

## 🛠️ Tecnologias

- **[Vite](https://vitejs.dev/):** Build tool rápida para React.
- **[@elevenlabs/react](https://www.npmjs.com/package/@elevenlabs/react):** SDK oficial para gerenciar a conexão WebSocket e streaming de áudio.
- **[Firebase SDK](https://firebase.google.com/docs/web/setup):** Para conexão com o Firestore Database.

---

## 🚀 Como Rodar Localmente

### 1. Pré-requisitos

- Node.js (v18+)
- Conta na ElevenLabs (Agent ID criado)
- Projeto no Firebase configurado

### 2. Instalação

Clone o repositório e instale as dependências:

```bash
git clone https://github.com/SEU_USUARIO/vagai-web-agent.git
cd vagai-web-agent
npm install
```

### 3. Configuração de Variáveis (.env)

Crie um arquivo `.env` na raiz do projeto com as credenciais do Firebase.
**Nota:** No Vite, variáveis de ambiente expostas ao cliente devem começar com `VITE_`.

```env
VITE_API_KEY=sua_firebase_api_key
VITE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
VITE_PROJECT_ID=seu_project_id
VITE_STORAGE_BUCKET=seu_bucket.appspot.com
VITE_MESSAGING_SENDER_ID=seu_sender_id
VITE_APP_ID=seu_app_id
```

### 4. Execução

```bash
npm run dev
```

O projeto rodará em `http://localhost:5173`.

---

## 🧪 Como Testar (Simulando o App)

Como este projeto depende de parâmetros na URL para funcionar corretamente, você deve acessá-lo passando os dados simulados, assim como o aplicativo faria.

**Exemplo de URL para teste:**

```
http://localhost:5173/?userId=ID_DO_USUARIO_NO_FIREBASE&title=Desenvolvedor%20React&company=Tech%20Corp&description=Vaga%20para%20pleno&name=SeuNome
```

_Substitua `ID_DO_USUARIO_NO_FIREBASE` por um ID real que exista na sua coleção `users` do Firestore._

---

## ☁️ Deploy na Vercel

Este projeto está otimizado para deploy na Vercel.

1.  Faça o push do código para o GitHub.
2.  Importe o projeto na Vercel.
3.  **Importante:** Vá em **Settings > Environment Variables** no painel da Vercel e adicione todas as variáveis definidas no seu arquivo `.env` local.
4.  Faça o Deploy.

---

## 👥 Autores

| RM           | Nome                     | Função              |
| ------------ | ------------------------ | ------------------- |
| **RM556152** | Daniel da Silva Barros   | Java & Database     |
| **RM558253** | Luccas de Alencar Rufino | .NET & IA           |
| **RM555006** | Raul Clauson             | Mobile & Compliance |

---

Parte da solução **VagAI** para o Global Solution FIAP 2025.
