import React, { Component } from 'react'
import { ContractData, ContractForm } from 'drizzle-react-components'
import { Input, Form, Button } from 'semantic-ui-react'

import './buysell.css'

class BuySell extends Component {
  constructor(props) {
    super(props)
    this.state = {
      loading: false,
      price: '',
      amount_0: '',
      amount_1: ''
    }

    this.handleSubmit = this.handleSubmit.bind(this)
    this.handleChange = this.handleChange.bind(this)
  }


  handleSubmit(e) {
    e.preventDefault()
    this.setState({loading: true})

    var data = {
      price: this.state.price,
      amount_0: this.state.amount_0,
      amount_1: this.state.amount_1
    }

    console.log(data)
    this.setState({ loading: false, price: '', amount_0: '', amount_1: '' })
  }

  handleChange(name, event) {
    var value = event.target.value
    if(name === "amount_0") {
      var amount_1_val = this.state.price * value
      this.setState({ amount_0: value, amount_1: amount_1_val })
    }
    if(name === "amount_1") {
      var amount_0_val = value / this.state.price
      this.setState({ amount_1: value, amount_0: amount_0_val })
    }
    if(name === "price") {
      if(this.state.amount_0 !== "") {
        var amount_1_val = value * this.state.amount_0
        this.setState({ price: value, amount_1: amount_1_val })
      } else {
        this.setState({ price: value })
      }
    }
  }

  componentWillMount() {
  }

  render() {
    var { price, amount_0, amount_1 } = this.state
    var { currencies } = this.props

    return (
      <div className="BuySell">
        <Form onSubmit={this.handleSubmit} size='tiny'>
          <div className="BuySell-headers">Price</div>
          <Form.Field>
            <Input
              label={{ basic: true, content: currencies[1] + " / " + currencies[0]  }}
              labelPosition='right'
              placeholder='Enter Price...'
              onChange={(e) => { this.handleChange('price', e) }}
            />
          </Form.Field>
          <div className="BuySell-headers">Amounts</div>
          <Form.Group widths='equal'>
            <Form.Field>
              <Input
                label={{ basic: true, content: currencies[0] }}
                labelPosition='right'
                placeholder='Enter Amount...'
                disabled={price === ''}
                value={amount_0}
                onChange={(e) => { this.handleChange('amount_0', e) }}
              />
            </Form.Field>
            <Form.Field>
              <Input
                label={{ basic: true, content: currencies[1] }}
                labelPosition='right'
                placeholder='Enter Amount...'
                disabled={price === ''}
                value={amount_1}
                onChange={(e) => { this.handleChange('amount_1', e) }}
              />
            </Form.Field>
          </Form.Group>
          <Button className="BuySell-button" color='green' disabled={price === '' || amount_0 === '' || amount_1 === ''} >BUY {currencies[0]}</Button>
          <Button className="BuySell-button" color='red' disabled={price === '' || amount_0 === '' || amount_1 === ''} >SELL {currencies[0]}</Button>
        </Form>
      </div>
    );
  }
}

export default BuySell
