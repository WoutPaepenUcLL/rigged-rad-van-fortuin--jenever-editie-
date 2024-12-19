from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
import os
from .extensions import db, socketio
from .utils import init_default_wheel_items
from .routes import bp

load_dotenv()

def create_app():
    app = Flask(__name__)
    CORS(app)

    print(f"user:{os.getenv('DB_USER')}")
    print(f"pass:{os.getenv('DB_PASSWORD')}")
    print(f"host:{os.getenv('DB_HOST')}")
    print(f"port:{os.getenv('DB_PORT')}")
    print(f"name:{os.getenv('DB_NAME')}")
    
    # Database configuration
    app.config['SQLALCHEMY_DATABASE_URI'] = f"postgresql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}"
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Initialize extensions
    db.init_app(app)
    socketio.init_app(app, cors_allowed_origins="*")  # Allow connections from any origin

    # Create tables and initialize default wheel items
    with app.app_context():
        db.create_all()
        init_default_wheel_items(db)

    app.register_blueprint(bp)

    return app