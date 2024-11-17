import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import LobbyPage from './components/LobbyPage';
import CodeBlockPage from './components/CodeBlockPage';

function App() {
  return (
    <Router>
      <Switch>
        <Route exact path="/" component={LobbyPage} />
        <Route path="/code-block/:id" component={CodeBlockPage} />
      </Switch>
    </Router>
  );
}

export default App;
