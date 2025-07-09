from marshmallow import Schema, fields, validate, validates, ValidationError
from datetime import datetime
import re

class BeneficiarioSchema(Schema):
    id = fields.Int(dump_only=True)
    matricula = fields.Str(dump_only=True)
    nome_completo = fields.Str(required=True, validate=validate.Length(min=2, max=200))
    data_nascimento = fields.Date(required=True)
    sexo = fields.Str(required=True, validate=validate.OneOf(['M', 'F', 'Outro']))
    cpf = fields.Str(required=True, validate=validate.Length(min=11, max=14))
    rg = fields.Str(required=True, validate=validate.Length(min=5, max=20))
    orgao_emissor_rg = fields.Str(required=True, validate=validate.Length(min=2, max=10))
    data_emissao_rg = fields.Date(required=True)
    nome_mae = fields.Str(required=True, validate=validate.Length(min=2, max=200))
    estado_civil = fields.Str(required=True, validate=validate.OneOf(['Solteiro', 'Casado', 'Divorciado', 'Viúvo', 'União Estável']))
    nacionalidade = fields.Str(validate=validate.Length(max=50))
    
    # Endereço
    logradouro = fields.Str(required=True, validate=validate.Length(min=5, max=200))
    numero_endereco = fields.Str(required=True, validate=validate.Length(min=1, max=10))
    complemento_endereco = fields.Str(allow_none=True, validate=validate.Length(max=100))
    bairro = fields.Str(required=True, validate=validate.Length(min=2, max=100))
    cidade = fields.Str(required=True, validate=validate.Length(min=2, max=100))
    uf = fields.Str(required=True, validate=validate.Length(equal=2))
    cep = fields.Str(required=True, validate=validate.Length(min=8, max=9))
    
    # Contato
    telefone_fixo = fields.Str(allow_none=True, validate=validate.Length(max=15))
    telefone_celular = fields.Str(required=True, validate=validate.Length(min=10, max=15))
    email = fields.Email(required=True, validate=validate.Length(max=120))
    
    # Plano de saúde
    plano_saude_vinculado = fields.Str(required=True, validate=validate.Length(min=2, max=100))
    data_inicio_cobertura = fields.Date(required=True)
    data_termino_cobertura = fields.Date(allow_none=True)
    situacao_cadastral = fields.Str(validate=validate.OneOf(['Ativo', 'Suspenso', 'Cancelado', 'Inativo']))
    tipo_beneficiario = fields.Str(required=True, validate=validate.OneOf(['Titular', 'Dependente']))
    grau_parentesco = fields.Str(allow_none=True, validate=validate.OneOf([
        'Cônjuge', 'Companheiro(a)', 'Filho(a)', 'Enteado(a)', 'Pai', 'Mãe', 
        'Sogro(a)', 'Irmão(ã)', 'Neto(a)', 'Bisneto(a)', 'Avô/Avó', 'Bisavô/Bisavó'
    ]))
    id_titular = fields.Int(allow_none=True)
    numero_carteira_plano = fields.Str(required=True, validate=validate.Length(min=5, max=30))
    data_adesao_plano = fields.Date(required=True)
    data_cancelamento_plano = fields.Date(allow_none=True)
    motivo_cancelamento = fields.Str(allow_none=True)
    
    # Controle
    data_criacao = fields.DateTime(dump_only=True)
    data_atualizacao = fields.DateTime(dump_only=True)
    ativo = fields.Bool(dump_only=True)
    
    @validates('cpf')
    def validate_cpf(self, value):
        # Remove caracteres não numéricos
        cpf = re.sub(r'[^0-9]', '', value)
        
        if len(cpf) != 11:
            raise ValidationError('CPF deve ter 11 dígitos')
        
        # Verifica se todos os dígitos são iguais
        if cpf == cpf[0] * 11:
            raise ValidationError('CPF inválido')
        
        # Validação do primeiro dígito verificador
        soma = sum(int(cpf[i]) * (10 - i) for i in range(9))
        resto = soma % 11
        digito1 = 0 if resto < 2 else 11 - resto
        
        if int(cpf[9]) != digito1:
            raise ValidationError('CPF inválido')
        
        # Validação do segundo dígito verificador
        soma = sum(int(cpf[i]) * (11 - i) for i in range(10))
        resto = soma % 11
        digito2 = 0 if resto < 2 else 11 - resto
        
        if int(cpf[10]) != digito2:
            raise ValidationError('CPF inválido')
    
    @validates('cep')
    def validate_cep(self, value):
        # Remove caracteres não numéricos
        cep = re.sub(r'[^0-9]', '', value)
        
        if len(cep) != 8:
            raise ValidationError('CEP deve ter 8 dígitos')
    
    @validates('data_nascimento')
    def validate_data_nascimento(self, value):
        if value > datetime.now().date():
            raise ValidationError('Data de nascimento não pode ser futura')
        
        # Verifica se a pessoa tem pelo menos 1 dia de vida
        if value == datetime.now().date():
            raise ValidationError('Data de nascimento deve ser anterior à data atual')


class HistoricoBeneficiarioSchema(Schema):
    id = fields.Int(dump_only=True)
    beneficiario_id = fields.Int(required=True)
    campo_alterado = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    valor_antigo = fields.Str(allow_none=True)
    valor_novo = fields.Str(allow_none=True)
    data_alteracao = fields.DateTime(dump_only=True)
    usuario_alteracao = fields.Str(validate=validate.Length(max=100))


# Instâncias dos esquemas para uso nas rotas
beneficiario_schema = BeneficiarioSchema()
beneficiarios_schema = BeneficiarioSchema(many=True)
historico_beneficiario_schema = HistoricoBeneficiarioSchema()
historicos_beneficiario_schema = HistoricoBeneficiarioSchema(many=True)

