import { FormEvent, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

import logoImg from "../assets/images/logo.svg";
import { Button } from "../components/Button";
import { RoomCode } from "../components/RoomCode";

import "../styles/room.scss";
import { database } from "../services/firebase";

type RoomParams = {
  id: string;
};

type Question = {
  id: string;
  author: {
    name: string;
    avatar: string;
  };
  content: string;
  isAnswered: string;
  isHighlighted: string;
};

type FirebaseQuestions = Record<
  string,
  {
    author: {
      name: string;
      avatar: string;
    };
    content: string;
    isAnswered: string;
    isHighlighted: string;
  }
>;

export function Room() {
  const { user } = useAuth(); // custom hook para contexto de autentificação
  const params = useParams<RoomParams>(); // hook para ter acesso aos parâmetros da url
  const [newQuestion, setNewQuestion] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [title, setTitle] = useState("");

  const roomId = params.id; // id da sala passada na url

  // efeito colateral para quando o id muda
  useEffect(() => {
    // define qual referência do banco de dados acessar
    const roomRef = database.ref(`rooms/${roomId}`);

    // busca no banco de dados e retorna todo o valor dentro dele
    roomRef.on("value", (room) => {
      const databaseRoom = room.val(); // extrai JSON do DatabaseSnapshot, que é uma cópia do que está no banco de dados
      const firebaseQuestions: FirebaseQuestions = databaseRoom.questions ?? {}; // seleciona somente as perguntas da sala

      // transforma o JSON em array de pares com [key, value] e retorna o objeto formatado
      const parsedQuestions = Object.entries(firebaseQuestions).map(
        ([key, value]) => {
          return {
            id: key,
            content: value.content,
            author: value.author,
            isHighlighted: value.isAnswered,
            isAnswered: value.isAnswered,
          };
        }
      );
      // atualiza os estados
      setTitle(databaseRoom.title);
      setQuestions(parsedQuestions);
    });
  }, [roomId]);

  // envia pergunta ao banco de dados
  async function handleSendQuestion(event: FormEvent) {
    event.preventDefault();

    if (newQuestion.trim() === "") {
      return;
    }

    if (!user) {
      throw new Error("Usuário não está logado");
    }

    // cria o objeto
    const question = {
      content: newQuestion,
      author: {
        name: user.name,
        avatar: user.avatar,
      },
      isHighlighted: false,
      isAnswered: false,
    };

    await database.ref(`rooms/${roomId}/questions`).push(question);

    setNewQuestion("");
  }

  return (
    <div id="page-room">
      <header>
        <div className="content">
          <img src={logoImg} alt="Letmeask" />
          <RoomCode code={roomId} />
        </div>
      </header>
      <main>
        <div className="room-title">
          <h1>Sala {title}</h1>
          { questions.length > 0 && <span>{questions.length} pergunta(s)</span> }
        </div>

        <form onSubmit={handleSendQuestion}>
          <textarea
            placeholder="O que você quer perguntar?"
            onChange={(event) => setNewQuestion(event.target.value)}
            value={newQuestion}
          />

          <div className="form-footer">
            {user ? (
              <div className="user-info">
                <img src={user.avatar} alt={user.name} />
                <span>{user.name}</span>
              </div>
            ) : (
              <span>
                Para enviar uma pergunta, <button>faça seu login</button>
              </span>
            )}

            <Button type="submit" disabled={!user}>
              Enviar pergunta
            </Button>
          </div>
        </form>

        {JSON.stringify(questions)}
      </main>
    </div>
  );
}
