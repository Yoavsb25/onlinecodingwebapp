from flask import Flask
from flask_socketio import SocketIO


app = Flask(__name__)
socketio = SocketIO(app)

@app.route('/')
def index():
    return "Flask server is running!"

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000)
