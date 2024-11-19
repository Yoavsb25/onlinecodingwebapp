from datetime import datetime
from typing import Dict, List, Optional, Union, TypedDict
from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_cors import CORS
from dataclasses import dataclass
from dotenv import load_dotenv
import os
import logging
import logging.config
from functools import wraps

# Load environment variables
load_dotenv()


# Custom Types
class RoomData(TypedDict):
    room: str
    code: Optional[str]


class CodeBlockData(TypedDict):
    id: int
    name: str
    content: str
    solution: str


# Configuration class
class Config:
    """Application configuration class"""
    REQUIRED_ENV_VARS = ['DATABASE_URL', 'FRONTEND_URL']

    @staticmethod
    def validate_env() -> None:
        """Validate required environment variables"""
        missing_vars = [var for var in Config.REQUIRED_ENV_VARS if not os.getenv(var)]
        if missing_vars:
            raise EnvironmentError(f"Missing required environment variables: {', '.join(missing_vars)}")

    @staticmethod
    def get_database_url() -> str:
        return os.getenv('DATABASE_URL', 'sqlite:///code_blocks.db')

    @staticmethod
    def get_frontend_url() -> str:
        return os.getenv('FRONTEND_URL', 'http://localhost:3000')


# Logging configuration
LOGGING_CONFIG = {
    'version': 1,
    'formatters': {
        'default': {
            'format': '[%(asctime)s] %(levelname)s in %(module)s: %(message)s',
        }
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'default',
            'level': 'DEBUG',
        },
        'file': {
            'class': 'logging.FileHandler',
            'filename': 'app.log',
            'formatter': 'default',
            'level': 'INFO',
        }
    },
    'root': {
        'level': 'INFO',
        'handlers': ['console', 'file']
    }
}

# Initialize logging
logging.config.dictConfig(LOGGING_CONFIG)
logger = logging.getLogger(__name__)


# Initialize Flask app
def create_app() -> Flask:
    """Create and configure the Flask application"""
    app = Flask(__name__)

    # Validate environment variables
    Config.validate_env()

    # Configure app
    app.config['SQLALCHEMY_DATABASE_URI'] = Config.get_database_url()
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Setup CORS
    CORS(app, resources={
        r"/api/*": {"origins": Config.get_frontend_url()},
        r"/socket.io/*": {"origins": Config.get_frontend_url()}
    })

    return app


app = create_app()
db = SQLAlchemy(app)
socketio = SocketIO(app, cors_allowed_origins='*')

# Global state for room management
active_rooms: Dict[str, Dict[str, Union[str, List[str]]]] = {}


# Database Models
@dataclass
class CodeBlock(db.Model):
    """Code block model with data validation"""
    id: int = db.Column(db.Integer, primary_key=True)
    name: str = db.Column(db.String(100), nullable=False)
    content: str = db.Column(db.Text, nullable=False)
    solution: str = db.Column(db.Text, nullable=False)
    created_at: datetime = db.Column(db.DateTime, server_default=db.func.now())
    updated_at: datetime = db.Column(db.DateTime, server_default=db.func.now(), onupdate=db.func.now())

    def to_dict(self) -> Dict:
        """Convert model to dictionary"""
        return {
            'id': self.id,
            'name': self.name,
            'content': self.content,
            'solution': self.solution,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


# Error Handling
class APIError(Exception):
    """Base API Error class"""

    def __init__(self, message: str, status_code: int, error_type: Optional[str] = None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.error_type = error_type or 'General'


def handle_error(func):
    """Error handling decorator for routes"""

    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except APIError as e:
            logger.error(f"API Error: {e.message} ({e.error_type})")
            return jsonify({'error': e.message}), e.status_code
        except Exception as e:
            logger.error(f"Unexpected error: {str(e)}")
            return jsonify({'error': 'Internal server error'}), 500

    return wrapper


# Database Operations
class DatabaseOperations:
    """Database operation handlers"""

    @staticmethod
    def initialize_database() -> None:
        """Initialize database and create initial code blocks"""
        with app.app_context():
            if not CodeBlock.query.first():  # Only drop and create if no code blocks exist
                db.drop_all()
                db.create_all()
                DatabaseOperations.create_initial_code_blocks()

    @staticmethod
    def create_initial_code_blocks() -> None:
        """Create initial code block examples"""
        initial_blocks = [
            {
                'name': 'Async Case',
                'content': '// Write an async function that fetches user data\n\nasync function fetchUserData(userId) {\n  // Your code here\n}',
                'solution': 'async function fetchUserData(userId) {\n  try {\n    const response = await fetch(`/api/users/${userId}`);\n    const data = await response.json();\n    return data;\n  } catch (error) {\n    console.error("Error fetching user data:", error);\n    throw error;\n  }\n}'
            },
            {
                'name': 'Promises',
                'content': '// Chain three promises together\n\nfunction chainPromises() {\n  // Your code here\n}',
                'solution': 'function chainPromises() {\n  return Promise.resolve(1)\n    .then(value => value + 1)\n    .then(value => value * 2)\n    .then(value => `Final value: ${value}`)\n    .catch(error => console.error(error));\n}'
            },
            {
                'name': 'Array Methods',
                'content': '// Transform this array using map and filter\nconst numbers = [1, 2, 3, 4, 5, 6];\n\n// Your code here',
                'solution': 'const numbers = [1, 2, 3, 4, 5, 6];\nconst result = numbers\n  .filter(num => num % 2 === 0)\n  .map(num => num * 2);'
            },
            {
                'name': 'Closure',
                'content': '// Create a counter using closure\n\nfunction createCounter() {\n  // Your code here\n}',
                'solution': 'function createCounter() {\n  let count = 0;\n  return {\n    increment: () => ++count,\n    decrement: () => --count,\n    getCount: () => count\n  };\n}'
            }
        ]

        try:
            for block_data in initial_blocks:
                block = CodeBlock(**block_data)
                db.session.add(block)
            db.session.commit()
            logger.info("Initial code blocks created successfully")
        except Exception as e:
            logger.error(f"Error creating initial code blocks: {str(e)}")
            db.session.rollback()
            raise APIError("Failed to create initial code blocks", 500)


# Routes
@app.route('/')
@handle_error
def index():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'message': 'API is running'}), 200


@app.route('/api/code-blocks', methods=['GET'])
@handle_error
def get_code_blocks():
    """Get all code blocks"""
    code_blocks = CodeBlock.query.all()
    return jsonify({
        'codeBlocks': [{'id': cb.id, 'name': cb.name} for cb in code_blocks]
    })


@app.route('/api/code-blocks/<int:id>', methods=['GET'])
@handle_error
def get_code_block(id: int):
    """Get specific code block by ID"""
    code_block = CodeBlock.query.get(id)
    if not code_block:
        raise APIError(f"Code block {id} not found", 404)
    return jsonify(code_block.to_dict())


# Socket Events Handler
class SocketEventHandler:
    """Socket event handling class"""

    @staticmethod
    @socketio.on('connect')
    def handle_connect() -> None:
        """Handle client connection"""
        logger.info(f"Client connected: {request.sid}")

    @staticmethod
    @socketio.on('disconnect')
    def handle_disconnect() -> None:
        """Handle client disconnection"""
        logger.info(f"Client disconnected: {request.sid}")
        # Cleanup any rooms this user was in
        for room, data in active_rooms.items():
            if request.sid in data['students']:
                data['students'].remove(request.sid)
            if data['mentor'] == request.sid:
                data['mentor'] = None  # Reassign mentor logic can be added here
            emit('user_count_update', {'count': len(data['students'])}, room=room)

    @staticmethod
    @socketio.on('join')
    def handle_join(data: RoomData) -> None:
        """Handle a user joining a room"""
        room = data.get('room')
        if room not in active_rooms:
            active_rooms[room] = {'mentor': request.sid, 'students': []}
        else:
            active_rooms[room]['students'].append(request.sid)

        join_room(room)
        logger.info(f"User {request.sid} joined room {room}")
        emit('user_count_update', {'count': len(active_rooms[room]['students'])}, room=room)

    @staticmethod
    @socketio.on('leave')
    def handle_leave(data: RoomData) -> None:
        """Handle a user leaving a room"""
        room = data.get('room')
        if room in active_rooms:
            if request.sid in active_rooms[room]['students']:
                active_rooms[room]['students'].remove(request.sid)
            if active_rooms[room]['mentor'] == request.sid:
                active_rooms[room]['mentor'] = None
            leave_room(room)
            logger.info(f"User {request.sid} left room {room}")
            emit('user_count_update', {'count': len(active_rooms[room]['students'])}, room=room)

    @staticmethod
    @socketio.on('code_change')
    def handle_code_change(data: RoomData) -> None:
        """Handle real-time code changes"""
        room = data.get('room')
        code = data.get('code')
        solution = 'some_solution'  # You can fetch solution from DB for actual comparison

        if code == solution:
            emit('solution_matched', {'message': '😊'}, room=room)
        else:
            emit('code_update', {'code': code}, room=room, include_sender=False)


if __name__ == '__main__':
    DatabaseOperations.initialize_database()
    socketio.run(app, debug=True)
