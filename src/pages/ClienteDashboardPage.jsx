import { useOutletContext } from 'react-router-dom'
import MetricasCliente from '../components/MetricasCliente'

export default function ClienteDashboardPage() {
  const { clienteId } = useOutletContext()

  return (
    <div className="card">
      <h2 className="card-title">Métricas</h2>
      <MetricasCliente clienteId={clienteId} />
    </div>
  )
}
