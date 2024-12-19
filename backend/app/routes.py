from flask import Blueprint, request, jsonify
from sqlalchemy import func
from sqlalchemy.sql import text
from datetime import datetime, timedelta
from .models import db, WheelItem, SpinLog, DrinkCounter
import random
from .extensions import socketio

bp = Blueprint('api', __name__)

@bp.route('/wheel/spin', methods=['POST'])
def spin_wheel():
    wheel_items = WheelItem.query.all()

    if not wheel_items:
        return jsonify({"error": "No wheel items configured"}), 400

    result = random.choices(
        [item.name for item in wheel_items],
        weights=[item.chance for item in wheel_items]
    )[0]

    spin_log = SpinLog(item_name=result, timestamp=datetime.utcnow())
    db.session.add(spin_log)
    db.session.commit()

    return jsonify({"result": result})

@bp.route('/admin/wheel-config', methods=['POST'])
def update_wheel_configuration():
    data = request.get_json()
    if not data or 'items' not in data:
        return jsonify({"error": "Invalid input data"}), 400

    WheelItem.query.delete()

    for item_data in data['items']:
        wheel_item = WheelItem(name=item_data['name'], chance=item_data['chance'])
        db.session.add(wheel_item)

    db.session.commit()
    return jsonify({"message": "Wheel configuration updated successfully"})

@bp.route('/admin/wheel-config', methods=['GET'])
def get_wheel_configuration():
    wheel_items = WheelItem.query.all()
    items = [{"name": item.name, "chance": item.chance} for item in wheel_items]
    return jsonify({"items": items})

@bp.route('/admin/statistics', methods=['GET'])
def get_spin_statistics():
    time_range_str = request.args.get('time_range')
    time_range = None

    if time_range_str:
        try:
            time_range = timedelta(seconds=int(time_range_str))
        except ValueError:
            return jsonify({"error": "Invalid time_range value"}), 400

    query = SpinLog.query

    if time_range:
        cutoff_time = datetime.utcnow() - time_range
        query = query.filter(SpinLog.timestamp >= cutoff_time)

    total_spins = query.count()

    distribution = db.session.query(SpinLog.item_name, func.count(SpinLog.item_name)).group_by(SpinLog.item_name).all()
    distribution_dict = {item_name: count for item_name, count in distribution}

    hourly_stats = db.session.query(func.date_trunc('hour', SpinLog.timestamp).label('hour'), func.count(SpinLog.id).label('count')) \
        .group_by(func.date_trunc('hour', SpinLog.timestamp)) \
        .order_by(func.date_trunc('hour', SpinLog.timestamp)) \
        .all()

    hourly_stats_list = [{"hour": stat.hour.isoformat(), "count": stat.count} for stat in hourly_stats]

    return jsonify({
        "total_spins": total_spins,
        "distribution": distribution_dict,
        "hourly_stats": hourly_stats_list
    })

@bp.route('/drink-counter', methods=['GET'])
def get_drink_count_route():
    counter = DrinkCounter.query.first()
    if not counter:
        counter = DrinkCounter(count=0)
        db.session.add(counter)
        db.session.commit()
    return jsonify({"drink_count": counter.count})

@bp.route('/drink-counter/increment', methods=['POST'])
def increment_drink_count_route():
    counter = DrinkCounter.query.first()
    if not counter:
        counter = DrinkCounter(count=1)
    else:
        counter.count += 1
    db.session.add(counter)
    db.session.commit()

    # Emit the updated count to all connected clients
    socketio.emit('drink_count_update', {'count': counter.count}, namespace='/')

    return jsonify({"drink_count": counter.count})

@bp.route('/drink-counter/reset', methods=['POST'])
def reset_drink_count_route():
    counter = DrinkCounter.query.first()
    if counter:
        counter.count = 0
        db.session.commit()

        # Emit the updated count to all connected clients
        socketio.emit('drink_count_update', {'count': counter.count}, namespace='/')

    return jsonify({"drink_count": 0})

@socketio.on('connect')
def handle_connect():
    print('Client connected')
    counter = DrinkCounter.query.first()
    if counter:
      socketio.emit('drink_count_update', {'count': counter.count}, namespace='/')

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')