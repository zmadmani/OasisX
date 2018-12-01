import React, { Component } from 'react'
import { Router, Switch, Route } from 'react-router-dom'
import history from '../../history'

import './App.css'

import Market from '../market/market'
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
      return <div>"Loading Drizzle..."</div>
    }
    else {
      return (
        <div className="App">
          <Navbar drizzle={drizzle} drizzleState={ drizzleState } />
          <div id="App_market_container">
            <Router history={history}>
              <Switch>
                <Route exact path='/WETH_DAI' render={() => <Market drizzle={drizzle} drizzleState={ drizzleState } pair={'WETH_DAI'} />} />
                <Route exact path='/MKR_WETH' render={() => <Market drizzle={drizzle} drizzleState={ drizzleState } pair={'MKR_WETH'} />} />
                <Route exact path='/MKR_DAI' render={() => <Market drizzle={drizzle} drizzleState={ drizzleState } pair={'MKR_DAI'} />} />
              </Switch>
            </Router>
          </div>
          <Infobar drizzle={drizzle} drizzleState={ drizzleState } />
        </div>
      );
    }
  }
}

export default App
