import { useOutletContext } from 'react-router-dom'
import EditorPesquisa from '../components/EditorPesquisa'
import { FiEdit3 } from 'react-icons/fi'

export default function ClientePesquisasPage() {
  const { clienteId } = useOutletContext()

  return (
    <div>
      <div className="page-header-container">
        <div className="page-title-group">
          <div className="page-eyebrow">Configurações de Coleta</div>
          <h1 className="page-title">
            <FiEdit3 style={{ marginRight: 8, verticalAlign: 'middle' }} />
            Pesquisa & Banners
          </h1>
          <p className="page-subtitle">Configure as perguntas de satisfação e a tela inicial dos seus totens.</p>
        </div>
      </div>

      <div className="panel-card" style={{ padding: 28 }}>
        <EditorPesquisa clienteId={clienteId} />
      </div>
    </div>
  )
}