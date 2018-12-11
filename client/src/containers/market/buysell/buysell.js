import React, { Component } from 'react'
import { Input, Form, Button } from 'semantic-ui-react'

import './buysell.css'

class BuySell extends Component {
  constructor(props) {
    super(props)
    this.state = {
      loading: false,
      price: '',
      amount_0: '',
      amount_1: '',
      currency_0_key: null,
      currency_1_key: null
    }

    this.handleSubmit = this.handleSubmit.bind(this)
    this.handleChange = this.handleChange.bind(this)
  }

  componentDidMount() {
    var { drizzle, drizzleState, currencies } = this.props

    let account = drizzleState.accounts[0]
    const currency_0_key = drizzle.contracts[currencies[0]].methods.balanceOf.cacheCall(account)
    const currency_1_key = drizzle.contracts[currencies[1]].methods.balanceOf.cacheCall(account)

    this.setState({ currency_0_key, currency_1_key })
  }

  handleSubmit(type) {
    this.setState({loading: true})
    var { currencies, drizzle, drizzleState } = this.props

    const account = drizzleState.accounts[0]
    const web3 = drizzle.web3
    var amount_0 = web3.utils.toWei(this.state.amount_0.toString(), 'ether')
    var amount_1 = web3.utils.toWei(this.state.amount_1.toString(), 'ether')
    var curr_gem_0 = drizzle.contracts[currencies[0]].address
    var curr_gem_1 = drizzle.contracts[currencies[1]].address
    var data = {}

    if(type === "buy") {
      data = {
        pay_amt: amount_1,
        pay_gem: curr_gem_1,
        buy_amt: amount_0,
        buy_gem: curr_gem_0
      }
    } else if(type === "sell") {
      data = {
        pay_amt: amount_0,
        pay_gem: curr_gem_0,
        buy_amt: amount_1,
        buy_gem: curr_gem_1
      }
    } else {
      return
    }

    console.log(data)

    const offer = this.props.drizzle.contracts.Market.methods.offer
    offer.cacheSend(data.pay_amt, data.pay_gem, data.buy_amt, data.buy_gem, 1, {from: account })

    this.setState({ loading: false, price: '', amount_0: '', amount_1: '' })
  }

  handleChange(name, event) {
    var value = event.target.value
    if(name === "amount_0") {
      let amount_1_val = this.state.price * value
      this.setState({ amount_0: value, amount_1: amount_1_val })
    }
    if(name === "amount_1") {
      let amount_0_val = value / this.state.price
      this.setState({ amount_1: value, amount_0: amount_0_val })
    }
    if(name === "price") {
      if(this.state.amount_0 !== "") {
        let amount_1_val = value * this.state.amount_0
        this.setState({ price: value, amount_1: amount_1_val })
      } else {
        this.setState({ price: value })
      }
    }
  }

  componentWillMount() {
  }

  getItem(contract, func, key) {
    const web3 = this.props.drizzle.web3
    var ret = "0"
    if(key in contract[func]) {
      ret = contract[func][key].value
    }
    if(!ret) {
      return web3.utils.toBN("0")
    }
    return ret
  }

  render() {
    var { price, amount_0, amount_1, currency_0_key, currency_1_key } = this.state
    var { currencies } = this.props
    const contracts = this.props.drizzleState.contracts
    const web3 = this.props.drizzle.web3
    var can_buy = false
    var can_sell = false
    var curr_0_amt = web3.utils.toBN(this.getItem(contracts[currencies[0]], "balanceOf", currency_0_key))
    var curr_1_amt = web3.utils.toBN(this.getItem(contracts[currencies[1]], "balanceOf", currency_1_key))

    amount_0 = amount_0 === "" || !amount_0 ? "0" : amount_0
    amount_1 = amount_1 === "" || !amount_1 ? "0" : amount_1

    var amount_0_wei = web3.utils.toBN(web3.utils.toWei(amount_0.toString(), 'ether'))
    var amount_1_wei = web3.utils.toBN(web3.utils.toWei(amount_1.toString(), 'ether'))

    if(curr_1_amt.gt("0") && amount_1_wei.gt("0") && curr_1_amt.gt(amount_1_wei)) {
      can_buy = true
    }
    if(curr_0_amt.gt("0") && amount_0_wei.gt("0") && curr_0_amt.gt(amount_0_wei)) {
      can_sell = true
    }

    if(this.state.amount_0 === "") {
      amount_0 = ""
    }
    if(this.state.amount_1 === "") {
      amount_1 = ""
    }

    return (
      <div className="BuySell">
        <Form size='tiny'>
          <div className="BuySell-headers">Price</div>
          <Form.Field>
            <Input
              label={{ basic: true, content: currencies[1] + " / " + currencies[0]  }}
              labelPosition='right'
              placeholder='Enter Price...'
              value={price}
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
          <Button className="BuySell-button" color='green' disabled={!can_buy} onClick={() => this.handleSubmit("buy")} >BUY {currencies[0]}</Button>
          <Button className="BuySell-button" color='red' disabled={!can_sell} onClick={() => this.handleSubmit("sell")} >SELL {currencies[0]}</Button>
        </Form>
      </div>
    );
  }
}

export default BuySell
