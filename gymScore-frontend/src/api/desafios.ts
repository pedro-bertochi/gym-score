import api from './axios'
import type { Desafio } from '../types'

export async function listarDesafiosUsuario(idUsuario: number): Promise<Desafio[]> {
  const { data } = await api.get<Desafio[]>(`/api/desafios/usuario/${idUsuario}`)
  return data
}

export async function listarDesafiosView(): Promise<Desafio[]> {
  const { data } = await api.get<Desafio[]>('/api/desafios')
  return data
}

export async function criarDesafio(payload: {
  titulo: string
  descricao: string
  valor_aposta: number
  local: string
  id_criador: number
  latitude?: number
  longitude?: number
}): Promise<Desafio> {
  const { data } = await api.post<Desafio>('/api/desafios', payload)
  return data
}

export async function aceitarDesafio(payload: {
  id_desafio: number
  id_usuario: number
}): Promise<void> {
  await api.post('/api/desafios/aceitar', payload)
}

export async function iniciarDesafio(payload: { id_desafio: number }): Promise<void> {
  await api.post('/api/desafios/iniciar', payload)
}

export async function encerrarDesafio(payload: {
  id_desafio: number
  id_vencedor: number
  id_perdedor: number
}): Promise<void> {
  await api.post('/api/desafios/encerrar', payload)
}
