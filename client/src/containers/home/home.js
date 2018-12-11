import React, { Component } from 'react'
import { Transition } from 'semantic-ui-react'
import './home.css'

class Home extends Component {
  constructor(props) {
    super(props)
    this.state = {
    }
  }

  componentDidMount() {

  }

  componentDidUpdate() {
  }

  render() {
    return (
      <div id="Home">
        <Transition transitionOnMount={true} animation='fade up' duration={1500}>
          <div id="Home-title">
            OasisX
          </div>
        </Transition>
        <Transition transitionOnMount={true} animation='fade up' duration={3500}>
          <div id="Home-subtitle">
            The fastest UI for Oasis.
          </div>
        </Transition>
      </div>
    )
  }
}

export default Home;