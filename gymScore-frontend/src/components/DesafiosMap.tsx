import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import type { Desafio } from '../types'
import 'leaflet/dist/leaflet.css'

// Fix: Vite não processa os assets de ícone do Leaflet automaticamente
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

interface Props {
  desafios: Desafio[]
}

export function DesafiosMap({ desafios }: Props) {
  const comCoordenadas = desafios.filter((d) => d.latitude && d.longitude)

  return (
    <MapContainer
      center={[-15.793889, -47.882778]}
      zoom={12}
      className="w-full h-56 rounded-2xl z-0"
      style={{ minHeight: 224 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {comCoordenadas.map((d) => (
        <Marker key={d.id} position={[d.latitude!, d.longitude!]}>
          <Popup>
            <strong>{d.titulo}</strong>
            <br />
            R$ {d.valor_aposta.toFixed(2)}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
