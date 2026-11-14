import { NavLink, Route, Routes } from "react-router-dom"
import Clientes from "./pages/Clientes.jsx"

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
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Clientes />} />
        </Routes>
      </main>
    </div>
  )
}
