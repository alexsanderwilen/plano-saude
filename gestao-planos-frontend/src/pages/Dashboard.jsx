import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Users, UserPlus, UserCheck, UserX, TrendingUp, FileText } from 'lucide-react'
import { Link } from 'react-router-dom'

function Dashboard() {
  const [stats, setStats] = useState({
    totalBeneficiarios: 0,
    beneficiariosAtivos: 0,
    beneficiariosSuspensos: 0,
    beneficiariosCancelados: 0,
    novosCadastros: 0
  })

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simular carregamento de estatísticas
    // Em uma aplicação real, isso viria da API
    setTimeout(() => {
      setStats({
        totalBeneficiarios: 1250,
        beneficiariosAtivos: 1180,
        beneficiariosSuspensos: 45,
        beneficiariosCancelados: 25,
        novosCadastros: 23
      })
      setLoading(false)
    }, 1000)
  }, [])

  const statCards = [
    {
      title: 'Total de Beneficiários',
      value: stats.totalBeneficiarios,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Beneficiários Ativos',
      value: stats.beneficiariosAtivos,
      icon: UserCheck,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Suspensos',
      value: stats.beneficiariosSuspensos,
      icon: UserX,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      title: 'Cancelados',
      value: stats.beneficiariosCancelados,
      icon: UserX,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    }
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Visão geral do sistema de gestão de beneficiários</p>
        </div>
        <div className="flex space-x-3">
          <Link to="/cadastro">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <UserPlus className="h-4 w-4 mr-2" />
              Novo Beneficiário
            </Button>
          </Link>
          <Link to="/beneficiarios">
            <Button variant="outline">
              <Users className="h-4 w-4 mr-2" />
              Ver Todos
            </Button>
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {stat.value.toLocaleString()}
                    </p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Ações Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link to="/cadastro" className="block">
              <Button variant="outline" className="w-full justify-start">
                <UserPlus className="h-4 w-4 mr-2" />
                Cadastrar Novo Beneficiário
              </Button>
            </Link>
            <Link to="/beneficiarios" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                Consultar Beneficiários
              </Button>
            </Link>
            <Button variant="outline" className="w-full justify-start">
              <FileText className="h-4 w-4 mr-2" />
              Gerar Relatório
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cadastros Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">João Silva Santos</p>
                  <p className="text-sm text-gray-600">Titular - Plano Premium</p>
                </div>
                <span className="text-xs text-gray-500">Hoje</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Maria Oliveira</p>
                  <p className="text-sm text-gray-600">Dependente - Plano Básico</p>
                </div>
                <span className="text-xs text-gray-500">Ontem</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Carlos Pereira</p>
                  <p className="text-sm text-gray-600">Titular - Plano Executivo</p>
                </div>
                <span className="text-xs text-gray-500">2 dias atrás</span>
              </div>
            </div>
            <div className="mt-4">
              <Link to="/beneficiarios">
                <Button variant="ghost" className="w-full">
                  Ver todos os cadastros
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Dashboard

