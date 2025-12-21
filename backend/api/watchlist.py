"""Watchlist API endpoints."""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db
from models.watchlist import Watchlist, WatchlistItem
from models.stock import Stock
import logging

logger = logging.getLogger(__name__)

watchlist_bp = Blueprint('watchlist', __name__, url_prefix='/api/watchlist')


@watchlist_bp.route('/', methods=['GET'])
@jwt_required()
def list_watchlists():
    """List all user watchlists."""
    try:
        user_id = get_jwt_identity()
        watchlists = Watchlist.query.filter_by(user_id=user_id).all()
        
        return jsonify({
            'watchlists': [w.to_dict() for w in watchlists]
        }), 200
        
    except Exception as e:
        logger.error(f"List watchlists error: {e}")
        return jsonify({'error': 'Failed to list watchlists'}), 500


@watchlist_bp.route('/', methods=['POST'])
@jwt_required()
def create_watchlist():
    """Create a new watchlist."""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data.get('name'):
            return jsonify({'error': 'Watchlist name required'}), 400
        
        watchlist = Watchlist(
            user_id=user_id,
            name=data['name'],
            description=data.get('description')
        )
        
        db.session.add(watchlist)
        db.session.commit()
        
        return jsonify({
            'message': 'Watchlist created',
            'watchlist': watchlist.to_dict()
        }), 201
        
    except Exception as e:
        logger.error(f"Create watchlist error: {e}")
        db.session.rollback()
        return jsonify({'error': 'Failed to create watchlist'}), 500


@watchlist_bp.route('/<int:watchlist_id>', methods=['GET'])
@jwt_required()
def get_watchlist(watchlist_id):
    """Get watchlist details with items."""
    try:
        user_id = get_jwt_identity()
        watchlist = Watchlist.query.filter_by(id=watchlist_id, user_id=user_id).first()
        
        if not watchlist:
            return jsonify({'error': 'Watchlist not found'}), 404
        
        return jsonify({
            'watchlist': watchlist.to_dict(include_items=True)
        }), 200
        
    except Exception as e:
        logger.error(f"Get watchlist error: {e}")
        return jsonify({'error': 'Failed to get watchlist'}), 500


@watchlist_bp.route('/<int:watchlist_id>/items', methods=['POST'])
@jwt_required()
def add_to_watchlist(watchlist_id):
    """Add a stock to watchlist."""
    try:
        user_id = get_jwt_identity()
        watchlist = Watchlist.query.filter_by(id=watchlist_id, user_id=user_id).first()
        
        if not watchlist:
            return jsonify({'error': 'Watchlist not found'}), 404
        
        data = request.get_json()
        
        if not data.get('symbol'):
            return jsonify({'error': 'Stock symbol required'}), 400
        
        # Get or create stock
        stock = Stock.query.filter_by(symbol=data['symbol'].upper()).first()
        if not stock:
            return jsonify({'error': 'Stock not found'}), 404
        
        # Check if already in watchlist
        existing = WatchlistItem.query.filter_by(
            watchlist_id=watchlist.id,
            stock_id=stock.id
        ).first()
        
        if existing:
            return jsonify({'error': 'Stock already in watchlist'}), 409
        
        # Add to watchlist
        item = WatchlistItem(
            watchlist_id=watchlist.id,
            stock_id=stock.id,
            notes=data.get('notes'),
            alert_price_above=data.get('alert_price_above'),
            alert_price_below=data.get('alert_price_below')
        )
        
        db.session.add(item)
        db.session.commit()
        
        return jsonify({
            'message': 'Stock added to watchlist',
            'item': item.to_dict()
        }), 201
        
    except Exception as e:
        logger.error(f"Add to watchlist error: {e}")
        db.session.rollback()
        return jsonify({'error': 'Failed to add stock to watchlist'}), 500


@watchlist_bp.route('/<int:watchlist_id>/items/<int:item_id>', methods=['DELETE'])
@jwt_required()
def remove_from_watchlist(watchlist_id, item_id):
    """Remove a stock from watchlist."""
    try:
        user_id = get_jwt_identity()
        watchlist = Watchlist.query.filter_by(id=watchlist_id, user_id=user_id).first()
        
        if not watchlist:
            return jsonify({'error': 'Watchlist not found'}), 404
        
        item = WatchlistItem.query.filter_by(id=item_id, watchlist_id=watchlist.id).first()
        
        if not item:
            return jsonify({'error': 'Item not found'}), 404
        
        db.session.delete(item)
        db.session.commit()
        
        return jsonify({'message': 'Stock removed from watchlist'}), 200
        
    except Exception as e:
        logger.error(f"Remove from watchlist error: {e}")
        db.session.rollback()
        return jsonify({'error': 'Failed to remove stock'}), 500


@watchlist_bp.route('/<int:watchlist_id>', methods=['DELETE'])
@jwt_required()
def delete_watchlist(watchlist_id):
    """Delete a watchlist."""
    try:
        user_id = get_jwt_identity()
        watchlist = Watchlist.query.filter_by(id=watchlist_id, user_id=user_id).first()
        
        if not watchlist:
            return jsonify({'error': 'Watchlist not found'}), 404
        
        db.session.delete(watchlist)
        db.session.commit()
        
        return jsonify({'message': 'Watchlist deleted'}), 200
        
    except Exception as e:
        logger.error(f"Delete watchlist error: {e}")
        db.session.rollback()
        return jsonify({'error': 'Failed to delete watchlist'}), 500
