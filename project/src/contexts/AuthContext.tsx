import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'

export type UserProfile = {
  id: string
  email: string
  name: string
  role: 'admin' | 'attendant'
  created_at?: string
}

type AuthContextType = {
  user: User | null
  profile: UserProfile | null
  login: (email: string, password: string) => Promise<{ error: Error | null }>
  logout: () => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
  const storedUser = localStorage.getItem("user");
  const storedProfile = localStorage.getItem("profile");

  if (storedUser) setUser(JSON.parse(storedUser));
  if (storedProfile) setProfile(JSON.parse(storedProfile));

  // Também sincroniza com o Supabase pra garantir sessão válida
  supabase.auth.getSession().then(({ data: { session } }) => {
    setUser(session?.user ?? null);
    if (session?.user) fetchUserProfile(session.user.id);
    setLoading(false);
  });

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    setUser(session?.user ?? null);
    if (session?.user) {
      fetchUserProfile(session.user.id);
    } else {
      setProfile(null);
      localStorage.removeItem("user");
      localStorage.removeItem("profile");
    }
    setLoading(false);
  });

  return () => subscription.unsubscribe();
}, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) throw error
      setProfile(data ?? null)
    } catch (error) {
      console.error('Error fetching user profile:', error)
      setProfile(null)
    }
  }

  // Login
 const login = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) return { error };

    if (data?.user) {
      const { data: profileData, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("id", data.user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      const profile = profileData ?? null;
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("profile", JSON.stringify(profile));
    }

    console.log("Logado fii 🚀");
    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
};


  const logout = async () => {
  await supabase.auth.signOut()
  setProfile(null)
  setUser(null)

  // Remove do localStorage
  localStorage.removeItem("user")
  localStorage.removeItem("profile")
}


//  useEffect(() => {
//   const createDefaultUsers = async () => {
//     const defaultUsers = [
//       { email: 'admin@pasteldapraca.com', password: '150717Fc@', name: 'Administrador', role: 'admin' },
//       { email: 'atendente@pasteldapraca.com', password: '150717Fc', name: 'Atendente', role: 'attendant' },
//       { email: 'guissilval005@gmail.com', password: 'atendente123', name: 'Administrador', role: 'admin' },
//     ];

//     for (const u of defaultUsers) {
//       try {
//         // Verifica se já existe o usuário no Auth
//         const { data: existing } = await supabase.auth.admin.listUsers(); // require Supabase Admin
//         const userExists = existing.users.some(user => user.email === u.email);
//         if (userExists) continue;

//         // Cria usuário no Auth
//         const { data, error } = await supabase.auth.signUp({ email: u.email, password: u.password });
//         if (error) {
//           console.log(`Erro ao criar ${u.email}:`, error.message);
//           continue;
//         }

//         // Cria perfil na tabela users
//         const { error: profileError } = await supabase
//           .from('users')
//           .insert({
//             id: data.user?.id,
//             email: u.email,
//             name: u.name,
//             role: u.role,
//           });

//         if (profileError) {
//           console.log(`Erro ao criar perfil de ${u.email}:`, profileError.message);
//         } else {
//           console.log(`Usuário ${u.email} criado com sucesso!`);
//         }
//       } catch (err) {
//         console.log(`Erro desconhecido para ${u.email}:`, err);
//       }
//     }
//   };

//   createDefaultUsers();
// }, []);

  const value: AuthContextType = { user, profile, login, logout, loading }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}


export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
