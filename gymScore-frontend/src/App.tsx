import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { Layout } from './components/Layout'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { Home } from './pages/Home'
import { Desafios } from './pages/Desafios'
import { CriarDesafio } from './pages/CriarDesafio'
import { Amigos } from './pages/Amigos'
import { Perfil } from './pages/Perfil'
import { Pix } from './pages/Pix'
import { Privacidade } from './pages/Privacidade'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token)
  return token ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/privacidade" element={<Privacidade />} />
        <Route
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          <Route path="/" element={<Home />} />
          <Route path="/desafios" element={<Desafios />} />
          <Route path="/desafios/criar" element={<CriarDesafio />} />
          <Route path="/amigos" element={<Amigos />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/pix" element={<Pix />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
