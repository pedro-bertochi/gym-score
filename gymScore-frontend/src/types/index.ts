export interface Usuario {
  id: number
  nome: string
  sobrenome: string
  email: string
  cpf: string
  saldo: number
  genero: string
  data_nascimento: string
  criado_em: string
}

export interface Desafio {
  id: number
  titulo: string
  descricao: string
  valor_aposta: number
  status: 'aberto' | 'pendente' | 'em_andamento' | 'encerrado'
  id_criador: number
  id_participante?: number
  local?: string
  latitude?: number
  longitude?: number
  criado_em: string
}

export interface Amizade {
  id: number
  id_usuario1: number
  id_usuario2: number
  status: 'pendente' | 'aceita' | 'recusada'
  usuario1?: Usuario
  usuario2?: Usuario
}

export interface PixPayload {
  valor: number
}

export interface PixResponse {
  qrcode_base64: string
  payload: string
  expiration_date: string
  asaas_payment_id: string
}

export interface AuthResponse {
  token: string
  usuario: Usuario
}
