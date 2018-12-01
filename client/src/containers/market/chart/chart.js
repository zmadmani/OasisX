import React, { Component } from 'react'
import { ContractData, ContractForm } from 'drizzle-react-components'
import { Image } from 'semantic-ui-react'

import chart from '../../../images/chart-placeholder.png'

import './chart.css'

class Chart extends Component {
  constructor(props) {
    super(props)
    this.state = {
    }
  }

  componentWillMount() {
  }

  render() {
    return (
      <div className="Chart">
      <Image src={chart} fluid />
      </div>
    );
  }
}

export default Chart
