import api from './axios'
import type { PixPayload, PixResponse } from '../types'
import { useAuthStore } from '../store/authStore'

export async function gerarPix(payload: PixPayload): Promise<PixResponse> {
  const usuario = useAuthStore.getState().usuario
  const { data } = await api.post<PixResponse>('/api/pagamento/pix', {
    ...payload,
    cpf: usuario?.cpf ?? '',
    id_usuario: usuario?.id,
  })
  return data
}
