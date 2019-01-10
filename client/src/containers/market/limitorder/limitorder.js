import React, { Component } from 'react'
import { Input, Form, Button, Loader } from 'semantic-ui-react'

import './limitorder.css'

class LimitOrder extends Component {
  constructor(props) {
    super(props)
    this.state = {
      loading: false,
      init: false,
      error: false,
      success: false,
      price: '',
      amount_0: '',
      ui_amount_0: '',
      amount_1: '',
      ui_amount_1: '',
      currency_0_balance: "0",
      currency_1_balance: "0",
      bignumbers: [],
      timer: null
    }

    this.handleSubmit = this.handleSubmit.bind(this)
    this.updateBalances = this.updateBalances.bind(this)
    this.flashSuccess = this.flashSuccess.bind(this)
    this.flashError = this.flashError.bind(this)
  }

  componentDidMount() {
    this.generateBigNumbers()
    this.updateBalances()
  }

  componentWillUnmount() {
    if(this.state.timer) {
      clearTimeout(this.state.timer)
    }
  }

  async updateBalances() {
    var { drizzle, drizzleState, currencies } = this.props
    var { price, init } = this.state

    if(!init || price !== '') {
      const account = drizzleState.accounts[0]
      const currency_0_balance = await drizzle.contracts[currencies[0]].methods.balanceOf(account).call()
      const currency_1_balance = await drizzle.contracts[currencies[1]].methods.balanceOf(account).call()
      this.setState({ currency_0_balance, currency_1_balance, init: true })  
    }
    var timer = setTimeout(this.updateBalances, 2500)
    this.setState({ timer })
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
    this.setState({loading: true, error: false, success: false})

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

    console.log(data)

    this.props.drizzle.contracts.Market.methods.offer(data.pay_amt, data.pay_gem, data.buy_amt, data.buy_gem, 1).send({from: account, gasPrice: web3.utils.toWei('5', 'gwei') })
      .on('receipt', this.flashSuccess)
      .on('error', this.flashError)

    this.setState({ loading: true })
  }

  flashSuccess() {
    this.setState({ success : true, loading: false })
    setTimeout(() => this.setState({ success: false, price: '', amount_0: '0', ui_amount_0: '', amount_1: '0', ui_amount_1: '' }), 1500)
  }

  flashError() {
    this.setState({ error: true, loading: false })
    setTimeout(() => this.setState({ error: false }), 1500)
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
    var price_bn = web3.utils.toBN(web3.utils.toWei(price.toString(), 'ether'))
    var one_bn = web3.utils.toBN(web3.utils.toWei('1'), 'ether')

    if(index === 0) {
      amount_0_bn = value
      amount_1_bn = amount_0_bn.mul(price_bn).div(one_bn)
    } else if(index === 1) {
      amount_1_bn = value
      amount_0_bn = amount_1_bn.mul(one_bn).div(price_bn)
    } else {
      return
    }

    try {
      ui_amount_0 = web3.utils.fromWei(amount_0_bn.toString(), 'ether')
    } catch(err) {
      console.log(err)
      ui_amount_0 = web3.utils.fromWei("0", 'ether')
    }

    try {
      ui_amount_1 = web3.utils.fromWei(amount_1_bn.toString(), 'ether')
    } catch(err) {
      console.log(err)
      ui_amount_1 = web3.utils.fromWei("0", 'ether')
    }

    this.setState({
      amount_0: amount_0_bn.toString(),
      ui_amount_0: ui_amount_0,
      amount_1: amount_1_bn.toString(),
      ui_amount_1: ui_amount_1
    })
  }

  render() {
    var { price, amount_0, amount_1, ui_amount_0, ui_amount_1, currency_0_balance, currency_1_balance, bignumbers, loading, success, error } = this.state
    var { currencies } = this.props
    const web3 = this.props.drizzle.web3
    
    var can_buy = false
    var can_sell = false
    
    var curr_0_balance = web3.utils.toBN(currency_0_balance)
    var curr_1_balance = web3.utils.toBN(currency_1_balance)
    
    var amount_0_bn = web3.utils.toBN(amount_0)
    var amount_1_bn = web3.utils.toBN(amount_1)

    if(curr_0_balance.gte(amount_0_bn) && amount_0_bn.gt(web3.utils.toBN("1000"))) {
      can_sell = true
    }
    
    if(curr_1_balance.gte(amount_1_bn) && amount_1_bn.gt(web3.utils.toBN("1000"))) {
      can_buy = true
    }

    var side_text = ""
    if(loading) {
      side_text = (<span className="LimitOrder-color"><Loader active inline size="small"/> LOADING...</span>)
    }
    if(error) {
      side_text = (<span className="red LimitOrder-color">FAILED</span>)
    }
    if(success) {
      side_text = (<span className="green LimitOrder-color">SUCCESS</span>)
    }

    return (
      <div className="LimitOrder">
        <Form size='tiny'>
          <div className="LimitOrder-headers">Price</div>
          <Form.Field>
            <Input
              label={{ basic: true, content: currencies[1] + " / " + currencies[0]  }}
              labelPosition='right'
              placeholder='Enter Price...'
              value={price}
              onChange={(e) => { this.handlePriceChange(e.target.value) }}
            />
          </Form.Field>
          <div className="LimitOrder-headers">Amounts</div>
          <Form.Group widths='equal'>
            <Form.Field>
              <Input
                label={{ basic: true, content: currencies[0] }}
                labelPosition='right'
                placeholder='Enter Amount...'
                disabled={price === ''}
                value={ui_amount_0}
                onChange={(e) => { this.handleAmountChange(0, e.target.value) }}
                className="LimitOrder-amount-input"
              />
              <Button.Group className="LimitOrder-mini-buttons" size='mini' basic inverted>
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
                className="LimitOrder-amount-input"
              />
              <Button.Group className="LimitOrder-mini-buttons" size='mini' basic inverted>
                <Button disabled={price === ""} onClick={() => this.handleAmountChange(1, '') } >0%</Button>
                <Button disabled={price === ""} onClick={() => this.handleAmountPercentageChange(1, curr_1_balance.div(bignumbers[4]))} >25%</Button>
                <Button disabled={price === ""} onClick={() => this.handleAmountPercentageChange(1, curr_1_balance.div(bignumbers[2]))} >50%</Button>
                <Button disabled={price === ""} onClick={() => this.handleAmountPercentageChange(1, curr_1_balance.mul(bignumbers[3]).div(bignumbers[4]))} >75%</Button>
                <Button disabled={price === ""} onClick={() => this.handleAmountPercentageChange(1, curr_1_balance) } >100%</Button>
              </Button.Group>
            </Form.Field>
          </Form.Group>
          <Button className="LimitOrder-button" color='green' disabled={!can_buy || loading} onClick={() => this.handleSubmit("BUY")} >BUY {currencies[0]}</Button>
          <Button className="LimitOrder-button" color='red' disabled={!can_sell || loading} onClick={() => this.handleSubmit("SELL")} >SELL {currencies[0]}</Button>
          {side_text}
        </Form>
      </div>
    );
  }
}

export default LimitOrder
