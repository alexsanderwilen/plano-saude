from flask import Blueprint, request, jsonify, make_response
from flask_cors import cross_origin
from src.models.beneficiario import Beneficiario, HistoricoBeneficiario
from src.database.database import db
from src.schemas.beneficiario_schema import (
    beneficiario_schema, beneficiarios_schema, 
    historico_beneficiario_schema, historicos_beneficiario_schema
)
from marshmallow import ValidationError
from sqlalchemy import or_, and_
from datetime import datetime
import csv
import io
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle
from reportlab.pdfgen import canvas

beneficiario_bp = Blueprint('beneficiario', __name__)

def registrar_historico(beneficiario_id, campo, valor_antigo, valor_novo, usuario='Sistema'):
    """Registra uma alteração no histórico do beneficiário"""
    historico = HistoricoBeneficiario(
        beneficiario_id=beneficiario_id,
        campo_alterado=campo,
        valor_antigo=str(valor_antigo) if valor_antigo is not None else None,
        valor_novo=str(valor_novo) if valor_novo is not None else None,
        usuario_alteracao=usuario
    )
    db.session.add(historico)

@beneficiario_bp.route('/beneficiarios', methods=['GET'])
@cross_origin()
def get_beneficiarios():
    """Lista beneficiários com filtros opcionais"""
    try:
        # Parâmetros de filtro
        nome = request.args.get('nome', '')
        cpf = request.args.get('cpf', '')
        matricula = request.args.get('matricula', '')
        plano = request.args.get('plano', '')
        situacao = request.args.get('situacao', '')
        tipo = request.args.get('tipo', '')
        
        # Parâmetros de paginação
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        # Query base (apenas beneficiários ativos)
        query = Beneficiario.query.filter_by(ativo=True)
        
        # Aplicar filtros
        if nome:
            query = query.filter(Beneficiario.nome_completo.ilike(f'%{nome}%'))
        if cpf:
            query = query.filter(Beneficiario.cpf.like(f'%{cpf}%'))
        if matricula:
            query = query.filter(Beneficiario.matricula.like(f'%{matricula}%'))
        if plano:
            query = query.filter(Beneficiario.plano_saude_vinculado.ilike(f'%{plano}%'))
        if situacao:
            query = query.filter(Beneficiario.situacao_cadastral == situacao)
        if tipo:
            query = query.filter(Beneficiario.tipo_beneficiario == tipo)
        
        # Paginação
        beneficiarios_paginados = query.order_by(Beneficiario.nome_completo).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'beneficiarios': beneficiarios_schema.dump(beneficiarios_paginados.items),
            'total': beneficiarios_paginados.total,
            'pages': beneficiarios_paginados.pages,
            'current_page': page,
            'per_page': per_page
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@beneficiario_bp.route('/beneficiarios', methods=['POST'])
@cross_origin()
def create_beneficiario():
    """Cria um novo beneficiário"""
    try:
        # Validar dados de entrada
        result = beneficiario_schema.load(request.json)
        
        # Verificar se CPF já existe para titular
        if result['tipo_beneficiario'] == 'Titular':
            cpf_existente = Beneficiario.query.filter_by(
                cpf=result['cpf'],
                tipo_beneficiario='Titular',
                ativo=True
            ).first()
            if cpf_existente:
                return jsonify({'error': 'CPF já cadastrado como titular'}), 400
        
        # Verificar se dependente tem titular válido
        if result['tipo_beneficiario'] == 'Dependente':
            if not result.get('id_titular'):
                return jsonify({'error': 'Dependente deve ter um titular vinculado'}), 400
            
            titular = Beneficiario.query.filter_by(
                id=result['id_titular'], 
                tipo_beneficiario='Titular',
                ativo=True
            ).first()
            if not titular:
                return jsonify({'error': 'Titular não encontrado ou inativo'}), 400
            
            if not result.get('grau_parentesco'):
                return jsonify({'error': 'Grau de parentesco é obrigatório para dependentes'}), 400
        
        # Criar beneficiário
        beneficiario = Beneficiario(**result)
        db.session.add(beneficiario)
        db.session.flush()  # Para obter o ID
        
        # Registrar no histórico
        registrar_historico(beneficiario.id, 'CRIACAO', None, 'Beneficiário criado')
        
        db.session.commit()
        
        return jsonify(beneficiario_schema.dump(beneficiario)), 201
        
    except ValidationError as e:
        return jsonify({'error': 'Dados inválidos', 'details': e.messages}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@beneficiario_bp.route('/beneficiarios/<int:beneficiario_id>', methods=['GET'])
@cross_origin()
def get_beneficiario(beneficiario_id):
    """Obtém um beneficiário específico"""
    try:
        beneficiario = Beneficiario.query.filter_by(id=beneficiario_id, ativo=True).first()
        if not beneficiario:
            return jsonify({'error': 'Beneficiário não encontrado'}), 404
        
        return jsonify(beneficiario_schema.dump(beneficiario))
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@beneficiario_bp.route('/beneficiarios/<int:beneficiario_id>', methods=['PUT'])
@cross_origin()
def update_beneficiario(beneficiario_id):
    """Atualiza um beneficiário existente"""
    try:
        beneficiario = Beneficiario.query.filter_by(id=beneficiario_id, ativo=True).first()
        if not beneficiario:
            return jsonify({'error': 'Beneficiário não encontrado'}), 404
        
        # Validar dados de entrada
        result = beneficiario_schema.load(request.json, partial=True)
        
        # Verificar alterações e registrar histórico
        for campo, novo_valor in result.items():
            valor_antigo = getattr(beneficiario, campo)
            if valor_antigo != novo_valor:
                registrar_historico(beneficiario_id, campo, valor_antigo, novo_valor)
                setattr(beneficiario, campo, novo_valor)
        
        beneficiario.data_atualizacao = datetime.utcnow()
        db.session.commit()
        
        return jsonify(beneficiario_schema.dump(beneficiario))
        
    except ValidationError as e:
        return jsonify({'error': 'Dados inválidos', 'details': e.messages}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@beneficiario_bp.route('/beneficiarios/<int:beneficiario_id>', methods=['DELETE'])
@cross_origin()
def delete_beneficiario(beneficiario_id):
    """Exclui um beneficiário (exclusão lógica)"""
    try:
        beneficiario = Beneficiario.query.filter_by(id=beneficiario_id, ativo=True).first()
        if not beneficiario:
            return jsonify({'error': 'Beneficiário não encontrado'}), 404
        
        # Verificar se é titular com dependentes ativos
        if beneficiario.tipo_beneficiario == 'Titular':
            dependentes_ativos = Beneficiario.query.filter_by(
                id_titular=beneficiario_id, ativo=True
            ).count()
            if dependentes_ativos > 0:
                return jsonify({
                    'error': 'Não é possível excluir titular com dependentes ativos'
                }), 400
        
        # Exclusão lógica
        beneficiario.ativo = False
        beneficiario.situacao_cadastral = 'Inativo'
        beneficiario.data_atualizacao = datetime.utcnow()
        
        # Registrar no histórico
        registrar_historico(beneficiario_id, 'EXCLUSAO', 'Ativo', 'Inativo')
        
        db.session.commit()
        
        return '', 204
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@beneficiario_bp.route('/beneficiarios/<int:beneficiario_id>/historico', methods=['GET'])
@cross_origin()
def get_historico_beneficiario(beneficiario_id):
    """Obtém o histórico de alterações de um beneficiário"""
    try:
        beneficiario = Beneficiario.query.filter_by(id=beneficiario_id).first()
        if not beneficiario:
            return jsonify({'error': 'Beneficiário não encontrado'}), 404
        
        historico = HistoricoBeneficiario.query.filter_by(
            beneficiario_id=beneficiario_id
        ).order_by(HistoricoBeneficiario.data_alteracao.desc()).all()
        
        return jsonify(historicos_beneficiario_schema.dump(historico))
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@beneficiario_bp.route('/beneficiarios/export/pdf', methods=['GET'])
@cross_origin()
def export_beneficiarios_pdf():
    """Exporta beneficiários para PDF"""
    try:
        # Aplicar os mesmos filtros da listagem
        nome = request.args.get('nome', '')
        cpf = request.args.get('cpf', '')
        matricula = request.args.get('matricula', '')
        plano = request.args.get('plano', '')
        situacao = request.args.get('situacao', '')
        tipo = request.args.get('tipo', '')
        
        query = Beneficiario.query.filter_by(ativo=True)
        
        if nome:
            query = query.filter(Beneficiario.nome_completo.ilike(f'%{nome}%'))
        if cpf:
            query = query.filter(Beneficiario.cpf.like(f'%{cpf}%'))
        if matricula:
            query = query.filter(Beneficiario.matricula.like(f'%{matricula}%'))
        if plano:
            query = query.filter(Beneficiario.plano_saude_vinculado.ilike(f'%{plano}%'))
        if situacao:
            query = query.filter(Beneficiario.situacao_cadastral == situacao)
        if tipo:
            query = query.filter(Beneficiario.tipo_beneficiario == tipo)
        
        beneficiarios = query.order_by(Beneficiario.nome_completo).all()
        
        # Criar PDF
        buffer = io.BytesIO()
        p = canvas.Canvas(buffer, pagesize=letter)
        
        # Cabeçalho
        p.drawString(100, 800, "Relatório de Beneficiários")
        
        # Tabela de dados
        data = [[
            'Matrícula', 'Nome Completo', 'CPF', 'Plano de Saúde', 'Situação'
        ]]
        for b in beneficiarios:
            data.append([
                b.matricula, b.nome_completo, b.cpf, b.plano_saude_vinculado, b.situacao_cadastral
            ])
        
        table = Table(data)
        table.wrapOn(p, 700, 500)
        table.drawOn(p, 100, 750)
        
        p.showPage()
        p.save()
        
        buffer.seek(0)
        
        response = make_response(buffer.getvalue())
        response.headers['Content-Type'] = 'application/pdf'
        response.headers['Content-Disposition'] = f'attachment; filename=beneficiarios_{datetime.now().strftime("%Y%m%d_%H%M%S")}.pdf'
        
        return response
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@beneficiario_bp.route('/beneficiarios/export/csv', methods=['GET'])
@cross_origin()
def export_beneficiarios_csv():
    """Exporta beneficiários para CSV"""
    try:
        # Aplicar os mesmos filtros da listagem
        nome = request.args.get('nome', '')
        cpf = request.args.get('cpf', '')
        matricula = request.args.get('matricula', '')
        plano = request.args.get('plano', '')
        situacao = request.args.get('situacao', '')
        tipo = request.args.get('tipo', '')
        
        query = Beneficiario.query.filter_by(ativo=True)
        
        if nome:
            query = query.filter(Beneficiario.nome_completo.ilike(f'%{nome}%'))
        if cpf:
            query = query.filter(Beneficiario.cpf.like(f'%{cpf}%'))
        if matricula:
            query = query.filter(Beneficiario.matricula.like(f'%{matricula}%'))
        if plano:
            query = query.filter(Beneficiario.plano_saude_vinculado.ilike(f'%{plano}%'))
        if situacao:
            query = query.filter(Beneficiario.situacao_cadastral == situacao)
        if tipo:
            query = query.filter(Beneficiario.tipo_beneficiario == tipo)
        
        beneficiarios = query.order_by(Beneficiario.nome_completo).all()
        
        # Criar CSV
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Cabeçalho
        writer.writerow([
            'Matrícula', 'Nome Completo', 'CPF', 'Data Nascimento', 'Sexo',
            'Telefone Celular', 'Email', 'Plano de Saúde', 'Situação',
            'Tipo Beneficiário', 'Data Criação'
        ])
        
        # Dados
        for beneficiario in beneficiarios:
            writer.writerow([
                beneficiario.matricula,
                beneficiario.nome_completo,
                beneficiario.cpf,
                beneficiario.data_nascimento.strftime('%d/%m/%Y') if beneficiario.data_nascimento else '',
                beneficiario.sexo,
                beneficiario.telefone_celular,
                beneficiario.email,
                beneficiario.plano_saude_vinculado,
                beneficiario.situacao_cadastral,
                beneficiario.tipo_beneficiario,
                beneficiario.data_criacao.strftime('%d/%m/%Y %H:%M') if beneficiario.data_criacao else ''
            ])
        
        # Preparar resposta
        output.seek(0)
        response = make_response(output.getvalue())
        response.headers['Content-Type'] = 'text/csv'
        response.headers['Content-Disposition'] = f'attachment; filename=beneficiarios_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
        
        return response
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

