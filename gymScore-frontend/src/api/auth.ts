import api from './axios'
import type { AuthResponse } from '../types'

export async function login(email: string, senha: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/api/usuarios/login', { email, senha })
  return data
}

export async function register(payload: {
  nome: string
  sobrenome: string
  email: string
  senha: string
  cpf: string
  data_nascimento: string
  genero: string
}): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/api/usuarios/register', payload)
  return data
}
