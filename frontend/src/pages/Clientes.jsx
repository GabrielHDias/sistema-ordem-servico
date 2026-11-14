import { useEffect, useState } from "react"
import { api } from "../api.js"

const vazio = { nome: "", cpf: "", telefone: "", email: "" }

export default function Clientes() {
  const [lista, setLista] = useState([])
  const [form, setForm] = useState(vazio)
  const [editandoId, setEditandoId] = useState(null)
  const [aviso, setAviso] = useState(null)

  async function carregar() {
    setLista(await api("/clientes"))
  }

  useEffect(() => {
    carregar().catch((erro) => setAviso({ tipo: "erro", texto: erro.message }))
  }, [])

  function alterar(evento) {
    const { name, value } = evento.target
    setForm((atual) => ({ ...atual, [name]: value }))
  }

  function editar(cliente) {
    setEditandoId(cliente.id)
    setForm({
      nome: cliente.nome,
      cpf: cliente.cpf,
      telefone: cliente.telefone || "",
      email: cliente.email || "",
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
        await api(`/clientes/${editandoId}`, {
          method: "PUT",
          body: JSON.stringify(form),
        })
        setAviso({ tipo: "ok", texto: "Cliente atualizado. O CPF não muda." })
      } else {
        await api("/clientes", {
          method: "POST",
          body: JSON.stringify(form),
        })
        setAviso({ tipo: "ok", texto: "Cliente cadastrado." })
      }
      setForm(vazio)
      setEditandoId(null)
      await carregar()
    } catch (erro) {
      setAviso({ tipo: "erro", texto: erro.message })
    }
  }

  async function excluir(cliente) {
    if (!window.confirm(`Excluir o cliente ${cliente.nome}?`)) {
      return
    }
    setAviso(null)
    try {
      await api(`/clientes/${cliente.id}`, { method: "DELETE" })
      if (editandoId === cliente.id) {
        cancelarEdicao()
      }
      setAviso({ tipo: "ok", texto: "Cliente excluído." })
      await carregar()
    } catch (erro) {
      setAviso({ tipo: "erro", texto: erro.message })
    }
  }

  return (
    <section>
      <h2>Clientes</h2>
      {aviso && <p className={`aviso ${aviso.tipo}`}>{aviso.texto}</p>}

      <form className="painel" onSubmit={salvar}>
        <h3>{editandoId ? `Editar cliente ${editandoId}` : "Novo cliente"}</h3>
        <div className="grade">
          <label>
            Nome
            <input name="nome" value={form.nome} onChange={alterar} required maxLength={100} />
          </label>
          <label>
            CPF
            <input
              name="cpf"
              value={form.cpf}
              onChange={alterar}
              required
              maxLength={14}
              disabled={editandoId != null}
            />
          </label>
          <label>
            Telefone
            <input name="telefone" value={form.telefone} onChange={alterar} maxLength={20} />
          </label>
          <label>
            E-mail
            <input name="email" type="email" value={form.email} onChange={alterar} maxLength={100} />
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
        <p className="vazio">Nenhum cliente cadastrado.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Id</th>
              <th>Nome</th>
              <th>CPF</th>
              <th>Telefone</th>
              <th>E-mail</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {lista.map((cliente) => (
              <tr key={cliente.id}>
                <td>{cliente.id}</td>
                <td>{cliente.nome}</td>
                <td>{cliente.cpf}</td>
                <td>{cliente.telefone}</td>
                <td>{cliente.email}</td>
                <td className="botoes">
                  <button type="button" className="secundario" onClick={() => editar(cliente)}>
                    Editar
                  </button>
                  <button type="button" className="perigo" onClick={() => excluir(cliente)}>
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
