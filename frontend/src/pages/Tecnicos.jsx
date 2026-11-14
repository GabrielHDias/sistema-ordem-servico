import { useEffect, useState } from "react"
import { api } from "../api.js"

const vazio = { nome: "", especialidade: "", telefone: "" }

export default function Tecnicos() {
  const [lista, setLista] = useState([])
  const [form, setForm] = useState(vazio)
  const [editandoId, setEditandoId] = useState(null)
  const [aviso, setAviso] = useState(null)

  async function carregar() {
    setLista(await api("/tecnicos"))
  }

  useEffect(() => {
    carregar().catch((erro) => setAviso({ tipo: "erro", texto: erro.message }))
  }, [])

  function alterar(evento) {
    const { name, value } = evento.target
    setForm((atual) => ({ ...atual, [name]: value }))
  }

  function editar(tecnico) {
    setEditandoId(tecnico.id)
    setForm({
      nome: tecnico.nome,
      especialidade: tecnico.especialidade || "",
      telefone: tecnico.telefone || "",
    })
    setAviso(null)
  }

  function cancelarEdicao() {
    setEditandoId(null)
    setForm(vazio)
  }

  async function salvar(evento) {
    evento.preventDefault()
    setAviso(null)
    try {
      if (editandoId) {
        await api(`/tecnicos/${editandoId}`, {
          method: "PUT",
          body: JSON.stringify(form),
        })
        setAviso({ tipo: "ok", texto: "Técnico atualizado." })
      } else {
        await api("/tecnicos", {
          method: "POST",
          body: JSON.stringify(form),
        })
        setAviso({ tipo: "ok", texto: "Técnico cadastrado." })
      }
      setForm(vazio)
      setEditandoId(null)
      await carregar()
    } catch (erro) {
      setAviso({ tipo: "erro", texto: erro.message })
    }
  }

  async function excluir(tecnico) {
    if (!window.confirm(`Excluir o técnico ${tecnico.nome}?`)) {
      return
    }
    setAviso(null)
    try {
      await api(`/tecnicos/${tecnico.id}`, { method: "DELETE" })
      if (editandoId === tecnico.id) {
        cancelarEdicao()
      }
      setAviso({ tipo: "ok", texto: "Técnico excluído." })
      await carregar()
    } catch (erro) {
      setAviso({ tipo: "erro", texto: erro.message })
    }
  }

  return (
    <section>
      <h2>Técnicos</h2>
      {aviso && <p className={`aviso ${aviso.tipo}`}>{aviso.texto}</p>}

      <form className="painel" onSubmit={salvar}>
        <h3>{editandoId ? `Editar técnico ${editandoId}` : "Novo técnico"}</h3>
        <div className="grade">
          <label>
            Nome
            <input name="nome" value={form.nome} onChange={alterar} required maxLength={100} />
          </label>
          <label>
            Especialidade
            <input name="especialidade" value={form.especialidade} onChange={alterar} maxLength={60} />
          </label>
          <label>
            Telefone
            <input name="telefone" value={form.telefone} onChange={alterar} maxLength={20} />
          </label>
        </div>
        <div className="botoes">
          <button type="submit">{editandoId ? "Salvar" : "Cadastrar"}</button>
          {editandoId && (
            <button type="button" className="secundario" onClick={cancelarEdicao}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      {lista.length === 0 ? (
        <p className="vazio">Nenhum técnico cadastrado.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Id</th>
              <th>Nome</th>
              <th>Especialidade</th>
              <th>Telefone</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {lista.map((tecnico) => (
              <tr key={tecnico.id}>
                <td>{tecnico.id}</td>
                <td>{tecnico.nome}</td>
                <td>{tecnico.especialidade}</td>
                <td>{tecnico.telefone}</td>
                <td className="botoes">
                  <button type="button" className="secundario" onClick={() => editar(tecnico)}>
                    Editar
                  </button>
                  <button type="button" className="perigo" onClick={() => excluir(tecnico)}>
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
