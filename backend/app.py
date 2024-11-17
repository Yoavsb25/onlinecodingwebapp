from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_cors import CORS

# Initialize Flask app
app = Flask(__name__)

# Setup Cross-Origin Resource Sharing (CORS) to allow frontend (React) to make requests
CORS(app)

# Setup SQLite database using SQLAlchemy
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///code_blocks.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Initialize SocketIO
socketio = SocketIO(app)

# Database Model for Code Blocks
class CodeBlock(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    content = db.Column(db.Text, nullable=False)
    solution = db.Column(db.Text, nullable=False)

    def __repr__(self):
        return f'<CodeBlock {self.name}>'

# Create the database tables (if they don't exist yet)
with app.app_context():
    db.create_all()

# Before the first request, populate the database with initial code blocks if empty
@app.before_first_request
def create_initial_code_blocks():
    if not CodeBlock.query.first():
        initial_code_blocks = [
            CodeBlock(name='Async Case', content='// Async code here...', solution='// Solution here...'),
            CodeBlock(name='Promises', content='// Promise code here...', solution='// Solution here...'),
            CodeBlock(name='Array Methods', content='// Array methods here...', solution='// Solution here...'),
            CodeBlock(name='Closure', content='// Closure code here...', solution='// Solution here...')
        ]
        db.session.add_all(initial_code_blocks)
        db.session.commit()

# Route to get the list of code blocks
@app.route('/api/code-blocks', methods=['GET'])
def get_code_blocks():
    code_blocks = CodeBlock.query.all()
    return jsonify({'codeBlocks': [{'id': cb.id, 'name': cb.name} for cb in code_blocks]})

# Route to get a specific code block by ID
@app.route('/api/code-blocks/<int:id>', methods=['GET'])
def get_code_block(id):
    code_block = CodeBlock.query.get_or_404(id)
    return jsonify({
        'id': code_block.id,
        'name': code_block.name,
        'content': code_block.content,
        'solution': code_block.solution
    })

# Socket events for real-time code collaboration
@socketio.on('join')
def on_join(data):
    room = data['room']
    join_room(room)
    emit('user_joined', {'message': 'A new user has joined'}, room=room)

@socketio.on('code_change')
def on_code_change(data):
    room = data['room']
    code = data['code']
    emit('code_update', {'code': code}, room=room)

@socketio.on('disconnect')
def on_disconnect():
    # You could handle user disconnect logic here
    pass

# Socket event for when the mentor leaves the room
@socketio.on('mentor_leave')
def on_mentor_leave(data):
    room = data['room']
    leave_room(room)
    emit('mentor_left', {'message': 'The mentor has left the room'}, room=room)

# Main entry point
if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000)
