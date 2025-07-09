// Configuração base da API
const API_BASE_URL = '/api'

// Função auxiliar para fazer requisições HTTP
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  }

  try {
    const response = await fetch(url, config)
    
    // Para requisições DELETE que retornam 204, não tentar fazer parse do JSON
    if (response.status === 204) {
      return { success: true }
    }
    
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`)
    }
    
    return data
  } catch (error) {
    console.error('API Request Error:', error)
    throw error
  }
}

// Serviços para Beneficiários
export const beneficiarioService = {
  // Listar beneficiários com filtros e paginação
  listar: async (filtros = {}, page = 1, per_page = 10) => {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: per_page.toString(),
      ...filtros
    })
    
    return apiRequest(`/beneficiarios?${params}`)
  },

  // Obter um beneficiário específico
  obter: async (id) => {
    return apiRequest(`/beneficiarios/${id}`)
  },

  // Criar novo beneficiário
  criar: async (dadosBeneficiario) => {
    return apiRequest('/beneficiarios', {
      method: 'POST',
      body: JSON.stringify(dadosBeneficiario),
    })
  },

  // Atualizar beneficiário existente
  atualizar: async (id, dadosBeneficiario) => {
    return apiRequest(`/beneficiarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dadosBeneficiario),
    })
  },

  // Excluir beneficiário (exclusão lógica)
  excluir: async (id) => {
    return apiRequest(`/beneficiarios/${id}`, {
      method: 'DELETE',
    })
  },

  // Obter histórico de alterações
  obterHistorico: async (id) => {
    return apiRequest(`/beneficiarios/${id}/historico`)
  },

  // Exportar para CSV
  exportarCSV: async (filtros = {}) => {
    const params = new URLSearchParams(filtros)
    const url = `${API_BASE_URL}/beneficiarios/export/csv?${params}`
    
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `beneficiarios_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(downloadUrl)
      
      return { success: true }
    } catch (error) {
      console.error('Erro ao exportar CSV:', error)
      throw error
    }
  },

  // Exportar para PDF
  exportarPDF: async (filtros = {}) => {
    const params = new URLSearchParams(filtros)
    const url = `${API_BASE_URL}/beneficiarios/export/pdf?${params}`
    
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `beneficiarios_${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(downloadUrl)
      
      return { success: true }
    } catch (error) {
      console.error('Erro ao exportar PDF:', error)
      throw error
    }
  }
}

// Função para verificar se a API está disponível
export const verificarAPI = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/beneficiarios?per_page=1`)
    return response.ok
  } catch (error) {
    return false
  }
}

export default beneficiarioService

