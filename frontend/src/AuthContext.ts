import { createContext } from 'react';
import { UserAuthDto } from "@/types.ts";

export interface Auth {
  ready: boolean;
  accessToken: string | null;
  user: UserAuthDto | null;
  impersonating: string | null;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<string | null>;
  reloadUser: () => Promise<void>;
  impersonateBot: (token: string, botName: string) => Promise<void>;
}

export const AuthContext = createContext<Auth | null>(null);
