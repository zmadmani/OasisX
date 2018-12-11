import React, { Component } from 'react'
import { Router, Switch, Route } from 'react-router-dom'
import history from '../../history'

import './App.css'

import Market from '../market/market'
import Home from '../home/home'
import Navbar from '../navbar/navbar'
import Infobar from '../infobar/infobar'

class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      loading: true,
      drizzleState: null
    }
  }

  componentDidMount() {
    const { drizzle } = this.props

    // Subscribe to changes in the store and assign to unsubscribe for later release
    this.unsubscribe = drizzle.store.subscribe(() => {

      // Every time the store updates we update the state and pass it to all the children
      const drizzleState = drizzle.store.getState()

      // If the entire setup is initialized then we update local component states
      if(drizzleState.drizzleStatus.initialized) {
        this.setState({ loading: false, drizzleState })
      }
    })
  }

  componentWillUnmount() {
    this.unsubscribe()
  }

  render() {
    var { loading, drizzleState } = this.state
    var { drizzle } = this.props

    if(loading) {
      return <div id="App-loading-screen">Connecting to Ethereum...</div>
    }
    else {
      return (
        <div className="App">
          <Router history={history}>
            <div>
              <Navbar drizzle={drizzle} drizzleState={ drizzleState } />
              <div id="App_market_container">
                  <Switch>
                    <Route exact path='/' render={() => <Home drizzle={drizzle} drizzleState={ drizzleState } />} />
                    <Route exact path='/WETH_DAI' render={() => <Market key={'WETH_DAI'} drizzle={drizzle} drizzleState={ drizzleState } pair={'WETH_DAI'} />} />
                    <Route exact path='/MKR_WETH' render={() => <Market key={'MKR_WETH'} drizzle={drizzle} drizzleState={ drizzleState } pair={'MKR_WETH'} />} />
                    <Route exact path='/MKR_DAI' render={() => <Market  key={'MKR_DAI'} drizzle={drizzle} drizzleState={ drizzleState } pair={'MKR_DAI'} />} />
                  </Switch>
              </div>
            </div>
          </Router>
          <Infobar drizzle={drizzle} drizzleState={ drizzleState } />
        </div>
      );
    }
  }
}

export default App
