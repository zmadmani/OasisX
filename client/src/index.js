// Import Major Dependencies
import React from 'react';
import ReactDOM from 'react-dom';
import registerServiceWorker from './registerServiceWorker';

// Import CSS Files
import 'semantic-ui-css/semantic.min.css';
import 'react-virtualized/styles.css'
import './index.css';

// Import App src code
import App from './containers/App/App';

ReactDOM.render(<App />, document.getElementById('root'));
registerServiceWorker();