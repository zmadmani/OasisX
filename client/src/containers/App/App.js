import React, { Component } from 'react'
import { HashRouter, Switch, Route } from 'react-router-dom'
import { Responsive } from 'semantic-ui-react'

import './App.css'

import Market from '../market/market'
import Home from '../home/home'
import Navbar from '../navbar/navbar'
import Infobar from '../infobar/infobar'

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
    }
  }

  componentDidMount() {
  }

  render() {
    var { options } = this.props

    return (
      <div className="App">
        <HashRouter>
          <div>
            <Navbar options={options} />
            <div id="App_market_container">
                <Switch>
                  <Route exact path='/' render={() => <Home />} />
                  <Route exact path='/WETH_DAI' render={() => <Market key={'WETH_DAI'} options={options} currencies={['WETH', 'DAI']} />} />
                  <Route exact path='/MKR_WETH' render={() => <Market key={'MKR_WETH'} options={options} currencies={['MKR', 'WETH']} />} />
                  <Route exact path='/MKR_DAI' render={() => <Market  key={'MKR_DAI'} options={options} currencies={['MKR', 'DAI']} />} />
                </Switch>
            </div>
          </div>
        </HashRouter>
        <Responsive minWidth={Responsive.onlyTablet.minWidth}>
          <Infobar padded={true} options={options} />
        </Responsive>
      </div>
    );
  }
}

export default App
