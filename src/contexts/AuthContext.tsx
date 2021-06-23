import { createContext, ReactNode, useEffect, useState } from "react";
import { auth, firebase } from "../services/firebase";

type User = {
  id: string;
  name: string;
  avatar: string;
};

type AuthContextType = {
  user: User | undefined;
  signInWithGoogle: () => Promise<void>;
};

type AuthContextProviderChildren = {
  children: ReactNode;
};

// criar o contexto para passar os valores do usuário e a função de login com Google
export const AuthContext = createContext({} as AuthContextType);

// componente usado no App como o context provider
export function AuthContextProvider(props: AuthContextProviderChildren) {
  const [user, setUser] = useState<User>();

  /* side effect que busca no Firebase se o usuário está logado
  quando o componente AuthContextProvider é exibido */
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        const { displayName, photoURL, uid } = user;

        if (!displayName || !photoURL) {
          throw new Error("Missing info from Google");
        }

        setUser({
          id: uid,
          name: displayName,
          avatar: photoURL,
        });
      }
    });

    // descadastrar do monitoramento, boa prática
    return () => {
      unsubscribe();
    };
  }, []);

  // função que abre o popup do Google e faz o login
  async function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();

    const result = await auth.signInWithPopup(provider);
    if (result.user) {
      const { displayName, photoURL, uid } = result.user;

      if (!displayName || !photoURL) {
        throw new Error("Missing info from Google");
      }

      setUser({
        id: uid,
        name: displayName,
        avatar: photoURL,
      });
    }
  }

  // retorna o provider com os children
  return (
    <AuthContext.Provider value={{ user, signInWithGoogle }}>
      {props.children}
    </AuthContext.Provider>
  );
}
