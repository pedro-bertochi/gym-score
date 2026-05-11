import api from './axios'
import type { Usuario } from '../types'

export async function buscarUsuario(id: number): Promise<Usuario> {
  const { data } = await api.get<Usuario>(`/api/usuarios/${id}`)
  return data
}

export async function listarUsuarios(): Promise<Usuario[]> {
  const { data } = await api.get<Usuario[]>('/api/usuarios')
  return data
}
