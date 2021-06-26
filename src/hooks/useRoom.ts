import { useEffect, useState } from "react";

import { database } from "../services/firebase";

import { useAuth } from "./useAuth";

type QuestionType = {
  id: string;
  author: {
    name: string;
    avatar: string;
  };
  content: string;
  isAnswered: boolean;
  isHighlighted: boolean;
  likeCount: number;
  likeId: string | undefined;
};

type FirebaseQuestions = Record<
  string,
  {
    author: {
      name: string;
      avatar: string;
    };
    content: string;
    isAnswered: boolean;
    isHighlighted: boolean;
    likes: Record<string, { authorId: string }>;
  }
>;

export function useRoom(roomId: string) {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<QuestionType[]>([]);
  const [title, setTitle] = useState("");

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
            isHighlighted: value.isHighlighted,
            isAnswered: value.isAnswered,
            likeCount: Object.values(value.likes ?? {}).length,
            likeId: Object.entries(value.likes ?? {}).find(
              ([key, like]) => like.authorId === user?.id
            )?.[0],
          };
        }
      );

      // atualiza os estados
      setTitle(databaseRoom.title);
      setQuestions(parsedQuestions);
    });
    return () => roomRef.off("value"); // descadastra do listener
  }, [roomId, user?.id]);

  return { questions, title };
}
