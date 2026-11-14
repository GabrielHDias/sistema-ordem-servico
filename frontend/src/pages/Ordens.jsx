import { useEffect, useState } from "react"
import { api } from "../api.js"

const STATUS = {
  ABERTA: "Aberta",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDA: "Concluída",
  CANCELADA: "Cancelada",
}

const PRIORIDADES = {
  BAIXA: "Baixa",
  MEDIA: "Média",
  ALTA: "Alta",
}

function formatarData(valor) {
  if (!valor) {
    return "—"
  }
  return new Date(valor).toLocaleString("pt-BR")
}

function formatarValor(valor) {
  if (valor == null) {
    return "—"
  }
  return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function Acoes({ os, tecnicos, onSucesso, onErro }) {
  const [tecnicoId, setTecnicoId] = useState(os.tecnico ? String(os.tecnico.id) : "")
  const [valor, setValor] = useState("")
  const finalizada = os.status === "CONCLUIDA" || os.status === "CANCELADA"

  if (finalizada) {
    return <span className="vazio">Encerrada</span>
  }

  async function executar(acao, mensagemOk) {
    try {
      await acao()
      onSucesso(mensagemOk)
    } catch (erro) {
      onErro(erro.message)
    }
  }

  function atribuir() {
    return executar(
      () => api(`/ordens/${os.id}/tecnico/${tecnicoId}`, { method: "PUT" }),
      "Técnico atribuído. A ordem está em andamento.",
    )
  }

  function concluir() {
    const caminho = valor === ""
      ? `/ordens/${os.id}/concluir`
      : `/ordens/${os.id}/concluir?valor=${encodeURIComponent(valor)}`
    return executar(
      () => api(caminho, { method: "PUT" }),
      "Ordem concluída.",
    )
  }

  function cancelar() {
    if (!window.confirm(`Cancelar a ordem ${os.id}?`)) {
      return
    }
    return executar(
      () => api(`/ordens/${os.id}/cancelar`, { method: "PUT" }),
      "Ordem cancelada.",
    )
  }

  return (
    <div className="linha-acao">
      <select value={tecnicoId} onChange={(evento) => setTecnicoId(evento.target.value)}>
        <option value="">Técnico</option>
        {tecnicos.map((tecnico) => (
          <option key={tecnico.id} value={tecnico.id}>
            {tecnico.nome}
          </option>
        ))}
      </select>
      <button type="button" className="secundario" disabled={!tecnicoId} onClick={atribuir}>
        Atribuir
      </button>
      <input
        type="number"
        step="0.01"
        placeholder="Valor"
        value={valor}
        onChange={(evento) => setValor(evento.target.value)}
      />
      <button type="button" onClick={concluir}>
        Concluir
      </button>
      <button type="button" className="perigo" onClick={cancelar}>
        Cancelar
      </button>
    </div>
  )
}

export default function Ordens() {
  const [lista, setLista] = useState([])
  const [clientes, setClientes] = useState([])
  const [tecnicos, setTecnicos] = useState([])
  const [statusFiltro, setStatusFiltro] = useState("")
  const [prioridadeFiltro, setPrioridadeFiltro] = useState("")
  const [nova, setNova] = useState({ descricao: "", prioridade: "MEDIA", clienteId: "" })
  const [aviso, setAviso] = useState(null)

  async function carregarOrdens(status = statusFiltro, prioridade = prioridadeFiltro) {
    if (prioridade) {
      const porPrioridade = await api(`/ordens/prioridade/${prioridade}`)
      setLista(status ? porPrioridade.filter((os) => os.status === status) : porPrioridade)
      return
    }
    if (status) {
      setLista(await api(`/ordens?status=${status}`))
      return
    }
    setLista(await api("/ordens"))
  }

  useEffect(() => {
    Promise.all([api("/clientes"), api("/tecnicos")])
      .then(([clientesApi, tecnicosApi]) => {
        setClientes(clientesApi)
        setTecnicos(tecnicosApi)
      })
      .catch((erro) => setAviso({ tipo: "erro", texto: erro.message }))
  }, [])

  useEffect(() => {
    carregarOrdens(statusFiltro, prioridadeFiltro).catch((erro) =>
      setAviso({ tipo: "erro", texto: erro.message }),
    )
  }, [statusFiltro, prioridadeFiltro])

  function alterarNova(evento) {
    const { name, value } = evento.target
    setNova((atual) => ({ ...atual, [name]: value }))
  }

  async function abrir(evento) {
    evento.preventDefault()
    setAviso(null)
    try {
      await api("/ordens", {
        method: "POST",
        body: JSON.stringify({
          descricao: nova.descricao,
          prioridade: nova.prioridade,
          cliente: { id: Number(nova.clienteId) },
        }),
      })
      setNova({ descricao: "", prioridade: "MEDIA", clienteId: "" })
      setAviso({ tipo: "ok", texto: "Ordem aberta com status Aberta." })
      await carregarOrdens()
    } catch (erro) {
      setAviso({ tipo: "erro", texto: erro.message })
    }
  }

  function onSucesso(texto) {
    setAviso({ tipo: "ok", texto })
    carregarOrdens().catch((erro) => setAviso({ tipo: "erro", texto: erro.message }))
  }

  function onErro(texto) {
    setAviso({ tipo: "erro", texto })
  }

  return (
    <section>
      <h2>Ordens de serviço</h2>
      {aviso && <p className={`aviso ${aviso.tipo}`}>{aviso.texto}</p>}

      <form className="painel" onSubmit={abrir}>
        <h3>Abrir ordem</h3>
        <div className="grade">
          <label>
            Descrição
            <input
              name="descricao"
              value={nova.descricao}
              onChange={alterarNova}
              required
              maxLength={500}
            />
          </label>
          <label>
            Cliente
            <select name="clienteId" value={nova.clienteId} onChange={alterarNova} required>
              <option value="">Selecione</option>
              {clientes.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nome}
                </option>
              ))}
            </select>
          </label>
          <label>
            Prioridade
            <select name="prioridade" value={nova.prioridade} onChange={alterarNova}>
              {Object.entries(PRIORIDADES).map(([valor, rotulo]) => (
                <option key={valor} value={valor}>
                  {rotulo}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="botoes">
          <button type="submit">Abrir</button>
        </div>
      </form>

      <div className="filtros">
        <label>
          Status
          <select value={statusFiltro} onChange={(evento) => setStatusFiltro(evento.target.value)}>
            <option value="">Todos</option>
            {Object.entries(STATUS).map(([valor, rotulo]) => (
              <option key={valor} value={valor}>
                {rotulo}
              </option>
            ))}
          </select>
        </label>
        <label>
          Prioridade
          <select
            value={prioridadeFiltro}
            onChange={(evento) => setPrioridadeFiltro(evento.target.value)}
          >
            <option value="">Todas</option>
            {Object.entries(PRIORIDADES).map(([valor, rotulo]) => (
              <option key={valor} value={valor}>
                {rotulo}
              </option>
            ))}
          </select>
        </label>
      </div>

      {lista.length === 0 ? (
        <p className="vazio">Nenhuma ordem encontrada.</p>
      ) : (
        <div className="tabela-rolagem">
          <table>
            <thead>
              <tr>
                <th>OS</th>
                <th>Cliente</th>
                <th>Técnico</th>
                <th>Prioridade</th>
                <th>Status</th>
                <th>Valor</th>
                <th>Abertura</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((os) => (
                <tr key={os.id}>
                  <td>
                    <strong>#{os.id}</strong>
                    <div>{os.descricao}</div>
                  </td>
                  <td>{os.cliente?.nome}</td>
                  <td>{os.tecnico?.nome || "—"}</td>
                  <td>{PRIORIDADES[os.prioridade] || "—"}</td>
                  <td>
                    <span className={`badge ${os.status}`}>{STATUS[os.status]}</span>
                  </td>
                  <td>{formatarValor(os.valor)}</td>
                  <td>{formatarData(os.dataAbertura)}</td>
                  <td>
                    <Acoes os={os} tecnicos={tecnicos} onSucesso={onSucesso} onErro={onErro} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
