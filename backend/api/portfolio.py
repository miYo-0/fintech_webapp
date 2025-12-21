"""Portfolio API endpoints."""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db
from models.portfolio import Portfolio, Position, Transaction
from models.stock import Stock
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

portfolio_bp = Blueprint('portfolio', __name__, url_prefix='/api/portfolio')


@portfolio_bp.route('/', methods=['GET'])
@jwt_required()
def list_portfolios():
    """List all user portfolios."""
    try:
        user_id = get_jwt_identity()
        portfolios = Portfolio.query.filter_by(user_id=user_id).all()
        
        return jsonify({
            'portfolios': [p.to_dict(include_stats=True) for p in portfolios]
        }), 200
        
    except Exception as e:
        logger.error(f"List portfolios error: {e}")
        return jsonify({'error': 'Failed to list portfolios'}), 500


@portfolio_bp.route('/', methods=['POST'])
@jwt_required()
def create_portfolio():
    """Create a new portfolio."""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data.get('name'):
            return jsonify({'error': 'Portfolio name required'}), 400
        
        # Create portfolio
        portfolio = Portfolio(
            user_id=user_id,
            name=data['name'],
            description=data.get('description'),
            currency=data.get('currency', 'USD')
        )
        
        db.session.add(portfolio)
        db.session.commit()
        
        return jsonify({
            'message': 'Portfolio created',
            'portfolio': portfolio.to_dict()
        }), 201
        
    except Exception as e:
        logger.error(f"Create portfolio error: {e}")
        db.session.rollback()
        return jsonify({'error': 'Failed to create portfolio'}), 500


@portfolio_bp.route('/<int:portfolio_id>', methods=['GET'])
@jwt_required()
def get_portfolio(portfolio_id):
    """Get portfolio details."""
    try:
        user_id = get_jwt_identity()
        portfolio = Portfolio.query.filter_by(id=portfolio_id, user_id=user_id).first()
        
        if not portfolio:
            return jsonify({'error': 'Portfolio not found'}), 404
        
        return jsonify({
            'portfolio': portfolio.to_dict(include_positions=True, include_stats=True)
        }), 200
        
    except Exception as e:
        logger.error(f"Get portfolio error: {e}")
        return jsonify({'error': 'Failed to get portfolio'}), 500


@portfolio_bp.route('/<int:portfolio_id>/positions', methods=['POST'])
@jwt_required()
def add_position(portfolio_id):
    """Add or update a position in portfolio."""
    try:
        user_id = get_jwt_identity()
        portfolio = Portfolio.query.filter_by(id=portfolio_id, user_id=user_id).first()
        
        if not portfolio:
            return jsonify({'error': 'Portfolio not found'}), 404
        
        data = request.get_json()
        
        # Validate required fields
        if not all(k in data for k in ['symbol', 'quantity', 'price']):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Get or create stock
        stock = Stock.query.filter_by(symbol=data['symbol'].upper()).first()
        if not stock:
            return jsonify({'error': 'Stock not found'}), 404
        
        # Create transaction
        transaction = Transaction(
            portfolio_id=portfolio.id,
            stock_id=stock.id,
            transaction_type='BUY',
            quantity=float(data['quantity']),
            price=float(data['price']),
            fees=float(data.get('fees', 0)),
            notes=data.get('notes'),
            transaction_date=datetime.fromisoformat(data['transaction_date']) if 'transaction_date' in data else datetime.utcnow()
        )
        
        db.session.add(transaction)
        
        # Update or create position
        position = Position.query.filter_by(
            portfolio_id=portfolio.id,
            stock_id=stock.id
        ).first()
        
        if position:
            # Update average price and quantity
            total_cost = (position.quantity * position.average_price) + (transaction.quantity * transaction.price)
            new_quantity = position.quantity + transaction.quantity
            position.average_price = total_cost / new_quantity if new_quantity > 0 else 0
            position.quantity = new_quantity
        else:
            # Create new position
            position = Position(
                portfolio_id=portfolio.id,
                stock_id=stock.id,
                quantity=transaction.quantity,
                average_price=transaction.price
            )
            db.session.add(position)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Position added',
            'position': position.to_dict(),
            'transaction': transaction.to_dict()
        }), 201
        
    except Exception as e:
        logger.error(f"Add position error: {e}")
        db.session.rollback()
        return jsonify({'error': 'Failed to add position'}), 500


@portfolio_bp.route('/<int:portfolio_id>/transactions', methods=['GET'])
@jwt_required()
def get_transactions(portfolio_id):
    """Get portfolio transaction history."""
    try:
        user_id = get_jwt_identity()
        portfolio = Portfolio.query.filter_by(id=portfolio_id, user_id=user_id).first()
        
        if not portfolio:
            return jsonify({'error': 'Portfolio not found'}), 404
        
        page = int(request.args.get('page', 1))
        per_page = min(int(request.args.get('per_page', 50)), 100)
        
        pagination = portfolio.transactions.order_by(
            Transaction.transaction_date.desc()
        ).paginate(page=page, per_page=per_page, error_out=False)
        
        transactions = [t.to_dict() for t in pagination.items]
        
        return jsonify({
            'transactions': transactions,
            'total': pagination.total,
            'page': page,
            'per_page': per_page,
            'pages': pagination.pages
        }), 200
        
    except Exception as e:
        logger.error(f"Get transactions error: {e}")
        return jsonify({'error': 'Failed to get transactions'}), 500


@portfolio_bp.route('/<int:portfolio_id>', methods=['DELETE'])
@jwt_required()
def delete_portfolio(portfolio_id):
    """Delete a portfolio."""
    try:
        user_id = get_jwt_identity()
        portfolio = Portfolio.query.filter_by(id=portfolio_id, user_id=user_id).first()
        
        if not portfolio:
            return jsonify({'error': 'Portfolio not found'}), 404
        
        db.session.delete(portfolio)
        db.session.commit()
        
        return jsonify({'message': 'Portfolio deleted'}), 200
        
    except Exception as e:
        logger.error(f"Delete portfolio error: {e}")
        db.session.rollback()
        return jsonify({'error': 'Failed to delete portfolio'}), 500
