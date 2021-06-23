import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";

// custom hook para facilitar a importação e useContext()
export function useAuth() {
  return useContext(AuthContext);
}
