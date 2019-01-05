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
      ui_amount_0: '',
      amount_1: '',
      ui_amount_1: '',
      currency_0_balance: "0",
      currency_1_balance: "0",
      bignumbers: []
    }

    this.handleSubmit = this.handleSubmit.bind(this)
    this.updateBalances = this.updateBalances.bind(this)
  }

  componentDidMount() {
    this.generateBigNumbers()
    this.updateBalances()
  }

  async updateBalances() {
    var { drizzle, drizzleState, currencies } = this.props
    const account = drizzleState.accounts[0]
    const currency_0_balance = await drizzle.contracts[currencies[0]].methods.balanceOf(account).call()
    const currency_1_balance = await drizzle.contracts[currencies[1]].methods.balanceOf(account).call()
    this.setState({ currency_0_balance, currency_1_balance })
    setTimeout(this.updateBalances, 2500)
  }

  generateBigNumbers() {
    var bignumbers = {}
    for(var i = 0; i <= 10; i++) {
      var key = i
      bignumbers[key] = this.props.drizzle.web3.utils.toBN(key)
    }

    this.setState({ bignumbers })
  }

  // Main function that interfaces and writes to the blockchain.
  // This is the most important function here.
  handleSubmit(type) {
    // Set loading to true to update UI
    this.setState({loading: true})

    var { currencies, drizzle, drizzleState } = this.props
    const web3 = drizzle.web3

    // Get the important info for the transaction
    const account = drizzleState.accounts[0]
    var amount_0 = this.state.amount_0
    var amount_1 = this.state.amount_1
    var curr_gem_0 = drizzle.contracts[currencies[0]].address
    var curr_gem_1 = drizzle.contracts[currencies[1]].address
    var data = {}

    // Set data to the correct value depending on if the order is a BUY or SELL
    // Basically you just flip the currency 0 and currency 1
    if(type === "BUY") {
      data = {
        pay_amt: amount_1,
        pay_gem: curr_gem_1,
        buy_amt: amount_0,
        buy_gem: curr_gem_0
      }
    } else if(type === "SELL") {
      data = {
        pay_amt: amount_0,
        pay_gem: curr_gem_0,
        buy_amt: amount_1,
        buy_gem: curr_gem_1
      }
    } else {
      return
    }

    const offer = this.props.drizzle.contracts.Market.methods.offer
    offer.cacheSend(data.pay_amt, data.pay_gem, data.buy_amt, data.buy_gem, 1, {from: account, gasPrice: web3.utils.toWei('5', 'gwei') })

    this.setState({ loading: false, price: '', amount_0: '0', ui_amount_0: '', amount_1: '0', ui_amount_1: '' })
  }

  handlePriceChange(value) {
    const web3 = this.props.drizzle.web3
    if(/\S/.test(value) && this.state.ui_amount_0 !== "") {
      var price = value
      var ui_amount_1 = this.state.ui_amount_0 * price
      var amount_1_bn = web3.utils.toWei(ui_amount_1.toString(), 'ether')
      this.setState({ price: price, amount_1: amount_1_bn.toString(), ui_amount_1: ui_amount_1.toString() })
    } else {
      this.setState({ price: value, amount_1: '0', ui_amount_1: '' })    
    }
  }

  handleAmountChange(index, value) {
    const web3 = this.props.drizzle.web3
    if(/\S/.test(value) && this.state.price !== "") {
      var price = this.state.price
      var ui_amount_0 = null
      var ui_amount_1 = null
      var amount_0_bn = null
      var amount_1_bn = null

      if(index === 0) {
        ui_amount_0 = value
        amount_0_bn = web3.utils.toBN(web3.utils.toWei(ui_amount_0.toString(), 'ether'))
        ui_amount_1 = ui_amount_0 * price
        amount_1_bn = web3.utils.toBN(web3.utils.toWei(ui_amount_1.toString(), 'ether'))
      } else if(index === 1) {
        ui_amount_1 = value
        amount_1_bn = web3.utils.toBN(web3.utils.toWei(ui_amount_1.toString(), 'ether'))
        ui_amount_0 = ui_amount_1 / price
        amount_0_bn = web3.utils.toBN(web3.utils.toWei(ui_amount_0.toString(), 'ether'))
      } else {
        return
      }

      this.setState({ 
        amount_0: amount_0_bn.toString(), 
        ui_amount_0: ui_amount_0, 
        amount_1: amount_1_bn.toString(),
        ui_amount_1: ui_amount_1,
      })
    } else {
      this.setState({
        amount_0: '0',
        ui_amount_0: '',
        amount_1: '0',
        ui_amount_1: ''
      })
    }
  }

  handleAmountPercentageChange(index, value) {
    const web3 = this.props.drizzle.web3
    var price = this.state.price

    var ui_amount_0 = null
    var ui_amount_1 = null
    var amount_0_bn = null
    var amount_1_bn = null

    if(index === 0) {
      amount_0_bn = value
      ui_amount_0 = web3.utils.fromWei(amount_0_bn, 'ether')
      ui_amount_1 = ui_amount_0 * price
      amount_1_bn = web3.utils.toBN(web3.utils.toWei(ui_amount_1.toString(), 'ether'))
    } else if(index === 1) {
      amount_1_bn = value
      ui_amount_1 = web3.utils.fromWei(amount_1_bn, 'ether')
      ui_amount_0 = ui_amount_1 / price
      amount_0_bn = web3.utils.toBN(web3.utils.toWei(ui_amount_0.toString(), 'ether'))
    } else {
      return
    }

    this.setState({
      amount_0: amount_0_bn.toString(),
      ui_amount_0: ui_amount_0,
      amount_1: amount_1_bn.toString(),
      ui_amount_1: ui_amount_1
    })
  }

  render() {
    var { price, amount_0, amount_1, ui_amount_0, ui_amount_1, currency_0_balance, currency_1_balance, bignumbers } = this.state
    var { currencies } = this.props
    const web3 = this.props.drizzle.web3
    
    var can_buy = false
    var can_sell = false
    
    var curr_0_balance = web3.utils.toBN(currency_0_balance)
    var curr_1_balance = web3.utils.toBN(currency_1_balance)
    
    var amount_0_bn = web3.utils.toBN(amount_0)
    var amount_1_bn = web3.utils.toBN(amount_1)

    if(curr_0_balance.gte(amount_0_bn) && amount_0_bn.gt(web3.utils.toBN("0"))) {
      can_sell = true
    }
    
    if(curr_1_balance.gte(amount_1_bn) && amount_1_bn.gt(web3.utils.toBN("0"))) {
      can_buy = true
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
              onChange={(e) => { this.handlePriceChange(e.target.value) }}
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
                value={ui_amount_0}
                onChange={(e) => { this.handleAmountChange(0, e.target.value) }}
                className="BuySell-amount-input"
              />
              <Button.Group className="BuySell-mini-buttons" size='mini' basic inverted>
                <Button disabled={price === ""} onClick={() => this.handleAmountChange(1, '') } >0%</Button>
                <Button disabled={price === ""} onClick={() => this.handleAmountPercentageChange(0, curr_0_balance.div(bignumbers[4]))} >25%</Button>
                <Button disabled={price === ""} onClick={() => this.handleAmountPercentageChange(0, curr_0_balance.div(bignumbers[2]))} >50%</Button>
                <Button disabled={price === ""} onClick={() => this.handleAmountPercentageChange(0, curr_0_balance.mul(bignumbers[3]).div(bignumbers[4]))} >75%</Button>
                <Button disabled={price === ""} onClick={() => this.handleAmountPercentageChange(0, curr_0_balance) } >100%</Button>
              </Button.Group>
            </Form.Field>
            <Form.Field>
              <Input
                label={{ basic: true, content: currencies[1] }}
                labelPosition='right'
                placeholder='Enter Amount...'
                disabled={price === ''}
                value={ui_amount_1}
                onChange={(e) => { this.handleAmountChange(1, e.target.value) }}
                className="BuySell-amount-input"
              />
              <Button.Group className="BuySell-mini-buttons" size='mini' basic inverted>
                <Button disabled={price === ""} onClick={() => this.handleAmountChange(1, '') } >0%</Button>
                <Button disabled={price === ""} onClick={() => this.handleAmountPercentageChange(1, curr_1_balance.div(bignumbers[4]))} >25%</Button>
                <Button disabled={price === ""} onClick={() => this.handleAmountPercentageChange(1, curr_1_balance.div(bignumbers[2]))} >50%</Button>
                <Button disabled={price === ""} onClick={() => this.handleAmountPercentageChange(1, curr_1_balance.mul(bignumbers[3]).div(bignumbers[4]))} >75%</Button>
                <Button disabled={price === ""} onClick={() => this.handleAmountPercentageChange(1, curr_1_balance) } >100%</Button>
              </Button.Group>
            </Form.Field>
          </Form.Group>
          <Button className="BuySell-button" color='green' disabled={!can_buy} onClick={() => this.handleSubmit("BUY")} >BUY {currencies[0]}</Button>
          <Button className="BuySell-button" color='red' disabled={!can_sell} onClick={() => this.handleSubmit("SELL")} >SELL {currencies[0]}</Button>
        </Form>
      </div>
    );
  }
}

export default BuySell
