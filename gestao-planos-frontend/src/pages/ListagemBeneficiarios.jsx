import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import { 
  Search, 
  Filter, 
  Download, 
  Edit, 
  Trash2, 
  Eye, 
  UserPlus,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  FileDown
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { beneficiarioService } from '../services/api'

function ListagemBeneficiarios() {
  const [beneficiarios, setBeneficiarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filtros, setFiltros] = useState({
    nome: '',
    cpf: '',
    situacao: '',
    tipo: ''
  })
  const [paginacao, setPaginacao] = useState({
    page: 1,
    per_page: 10,
    total: 0,
    pages: 0
  })

  const carregarBeneficiarios = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const filtrosLimpos = Object.fromEntries(
        Object.entries(filtros).filter(([_, value]) => value.trim() !== '')
      )
      
      const response = await beneficiarioService.listar(
        filtrosLimpos, 
        paginacao.page, 
        paginacao.per_page
      )
      
      setBeneficiarios(response.beneficiarios || [])
      setPaginacao({
        page: response.current_page || 1,
        per_page: response.per_page || 10,
        total: response.total || 0,
        pages: response.pages || 1
      })
    } catch (error) {
      console.error('Erro ao carregar beneficiários:', error)
      setError('Erro ao carregar beneficiários. Verifique se o servidor está rodando.')
      setBeneficiarios([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarBeneficiarios()
  }, [paginacao.page])

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }))
  }

  const handleBuscar = () => {
    setPaginacao(prev => ({ ...prev, page: 1 }))
    carregarBeneficiarios()
  }

  const handleExcluir = async (id, nome) => {
    if (!window.confirm(`Tem certeza que deseja excluir o beneficiário ${nome}?`)) {
      return
    }

    try {
      await beneficiarioService.excluir(id)
      carregarBeneficiarios() // Recarregar a lista
    } catch (error) {
      console.error('Erro ao excluir beneficiário:', error)
      alert('Erro ao excluir beneficiário: ' + error.message)
    }
  }

  const handleExportarCSV = async () => {
    try {
      const filtrosLimpos = Object.fromEntries(
        Object.entries(filtros).filter(([_, value]) => value.trim() !== '')
      )
      await beneficiarioService.exportarCSV(filtrosLimpos)
    } catch (error) {
      console.error('Erro ao exportar CSV:', error)
      alert('Erro ao exportar CSV: ' + error.message)
    }
  }

  const handleExportarPDF = async () => {
    try {
      const filtrosLimpos = Object.fromEntries(
        Object.entries(filtros).filter(([_, value]) => value.trim() !== '')
      )
      await beneficiarioService.exportarPDF(filtrosLimpos)
    } catch (error) {
      console.error('Erro ao exportar PDF:', error)
      alert('Erro ao exportar PDF: ' + error.message)
    }
  }

  const handlePaginaAnterior = () => {
    if (paginacao.page > 1) {
      setPaginacao(prev => ({ ...prev, page: prev.page - 1 }))
    }
  }

  const handleProximaPagina = () => {
    if (paginacao.page < paginacao.pages) {
      setPaginacao(prev => ({ ...prev, page: prev.page + 1 }))
    }
  }

  const getSituacaoBadge = (situacao) => {
    const variants = {
      'Ativo': 'bg-green-100 text-green-800',
      'Suspenso': 'bg-yellow-100 text-yellow-800',
      'Cancelado': 'bg-red-100 text-red-800',
      'Inativo': 'bg-gray-100 text-gray-800'
    }
    return variants[situacao] || 'bg-gray-100 text-gray-800'
  }

  const getTipoBadge = (tipo) => {
    return tipo === 'Titular' 
      ? 'bg-blue-100 text-blue-800' 
      : 'bg-purple-100 text-purple-800'
  }

  const formatarData = (dataString) => {
    if (!dataString) return '-'
    const data = new Date(dataString)
    return data.toLocaleDateString('pt-BR') + ' ' + data.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  if (loading && beneficiarios.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Beneficiários</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Beneficiários</h1>
          <p className="text-gray-600 mt-1">Gerencie todos os beneficiários cadastrados</p>
        </div>
        <Link to="/cadastro">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <UserPlus className="h-4 w-4 mr-2" />
            Novo Beneficiário
          </Button>
        </Link>
      </div>

      {/* Erro */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome
              </label>
              <Input
                placeholder="Buscar por nome..."
                value={filtros.nome}
                onChange={(e) => handleFiltroChange('nome', e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleBuscar()}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CPF
              </label>
              <Input
                placeholder="000.000.000-00"
                value={filtros.cpf}
                onChange={(e) => handleFiltroChange('cpf', e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleBuscar()}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Situação
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filtros.situacao}
                onChange={(e) => handleFiltroChange('situacao', e.target.value)}
              >
                <option value="">Todas</option>
                <option value="Ativo">Ativo</option>
                <option value="Suspenso">Suspenso</option>
                <option value="Cancelado">Cancelado</option>
                <option value="Inativo">Inativo</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filtros.tipo}
                onChange={(e) => handleFiltroChange('tipo', e.target.value)}
              >
                <option value="">Todos</option>
                <option value="Titular">Titular</option>
                <option value="Dependente">Dependente</option>
              </select>
            </div>
          </div>
          <div className="flex justify-between items-center mt-4">
            <Button variant="outline" size="sm" onClick={handleBuscar} disabled={loading}>
              <Search className="h-4 w-4 mr-2" />
              {loading ? 'Buscando...' : 'Buscar'}
            </Button>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={handleExportarCSV}>
                <FileDown className="h-4 w-4 mr-2" />
                CSV
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportarPDF}>
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Beneficiários */}
      <Card>
        <CardHeader>
          <CardTitle>
            Lista de Beneficiários ({paginacao.total} encontrados)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {beneficiarios.length === 0 && !loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Nenhum beneficiário encontrado.</p>
              <Link to="/cadastro" className="mt-4 inline-block">
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Cadastrar Primeiro Beneficiário
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Matrícula</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Nome</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">CPF</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Plano</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Situação</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Tipo</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Cadastro</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {beneficiarios.map((beneficiario) => (
                      <tr key={beneficiario.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-mono text-sm">{beneficiario.matricula}</td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900">{beneficiario.nome_completo}</p>
                            <p className="text-sm text-gray-600">{beneficiario.email}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-sm">{beneficiario.cpf}</td>
                        <td className="py-3 px-4 text-sm">{beneficiario.plano_saude_vinculado}</td>
                        <td className="py-3 px-4">
                          <Badge className={getSituacaoBadge(beneficiario.situacao_cadastral)}>
                            {beneficiario.situacao_cadastral}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={getTipoBadge(beneficiario.tipo_beneficiario)}>
                            {beneficiario.tipo_beneficiario}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {formatarData(beneficiario.data_criacao)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="sm" title="Visualizar">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Link to={`/cadastro/${beneficiario.id}`}>
                              <Button variant="ghost" size="sm" title="Editar">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-600 hover:text-red-700"
                              title="Excluir"
                              onClick={() => handleExcluir(beneficiario.id, beneficiario.nome_completo)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginação */}
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-gray-700">
                  Mostrando {((paginacao.page - 1) * paginacao.per_page) + 1} a{' '}
                  {Math.min(paginacao.page * paginacao.per_page, paginacao.total)} de{' '}
                  {paginacao.total} resultados
                </p>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={paginacao.page === 1 || loading}
                    onClick={handlePaginaAnterior}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={paginacao.page === paginacao.pages || loading}
                    onClick={handleProximaPagina}
                  >
                    Próximo
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default ListagemBeneficiarios

