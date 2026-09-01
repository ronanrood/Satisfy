import { useOutletContext } from 'react-router-dom'
import EditorPesquisa from '../components/EditorPesquisa'

export default function ClientePesquisasPage() {
  const { clienteId } = useOutletContext()

  return (
    <div className="card">
      <h2 className="card-title">Pesquisa e banner de abertura</h2>
      <EditorPesquisa clienteId={clienteId} />
    </div>
  )
}
