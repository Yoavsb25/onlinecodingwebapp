from flask import Flask, jsonify, request, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_cors import CORS
from dotenv import load_dotenv
import os
import logging

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# Setup logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Setup Cross-Origin Resource Sharing (CORS)
CORS(app, resources={
    r"/api/*": {"origins": os.getenv('FRONTEND_URL', 'http://localhost:3000')},
    r"/socket.io/*": {"origins": os.getenv('FRONTEND_URL', 'http://localhost:3000')}
})

# Setup SQLite database
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///code_blocks.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Initialize SocketIO with CORS
socketio = SocketIO(app, cors_allowed_origins=os.getenv('FRONTEND_URL', 'http://localhost:3000'))

# Database Model
class CodeBlock(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    content = db.Column(db.Text, nullable=False)
    solution = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(db.DateTime, server_default=db.func.now(), onupdate=db.func.now())

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'content': self.content,
            'solution': self.solution
        }

# Initial code blocks
def create_initial_code_blocks():
    try:
        if not CodeBlock.query.first():
            initial_code_blocks = [
                CodeBlock(
                    name='Async Case',
                    content='// Write an async function that fetches user data\n\nasync function fetchUserData(userId) {\n  // Your code here\n}',
                    solution='async function fetchUserData(userId) {\n  try {\n    const response = await fetch(`/api/users/${userId}`);\n    const data = await response.json();\n    return data;\n  } catch (error) {\n    console.error("Error fetching user data:", error);\n    throw error;\n  }\n}'
                ),
                CodeBlock(
                    name='Promises',
                    content='// Chain three promises together\n\nfunction chainPromises() {\n  // Your code here\n}',
                    solution='function chainPromises() {\n  return Promise.resolve(1)\n    .then(value => value + 1)\n    .then(value => value * 2)\n    .then(value => `Final value: ${value}`)\n    .catch(error => console.error(error));\n}'
                ),
                CodeBlock(
                    name='Array Methods',
                    content='// Transform this array using map and filter\nconst numbers = [1, 2, 3, 4, 5, 6];\n\n// Your code here',
                    solution='const numbers = [1, 2, 3, 4, 5, 6];\nconst result = numbers\n  .filter(num => num % 2 === 0)\n  .map(num => num * 2);'
                ),
                CodeBlock(
                    name='Closure',
                    content='// Create a counter using closure\n\nfunction createCounter() {\n  // Your code here\n}',
                    solution='function createCounter() {\n  let count = 0;\n  return {\n    increment: () => ++count,\n    decrement: () => --count,\n    getCount: () => count\n  };\n}'
                )
            ]
            db.session.add_all(initial_code_blocks)
            db.session.commit()
            logger.info("Initial code blocks created successfully")
    except Exception as e:
        logger.error(f"Error creating initial code blocks: {str(e)}")
        db.session.rollback()

# Error handler
@app.errorhandler(Exception)
def handle_error(error):
    logger.error(f"An error occurred: {str(error)}")
    return jsonify({'error': str(error)}), 500

# Routes
@app.route('/')
def index():
    return jsonify({'message': 'Welcome to the API'}), 200

@app.route('/api/code-blocks', methods=['GET'])
def get_code_blocks():
    try:
        code_blocks = CodeBlock.query.all()
        return jsonify({
            'codeBlocks': [{'id': cb.id, 'name': cb.name} for cb in code_blocks]
        })
    except Exception as e:
        logger.error(f"Error fetching code blocks: {str(e)}")
        return jsonify({'error': 'Failed to fetch code blocks'}), 500

@app.route('/api/code-blocks/<int:id>', methods=['GET'])
def get_code_block(id):
    try:
        code_block = CodeBlock.query.get_or_404(id)
        return jsonify(code_block.to_dict())
    except Exception as e:
        logger.error(f"Error fetching code block {id}: {str(e)}")
        return jsonify({'error': f'Code block {id} not found'}), 404

# Socket events
@socketio.on('connect')
def handle_connect():
    logger.info(f"Client connected: {request.sid}")

@socketio.on('disconnect')
def handle_disconnect():
    logger.info(f"Client disconnected: {request.sid}")

@socketio.on('join')
def on_join(data):
    try:
        room = data['room']
        join_room(room)
        logger.info(f"User {request.sid} joined room: {room}")
        emit('user_joined', {'message': 'A new user has joined'}, room=room)
    except Exception as e:
        logger.error(f"Error in join event: {str(e)}")

@socketio.on('code_change')
def on_code_change(data):
    try:
        room = data['room']
        code = data['code']
        emit('code_update', {'code': code}, room=room, include_sender=False)
    except Exception as e:
        logger.error(f"Error in code_change event: {str(e)}")

@socketio.on('leave')
def on_leave(data):
    try:
        room = data['room']
        leave_room(room)
        logger.info(f"User {request.sid} left room: {room}")
        emit('user_left', {'message': 'A user has left'}, room=room)
    except Exception as e:
        logger.error(f"Error in leave event: {str(e)}")

# Initialize database and create initial code blocks
with app.app_context():
    db.drop_all()
    db.create_all()
    create_initial_code_blocks()

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    socketio.run(app, host='0.0.0.0', port=port, debug=os.getenv('FLASK_DEBUG', 'False').lower() == 'true')
