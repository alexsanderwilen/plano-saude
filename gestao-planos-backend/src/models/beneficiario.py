from src.database.database import db
from datetime import datetime
import uuid

class Beneficiario(db.Model):
    __tablename__ = 'beneficiarios'
    
    id = db.Column(db.Integer, primary_key=True)
    matricula = db.Column(db.String(20), unique=True, nullable=False)
    nome_completo = db.Column(db.String(200), nullable=False)
    data_nascimento = db.Column(db.Date, nullable=False)
    sexo = db.Column(db.String(10), nullable=False)  # 'M', 'F', 'Outro'
    cpf = db.Column(db.String(14), nullable=False)
    rg = db.Column(db.String(20), nullable=False)
    orgao_emissor_rg = db.Column(db.String(10), nullable=False)
    data_emissao_rg = db.Column(db.Date, nullable=False)
    nome_mae = db.Column(db.String(200), nullable=False)
    estado_civil = db.Column(db.String(20), nullable=False)  # 'Solteiro', 'Casado', 'Divorciado', 'Viúvo', 'União Estável'
    nacionalidade = db.Column(db.String(50), nullable=False, default='Brasileira')
    
    # Endereço
    logradouro = db.Column(db.String(200), nullable=False)
    numero_endereco = db.Column(db.String(10), nullable=False)
    complemento_endereco = db.Column(db.String(100))
    bairro = db.Column(db.String(100), nullable=False)
    cidade = db.Column(db.String(100), nullable=False)
    uf = db.Column(db.String(2), nullable=False)
    cep = db.Column(db.String(9), nullable=False)
    
    # Contato
    telefone_fixo = db.Column(db.String(15))
    telefone_celular = db.Column(db.String(15), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    
    # Plano de saúde
    plano_saude_vinculado = db.Column(db.String(100), nullable=False)
    data_inicio_cobertura = db.Column(db.Date, nullable=False)
    data_termino_cobertura = db.Column(db.Date)
    situacao_cadastral = db.Column(db.String(20), nullable=False, default='Ativo')  # 'Ativo', 'Suspenso', 'Cancelado', 'Inativo'
    tipo_beneficiario = db.Column(db.String(20), nullable=False)  # 'Titular', 'Dependente'
    grau_parentesco = db.Column(db.String(30))  # NULL se Titular
    id_titular = db.Column(db.Integer, db.ForeignKey('beneficiarios.id'))  # NULL se Titular
    numero_carteira_plano = db.Column(db.String(30), nullable=False)
    data_adesao_plano = db.Column(db.Date, nullable=False)
    data_cancelamento_plano = db.Column(db.Date)
    motivo_cancelamento = db.Column(db.Text)
    
    # Controle
    data_criacao = db.Column(db.DateTime, default=datetime.utcnow)
    data_atualizacao = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    ativo = db.Column(db.Boolean, default=True)  # Para exclusão lógica
    
    # Relacionamentos
    titular = db.relationship('Beneficiario', remote_side=[id], backref='dependentes')
    historico = db.relationship('HistoricoBeneficiario', backref='beneficiario', lazy=True)
    
    def __init__(self, **kwargs):
        super(Beneficiario, self).__init__(**kwargs)
        if not self.matricula:
            self.matricula = self.gerar_matricula()
    
    def gerar_matricula(self):
        """Gera uma matrícula única para o beneficiário"""
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        random_suffix = str(uuid.uuid4())[:4].upper()
        return f"BEN{timestamp}{random_suffix}"
    
    def __repr__(self):
        return f'<Beneficiario {self.nome_completo} - {self.matricula}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'matricula': self.matricula,
            'nome_completo': self.nome_completo,
            'data_nascimento': self.data_nascimento.isoformat() if self.data_nascimento else None,
            'sexo': self.sexo,
            'cpf': self.cpf,
            'rg': self.rg,
            'orgao_emissor_rg': self.orgao_emissor_rg,
            'data_emissao_rg': self.data_emissao_rg.isoformat() if self.data_emissao_rg else None,
            'nome_mae': self.nome_mae,
            'estado_civil': self.estado_civil,
            'nacionalidade': self.nacionalidade,
            'logradouro': self.logradouro,
            'numero_endereco': self.numero_endereco,
            'complemento_endereco': self.complemento_endereco,
            'bairro': self.bairro,
            'cidade': self.cidade,
            'uf': self.uf,
            'cep': self.cep,
            'telefone_fixo': self.telefone_fixo,
            'telefone_celular': self.telefone_celular,
            'email': self.email,
            'plano_saude_vinculado': self.plano_saude_vinculado,
            'data_inicio_cobertura': self.data_inicio_cobertura.isoformat() if self.data_inicio_cobertura else None,
            'data_termino_cobertura': self.data_termino_cobertura.isoformat() if self.data_termino_cobertura else None,
            'situacao_cadastral': self.situacao_cadastral,
            'tipo_beneficiario': self.tipo_beneficiario,
            'grau_parentesco': self.grau_parentesco,
            'id_titular': self.id_titular,
            'numero_carteira_plano': self.numero_carteira_plano,
            'data_adesao_plano': self.data_adesao_plano.isoformat() if self.data_adesao_plano else None,
            'data_cancelamento_plano': self.data_cancelamento_plano.isoformat() if self.data_cancelamento_plano else None,
            'motivo_cancelamento': self.motivo_cancelamento,
            'data_criacao': self.data_criacao.isoformat() if self.data_criacao else None,
            'data_atualizacao': self.data_atualizacao.isoformat() if self.data_atualizacao else None,
            'ativo': self.ativo
        }


class HistoricoBeneficiario(db.Model):
    __tablename__ = 'historico_beneficiarios'
    
    id = db.Column(db.Integer, primary_key=True)
    beneficiario_id = db.Column(db.Integer, db.ForeignKey('beneficiarios.id'), nullable=False)
    campo_alterado = db.Column(db.String(100), nullable=False)
    valor_antigo = db.Column(db.Text)
    valor_novo = db.Column(db.Text)
    data_alteracao = db.Column(db.DateTime, default=datetime.utcnow)
    usuario_alteracao = db.Column(db.String(100), default='Sistema')
    
    def __repr__(self):
        return f'<HistoricoBeneficiario {self.beneficiario_id} - {self.campo_alterado}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'beneficiario_id': self.beneficiario_id,
            'campo_alterado': self.campo_alterado,
            'valor_antigo': self.valor_antigo,
            'valor_novo': self.valor_novo,
            'data_alteracao': self.data_alteracao.isoformat() if self.data_alteracao else None,
            'usuario_alteracao': self.usuario_alteracao
        }

