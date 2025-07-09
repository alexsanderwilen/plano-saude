import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import { 
  Save, 
  ArrowLeft, 
  User, 
  MapPin, 
  Phone, 
  CreditCard,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { beneficiarioService } from '../services/api'

function CadastroBeneficiario() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdicao = !!id

  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState('')
  const [apiError, setApiError] = useState('')
  
  const [formData, setFormData] = useState({
    // Dados pessoais
    nome_completo: '',
    data_nascimento: '',
    sexo: '',
    cpf: '',
    rg: '',
    orgao_emissor_rg: '',
    data_emissao_rg: '',
    nome_mae: '',
    estado_civil: '',
    nacionalidade: 'Brasileira',
    
    // Endereço
    logradouro: '',
    numero_endereco: '',
    complemento_endereco: '',
    bairro: '',
    cidade: '',
    uf: '',
    cep: '',
    
    // Contato
    telefone_fixo: '',
    telefone_celular: '',
    email: '',
    
    // Plano de saúde
    plano_saude_vinculado: '',
    data_inicio_cobertura: '',
    data_termino_cobertura: '',
    situacao_cadastral: 'Ativo',
    tipo_beneficiario: 'Titular',
    grau_parentesco: '',
    id_titular: '',
    numero_carteira_plano: '',
    data_adesao_plano: '',
    data_cancelamento_plano: '',
    motivo_cancelamento: ''
  })

  useEffect(() => {
    if (isEdicao) {
      carregarBeneficiario()
    }
  }, [isEdicao, id])

  const carregarBeneficiario = async () => {
    try {
      setLoadingData(true)
      setApiError('')
      
      const beneficiario = await beneficiarioService.obter(id)
      
      // Converter datas para formato do input date
      const formatarDataParaInput = (dataString) => {
        if (!dataString) return ''
        return dataString.split('T')[0] // Remove a parte do tempo
      }
      
      setFormData({
        ...beneficiario,
        data_nascimento: formatarDataParaInput(beneficiario.data_nascimento),
        data_emissao_rg: formatarDataParaInput(beneficiario.data_emissao_rg),
        data_inicio_cobertura: formatarDataParaInput(beneficiario.data_inicio_cobertura),
        data_termino_cobertura: formatarDataParaInput(beneficiario.data_termino_cobertura),
        data_adesao_plano: formatarDataParaInput(beneficiario.data_adesao_plano),
        data_cancelamento_plano: formatarDataParaInput(beneficiario.data_cancelamento_plano),
      })
    } catch (error) {
      console.error('Erro ao carregar beneficiário:', error)
      setApiError('Erro ao carregar dados do beneficiário: ' + error.message)
    } finally {
      setLoadingData(false)
    }
  }

  const handleInputChange = (campo, valor) => {
    setFormData(prev => ({
      ...prev,
      [campo]: valor
    }))
    
    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[campo]) {
      setErrors(prev => ({
        ...prev,
        [campo]: ''
      }))
    }
    
    // Limpar mensagens de sucesso e erro
    if (success) setSuccess('')
    if (apiError) setApiError('')
  }

  const validateForm = () => {
    const newErrors = {}

    // Validações obrigatórias
    const requiredFields = [
      'nome_completo', 'data_nascimento', 'sexo', 'cpf', 'rg', 
      'orgao_emissor_rg', 'data_emissao_rg', 'nome_mae', 'estado_civil',
      'logradouro', 'numero_endereco', 'bairro', 'cidade', 'uf', 'cep',
      'telefone_celular', 'email', 'plano_saude_vinculado', 
      'data_inicio_cobertura', 'tipo_beneficiario', 'numero_carteira_plano',
      'data_adesao_plano'
    ]

    requiredFields.forEach(field => {
      if (!formData[field] || formData[field].toString().trim() === '') {
        newErrors[field] = 'Este campo é obrigatório'
      }
    })

    // Validação de CPF (básica)
    if (formData.cpf && formData.cpf.replace(/\D/g, '').length !== 11) {
      newErrors.cpf = 'CPF deve ter 11 dígitos'
    }

    // Validação de email
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido'
    }

    // Validação de CEP
    if (formData.cep && formData.cep.replace(/\D/g, '').length !== 8) {
      newErrors.cep = 'CEP deve ter 8 dígitos'
    }

    // Validações específicas para dependente
    if (formData.tipo_beneficiario === 'Dependente') {
      if (!formData.grau_parentesco) {
        newErrors.grau_parentesco = 'Grau de parentesco é obrigatório para dependentes'
      }
      if (!formData.id_titular) {
        newErrors.id_titular = 'Titular é obrigatório para dependentes'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    setApiError('')
    setSuccess('')
    
    try {
      // Preparar dados para envio (remover campos vazios opcionais)
      const dadosParaEnvio = { ...formData }
      
      // Remover campos vazios opcionais
      Object.keys(dadosParaEnvio).forEach(key => {
        if (dadosParaEnvio[key] === '' && !['nome_completo', 'cpf', 'email'].includes(key)) {
          delete dadosParaEnvio[key]
        }
      })
      
      if (isEdicao) {
        await beneficiarioService.atualizar(id, dadosParaEnvio)
        setSuccess('Beneficiário atualizado com sucesso!')
      } else {
        await beneficiarioService.criar(dadosParaEnvio)
        setSuccess('Beneficiário cadastrado com sucesso!')
      }
      
      // Redirecionar após 2 segundos
      setTimeout(() => {
        navigate('/beneficiarios')
      }, 2000)
      
    } catch (error) {
      console.error('Erro ao salvar beneficiário:', error)
      setApiError('Erro ao salvar beneficiário: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const formatCPF = (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1')
  }

  const formatCEP = (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{3})\d+?$/, '$1')
  }

  const formatPhone = (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4,5})(\d{4})/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1')
  }

  if (loadingData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate('/beneficiarios')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Carregando...</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-10 bg-gray-200 rounded"></div>
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
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={() => navigate('/beneficiarios')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEdicao ? 'Editar Beneficiário' : 'Novo Beneficiário'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isEdicao ? 'Atualize as informações do beneficiário' : 'Cadastre um novo beneficiário no sistema'}
          </p>
        </div>
      </div>

      {/* Mensagens de Sucesso e Erro */}
      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {success}
          </AlertDescription>
        </Alert>
      )}

      {apiError && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {apiError}
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dados Pessoais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Dados Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nome_completo">Nome Completo *</Label>
                <Input
                  id="nome_completo"
                  value={formData.nome_completo}
                  onChange={(e) => handleInputChange('nome_completo', e.target.value)}
                  className={errors.nome_completo ? 'border-red-500' : ''}
                />
                {errors.nome_completo && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.nome_completo}
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="data_nascimento">Data de Nascimento *</Label>
                <Input
                  id="data_nascimento"
                  type="date"
                  value={formData.data_nascimento}
                  onChange={(e) => handleInputChange('data_nascimento', e.target.value)}
                  className={errors.data_nascimento ? 'border-red-500' : ''}
                />
                {errors.data_nascimento && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.data_nascimento}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="sexo">Sexo *</Label>
                <select
                  id="sexo"
                  value={formData.sexo}
                  onChange={(e) => handleInputChange('sexo', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.sexo ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Selecione</option>
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
                  <option value="Outro">Outro</option>
                </select>
                {errors.sexo && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.sexo}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="cpf">CPF *</Label>
                <Input
                  id="cpf"
                  value={formData.cpf}
                  onChange={(e) => handleInputChange('cpf', formatCPF(e.target.value))}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  className={errors.cpf ? 'border-red-500' : ''}
                />
                {errors.cpf && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.cpf}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="estado_civil">Estado Civil *</Label>
                <select
                  id="estado_civil"
                  value={formData.estado_civil}
                  onChange={(e) => handleInputChange('estado_civil', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.estado_civil ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Selecione</option>
                  <option value="Solteiro">Solteiro</option>
                  <option value="Casado">Casado</option>
                  <option value="Divorciado">Divorciado</option>
                  <option value="Viúvo">Viúvo</option>
                  <option value="União Estável">União Estável</option>
                </select>
                {errors.estado_civil && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.estado_civil}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="rg">RG *</Label>
                <Input
                  id="rg"
                  value={formData.rg}
                  onChange={(e) => handleInputChange('rg', e.target.value)}
                  className={errors.rg ? 'border-red-500' : ''}
                />
                {errors.rg && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.rg}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="orgao_emissor_rg">Órgão Emissor *</Label>
                <Input
                  id="orgao_emissor_rg"
                  value={formData.orgao_emissor_rg}
                  onChange={(e) => handleInputChange('orgao_emissor_rg', e.target.value)}
                  placeholder="SSP-SP"
                  className={errors.orgao_emissor_rg ? 'border-red-500' : ''}
                />
                {errors.orgao_emissor_rg && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.orgao_emissor_rg}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="data_emissao_rg">Data de Emissão *</Label>
                <Input
                  id="data_emissao_rg"
                  type="date"
                  value={formData.data_emissao_rg}
                  onChange={(e) => handleInputChange('data_emissao_rg', e.target.value)}
                  className={errors.data_emissao_rg ? 'border-red-500' : ''}
                />
                {errors.data_emissao_rg && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.data_emissao_rg}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nome_mae">Nome da Mãe *</Label>
                <Input
                  id="nome_mae"
                  value={formData.nome_mae}
                  onChange={(e) => handleInputChange('nome_mae', e.target.value)}
                  className={errors.nome_mae ? 'border-red-500' : ''}
                />
                {errors.nome_mae && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.nome_mae}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="nacionalidade">Nacionalidade</Label>
                <Input
                  id="nacionalidade"
                  value={formData.nacionalidade}
                  onChange={(e) => handleInputChange('nacionalidade', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Endereço */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Endereço
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="logradouro">Logradouro *</Label>
                <Input
                  id="logradouro"
                  value={formData.logradouro}
                  onChange={(e) => handleInputChange('logradouro', e.target.value)}
                  placeholder="Rua, Avenida, etc."
                  className={errors.logradouro ? 'border-red-500' : ''}
                />
                {errors.logradouro && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.logradouro}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="numero_endereco">Número *</Label>
                <Input
                  id="numero_endereco"
                  value={formData.numero_endereco}
                  onChange={(e) => handleInputChange('numero_endereco', e.target.value)}
                  className={errors.numero_endereco ? 'border-red-500' : ''}
                />
                {errors.numero_endereco && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.numero_endereco}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="complemento_endereco">Complemento</Label>
                <Input
                  id="complemento_endereco"
                  value={formData.complemento_endereco}
                  onChange={(e) => handleInputChange('complemento_endereco', e.target.value)}
                  placeholder="Apto, Sala, etc."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="bairro">Bairro *</Label>
                <Input
                  id="bairro"
                  value={formData.bairro}
                  onChange={(e) => handleInputChange('bairro', e.target.value)}
                  className={errors.bairro ? 'border-red-500' : ''}
                />
                {errors.bairro && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.bairro}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="cidade">Cidade *</Label>
                <Input
                  id="cidade"
                  value={formData.cidade}
                  onChange={(e) => handleInputChange('cidade', e.target.value)}
                  className={errors.cidade ? 'border-red-500' : ''}
                />
                {errors.cidade && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.cidade}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="uf">UF *</Label>
                <select
                  id="uf"
                  value={formData.uf}
                  onChange={(e) => handleInputChange('uf', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.uf ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Selecione</option>
                  <option value="SP">SP</option>
                  <option value="RJ">RJ</option>
                  <option value="MG">MG</option>
                  <option value="RS">RS</option>
                  <option value="PR">PR</option>
                  <option value="SC">SC</option>
                  <option value="BA">BA</option>
                  <option value="GO">GO</option>
                  <option value="PE">PE</option>
                  <option value="CE">CE</option>
                </select>
                {errors.uf && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.uf}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="cep">CEP *</Label>
                <Input
                  id="cep"
                  value={formData.cep}
                  onChange={(e) => handleInputChange('cep', formatCEP(e.target.value))}
                  placeholder="00000-000"
                  maxLength={9}
                  className={errors.cep ? 'border-red-500' : ''}
                />
                {errors.cep && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.cep}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contato */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Phone className="h-5 w-5 mr-2" />
              Contato
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="telefone_fixo">Telefone Fixo</Label>
                <Input
                  id="telefone_fixo"
                  value={formData.telefone_fixo}
                  onChange={(e) => handleInputChange('telefone_fixo', formatPhone(e.target.value))}
                  placeholder="(11) 3333-4444"
                />
              </div>

              <div>
                <Label htmlFor="telefone_celular">Telefone Celular *</Label>
                <Input
                  id="telefone_celular"
                  value={formData.telefone_celular}
                  onChange={(e) => handleInputChange('telefone_celular', formatPhone(e.target.value))}
                  placeholder="(11) 99999-1234"
                  className={errors.telefone_celular ? 'border-red-500' : ''}
                />
                {errors.telefone_celular && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.telefone_celular}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="usuario@email.com"
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.email}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Plano de Saúde */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="h-5 w-5 mr-2" />
              Plano de Saúde
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tipo_beneficiario">Tipo de Beneficiário *</Label>
                <select
                  id="tipo_beneficiario"
                  value={formData.tipo_beneficiario}
                  onChange={(e) => handleInputChange('tipo_beneficiario', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.tipo_beneficiario ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="Titular">Titular</option>
                  <option value="Dependente">Dependente</option>
                </select>
                {errors.tipo_beneficiario && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.tipo_beneficiario}
                  </p>
                )}
              </div>

              {formData.tipo_beneficiario === 'Dependente' && (
                <div>
                  <Label htmlFor="grau_parentesco">Grau de Parentesco *</Label>
                  <select
                    id="grau_parentesco"
                    value={formData.grau_parentesco}
                    onChange={(e) => handleInputChange('grau_parentesco', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.grau_parentesco ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Selecione</option>
                    <option value="Cônjuge">Cônjuge</option>
                    <option value="Companheiro(a)">Companheiro(a)</option>
                    <option value="Filho(a)">Filho(a)</option>
                    <option value="Enteado(a)">Enteado(a)</option>
                    <option value="Pai">Pai</option>
                    <option value="Mãe">Mãe</option>
                    <option value="Sogro(a)">Sogro(a)</option>
                    <option value="Irmão(ã)">Irmão(ã)</option>
                    <option value="Neto(a)">Neto(a)</option>
                    <option value="Avô/Avó">Avô/Avó</option>
                  </select>
                  {errors.grau_parentesco && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.grau_parentesco}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="plano_saude_vinculado">Plano de Saúde *</Label>
                <select
                  id="plano_saude_vinculado"
                  value={formData.plano_saude_vinculado}
                  onChange={(e) => handleInputChange('plano_saude_vinculado', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.plano_saude_vinculado ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Selecione</option>
                  <option value="Plano Básico">Plano Básico</option>
                  <option value="Plano Premium">Plano Premium</option>
                  <option value="Plano Executivo">Plano Executivo</option>
                  <option value="Plano Familiar">Plano Familiar</option>
                </select>
                {errors.plano_saude_vinculado && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.plano_saude_vinculado}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="numero_carteira_plano">Número da Carteira *</Label>
                <Input
                  id="numero_carteira_plano"
                  value={formData.numero_carteira_plano}
                  onChange={(e) => handleInputChange('numero_carteira_plano', e.target.value)}
                  placeholder="CARD123456789"
                  className={errors.numero_carteira_plano ? 'border-red-500' : ''}
                />
                {errors.numero_carteira_plano && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.numero_carteira_plano}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="data_adesao_plano">Data de Adesão *</Label>
                <Input
                  id="data_adesao_plano"
                  type="date"
                  value={formData.data_adesao_plano}
                  onChange={(e) => handleInputChange('data_adesao_plano', e.target.value)}
                  className={errors.data_adesao_plano ? 'border-red-500' : ''}
                />
                {errors.data_adesao_plano && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.data_adesao_plano}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="data_inicio_cobertura">Início da Cobertura *</Label>
                <Input
                  id="data_inicio_cobertura"
                  type="date"
                  value={formData.data_inicio_cobertura}
                  onChange={(e) => handleInputChange('data_inicio_cobertura', e.target.value)}
                  className={errors.data_inicio_cobertura ? 'border-red-500' : ''}
                />
                {errors.data_inicio_cobertura && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.data_inicio_cobertura}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="data_termino_cobertura">Término da Cobertura</Label>
                <Input
                  id="data_termino_cobertura"
                  type="date"
                  value={formData.data_termino_cobertura}
                  onChange={(e) => handleInputChange('data_termino_cobertura', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="situacao_cadastral">Situação Cadastral</Label>
                <select
                  id="situacao_cadastral"
                  value={formData.situacao_cadastral}
                  onChange={(e) => handleInputChange('situacao_cadastral', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Ativo">Ativo</option>
                  <option value="Suspenso">Suspenso</option>
                  <option value="Cancelado">Cancelado</option>
                  <option value="Inativo">Inativo</option>
                </select>
              </div>

              {(formData.situacao_cadastral === 'Cancelado' || formData.situacao_cadastral === 'Inativo') && (
                <div>
                  <Label htmlFor="data_cancelamento_plano">Data de Cancelamento</Label>
                  <Input
                    id="data_cancelamento_plano"
                    type="date"
                    value={formData.data_cancelamento_plano}
                    onChange={(e) => handleInputChange('data_cancelamento_plano', e.target.value)}
                  />
                </div>
              )}
            </div>

            {(formData.situacao_cadastral === 'Cancelado' || formData.situacao_cadastral === 'Inativo') && (
              <div>
                <Label htmlFor="motivo_cancelamento">Motivo do Cancelamento</Label>
                <Textarea
                  id="motivo_cancelamento"
                  value={formData.motivo_cancelamento}
                  onChange={(e) => handleInputChange('motivo_cancelamento', e.target.value)}
                  placeholder="Descreva o motivo do cancelamento..."
                  rows={3}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Botões de Ação */}
        <div className="flex justify-end space-x-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate('/beneficiarios')}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {isEdicao ? 'Atualizar' : 'Cadastrar'}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default CadastroBeneficiario

