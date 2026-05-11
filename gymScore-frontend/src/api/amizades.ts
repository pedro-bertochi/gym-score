import api from './axios'
import type { Amizade } from '../types'

export async function listarAmizades(idUsuario: number): Promise<Amizade[]> {
  const { data } = await api.get<Amizade[]>(`/api/amizades/${idUsuario}`)
  return data
}

export async function enviarSolicitacao(payload: {
  id_usuario1: number
  id_usuario2: number
}): Promise<void> {
  await api.post('/api/amizades', payload)
}

export async function aceitarAmizade(payload: {
  id_amizade: number
  id_usuario: number
}): Promise<void> {
  await api.post('/api/amizades/aceitar', payload)
}
