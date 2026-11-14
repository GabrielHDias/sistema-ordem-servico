import { NavLink, Route, Routes } from "react-router-dom"
import Clientes from "./pages/Clientes.jsx"
import Ordens from "./pages/Ordens.jsx"
import Tecnicos from "./pages/Tecnicos.jsx"

export default function App() {
  return (
    <div className="app">
      <header>
        <div>
          <h1>Sistema de Ordem de Serviço</h1>
          <p>Assistência técnica — clientes, técnicos e ordens.</p>
        </div>
        <nav>
          <NavLink to="/" end className={({ isActive }) => (isActive ? "ativo" : undefined)}>
            Clientes
          </NavLink>
          <NavLink to="/tecnicos" className={({ isActive }) => (isActive ? "ativo" : undefined)}>
            Técnicos
          </NavLink>
          <NavLink to="/ordens" className={({ isActive }) => (isActive ? "ativo" : undefined)}>
            Ordens de serviço
          </NavLink>
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Clientes />} />
          <Route path="/tecnicos" element={<Tecnicos />} />
          <Route path="/ordens" element={<Ordens />} />
        </Routes>
      </main>
    </div>
  )
}
