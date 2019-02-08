import React, { Component } from 'react'
import { ethers } from 'ethers';
import { Input, Form, Button, Loader } from 'semantic-ui-react'

import './marketorder.css'

class MarketOrder extends Component {
  constructor(props) {
    super(props)
    this.state = {
      loading: [false, false],
      error: [false, false],
      success: [false, false],
      amounts: ['0', '0'],
      ui_amounts: ['', ''],
      expected_price: ['', ''],
      expected_amount: ['0', '0'],
      bignumbers: []
    }

    this.handleMarketBuy = this.handleMarketBuy.bind(this)
    this.handleMarketSell = this.handleMarketSell.bind(this)
    this.flashSuccess = this.flashSuccess.bind(this)
    this.flashError = this.flashError.bind(this)
  }

  componentDidMount() {
    this.generateBigNumbers()
  }

  generateBigNumbers() {
    var bignumbers = {}
    for(var i = 0; i <= 10; i++) {
      var key = i
      bignumbers[key] = ethers.utils.bigNumberify(key)
    }

    this.setState({ bignumbers })
  }

  async handleMarketBuy() {
    // Set loading to true to update UI
    var { loading, error, success } = this.state
    loading[1] = true
    error[1] = false
    success[1] = false
    this.setState({ loading , error, success })
    
    var { amounts, expected_amount } = this.state
    var { currencies, options } = this.props
    
    var curr_gem_0 = options.contracts[currencies[0]].address
    var curr_gem_1 = options.contracts[currencies[1]].address

    var min_expected_amount = ethers.utils.bigNumberify("98").mul(expected_amount[1]).div(ethers.utils.bigNumberify("100"))

    var data = {
      pay_gem: curr_gem_1,
      pay_amt: amounts[1],
      buy_gem: curr_gem_0,
      min_fill_amount: min_expected_amount.toString()
    }

    console.log(data)

    try {
      var tx = await options.contracts.Market.sellAllAmount(data["pay_gem"], data["pay_amt"], data["buy_gem"], data["min_fill_amount"])
      await tx.wait()
      this.flashSuccess(1)
    } catch (error) {
      this.flashError(1)
    }
  }

  async handleMarketSell() {
    // Set loading to true to update UI
    var { loading, error, success } = this.state
    loading[0] = true
    error[0] = false
    success[0] = false
    this.setState({ loading , error, success })

    var { amounts, expected_amount } = this.state
    var { currencies, options } = this.props

    var curr_gem_0 = options.contracts[currencies[0]].address
    var curr_gem_1 = options.contracts[currencies[1]].address

    var min_expected_amount = ethers.utils.bigNumberify("98").mul(expected_amount[0]).div(ethers.utils.bigNumberify("100"))

    var data = {
      pay_gem: curr_gem_0,
      pay_amt: amounts[0],
      buy_gem: curr_gem_1,
      min_fill_amount: min_expected_amount.toString()
    }

    console.log(data)

    try {
      var tx = await options.contracts.Market.sellAllAmount(data["pay_gem"], data["pay_amt"], data["buy_gem"], data["min_fill_amount"])
      await tx.wait()
      this.flashSuccess(0)
    } catch (error) {
      this.flashError(0)
    }
  }

  flashSuccess(index) {
    var { loading, success, error } = this.state
    loading[index] = false
    success[index] = true
    error[index] = false
    this.setState({ loading, success, error })
    setTimeout(() => this.reset(index), 1500)
  }

  flashError(index) {
    var { loading, success, error } = this.state
    loading[index] = false
    success[index] = false
    error[index] = true
    this.setState({ loading, success, error })
    setTimeout(() => {
      var { loading, success, error } = this.state
      loading[index] = false
      success[index] = false
      error[index] = false
      this.setState({ error })
    }, 1500)
  }

  reset(index) {
    var { loading, success, error, amounts, ui_amounts } = this.state
    loading[index] = false
    success[index] = false
    error[index] = false
    amounts[index] = "0"
    ui_amounts[index] = ""
    this.setState({ loading, success, error, amounts, ui_amounts })
  }

  async setExpectedAmount(index) {
    var { amounts, expected_amount, expected_price } = this.state
    var { currencies, options } = this.props

    var curr_gem_0 = options.contracts[currencies[0]].address
    var curr_gem_1 = options.contracts[currencies[1]].address

    var will_receive = "0"
    var giving = amounts[index]

    if(index === 0) {
      will_receive = await options.contracts.Market.getBuyAmount(curr_gem_1, curr_gem_0, giving)
    } else if(index === 1) {
      will_receive = await options.contracts.Market.getBuyAmount(curr_gem_0, curr_gem_1, giving)
    }

    if(will_receive !== "0" && giving !== "0") {
      will_receive = ethers.utils.bigNumberify(will_receive)
      giving = ethers.utils.bigNumberify(giving)
      var one = ethers.utils.bigNumberify(ethers.utils.parseUnits('1', 'ether'))

      var price = one.mul(will_receive).div(giving)
      if(index === 1) {
        price = one.mul(giving).div(will_receive)
      }
      price = Math.round(ethers.utils.formatUnits(price.toString(), 'ether') * 1000) / 1000

      expected_amount[index] = will_receive
      expected_price[index] = price
    } else {
      expected_amount[index] = "0"
      expected_price[index] = ""
    }
    this.setState({ expected_amount, expected_price })

  }

  handleAmountChange(index, value) {
    var { amounts, ui_amounts } = this.state

    var new_amounts = amounts.slice(0)
    var new_ui_amounts = ui_amounts.slice(0)

    try {
      if(/\S/.test(value)) {
        var ui_amount = value
        var amount_bn = ethers.utils.bigNumberify(ethers.utils.parseUnits(ui_amount.toString(), 'ether'))

        new_amounts[index] = amount_bn.toString()
        new_ui_amounts[index] = ui_amount.toString()

        this.setState({ 
          amounts: new_amounts,
          ui_amounts: new_ui_amounts
        })
      } else {
        new_amounts[index] = '0'
        new_ui_amounts[index] = ''
      }
    } catch(err) {
      console.log(err)
      new_amounts[index] = '0'
      new_ui_amounts[index] = ''
    }

    this.setState({
      amounts: new_amounts,
      ui_amounts: new_ui_amounts
    }, () => {
      this.setExpectedAmount(index)
    })
  }

  handleAmountPercentageChange(index, value) {
    var { amounts, ui_amounts } = this.state

    var amount_bn = value
    var ui_amount = ethers.utils.formatUnits("0", 'ether')
    try {
      ui_amount = ethers.utils.formatUnits(amount_bn.toString(), 'ether')
    } catch(err) {
      console.log(err)
    }

    var new_amounts = amounts.slice(0)
    var new_ui_amounts = ui_amounts.slice(0)

    new_amounts[index] = amount_bn.toString()
    new_ui_amounts[index] = ui_amount.toString()

    this.setState({ 
      amounts: new_amounts,
      ui_amounts: new_ui_amounts
    }, () => {
      this.setExpectedAmount(index)
    })
  }

  render() {
    var { amounts, ui_amounts, expected_price, bignumbers, loading, success, error } = this.state
    var { currencies, balances, options } = this.props
    
    var can_buy = false
    var can_sell = false
    
    var curr_0_balance = ethers.utils.bigNumberify(balances[0])
    var curr_1_balance = ethers.utils.bigNumberify(balances[1])
    
    var amount_0_bn = ethers.utils.bigNumberify(amounts[0])
    var amount_1_bn = ethers.utils.bigNumberify(amounts[1])

    if(curr_0_balance.gte(amount_0_bn) && amount_0_bn.gt(ethers.utils.bigNumberify("1000"))) {
      can_sell = true
    }
    
    if(curr_1_balance.gte(amount_1_bn) && amount_1_bn.gt(ethers.utils.bigNumberify("1000"))) {
      can_buy = true
    }

    var side_texts = ["", ""]
    for(var i = 0; i < 2; i++) {
      if(loading[i]) {
        side_texts[i] = (<span className="MarketOrder-color"><Loader active inline size="small"/> LOADING...</span>)
      }
      if(error[i]) {
        side_texts[i] = (<span className="red MarketOrder-color">FAILED</span>)
      }
      if(success[i]) {
        side_texts[i] = (<span className="green MarketOrder-color">SUCCESS</span>)
      }
    }

    return (
      <div className="MarketOrder">
        <div className="MarketOrder-pane">
          <div className="MarketOrder-main-header">Market <span className="green">BUY</span></div>
          <div className="MarketOrder-small-note">Note: Orders will cancel if slippage >2%</div>
          <div className="MarketOrder-sub-header">Est. Price: {expected_price[1]} <span className="MarketOrder-tiny-note">{currencies[1]}/{currencies[0]}</span></div>
          <Form size='tiny'>
            <div className="MarketOrder-headers"><span className="green">Buy</span> Allowance</div>
            <Form.Group widths='equal'>
              <Form.Field>
                <Input
                  label={{ basic: true, content: currencies[1] }}
                  labelPosition='right'
                  placeholder='Enter Amount...'
                  value={ui_amounts[1]}
                  onChange={(e) => { this.handleAmountChange(1, e.target.value) }}
                  className="MarketOrder-amount-input"
                  disabled={options.readOnly}
                />
                <Button.Group className="MarketOrder-mini-buttons" size='mini' basic inverted>
                  <Button disabled={options.readOnly} onClick={() => this.handleAmountChange(1, '') } >0%</Button>
                  <Button disabled={options.readOnly} onClick={() => this.handleAmountPercentageChange(1, curr_1_balance.div(bignumbers[4]))} >25%</Button>
                  <Button disabled={options.readOnly} onClick={() => this.handleAmountPercentageChange(1, curr_1_balance.div(bignumbers[2]))} >50%</Button>
                  <Button disabled={options.readOnly} onClick={() => this.handleAmountPercentageChange(1, curr_1_balance.mul(bignumbers[3]).div(bignumbers[4]))} >75%</Button>
                  <Button disabled={options.readOnly} onClick={() => this.handleAmountPercentageChange(1, curr_1_balance) } >100%</Button>
                </Button.Group>
              </Form.Field>
            </Form.Group>
            <Button className="MarketOrder-button" color='green' disabled={!can_buy || loading[1] || error[1] || options.readOnly} onClick={this.handleMarketBuy} >BUY {currencies[0]}</Button>
            {side_texts[1]}
          </Form>
        </div>
        <hr />
        <div className="MarketOrder-pane">
          <div className="MarketOrder-main-header">Market <span className="red">SELL</span></div>
          <div className="MarketOrder-small-note">Note: Orders will cancel if slippage >2%</div>
          <div className="MarketOrder-sub-header">Est. Price: {expected_price[0]} <span className="MarketOrder-tiny-note">{currencies[1]}/{currencies[0]}</span></div>
          <Form size='tiny'>
            <div className="MarketOrder-headers"><span className="red">Sell</span> Allowance</div>
            <Form.Group widths='equal'>
              <Form.Field>
                <Input
                  label={{ basic: true, content: currencies[0] }}
                  labelPosition='right'
                  placeholder='Enter Amount...'
                  value={ui_amounts[0]}
                  onChange={(e) => { this.handleAmountChange(0, e.target.value) }}
                  className="MarketOrder-amount-input"
                  disabled={options.readOnly}
                />
                <Button.Group className="MarketOrder-mini-buttons" size='mini' basic inverted>
                  <Button disabled={options.readOnly} onClick={() => this.handleAmountChange(0, '') } >0%</Button>
                  <Button disabled={options.readOnly} onClick={() => this.handleAmountPercentageChange(0, curr_0_balance.div(bignumbers[4]))} >25%</Button>
                  <Button disabled={options.readOnly} onClick={() => this.handleAmountPercentageChange(0, curr_0_balance.div(bignumbers[2]))} >50%</Button>
                  <Button disabled={options.readOnly} onClick={() => this.handleAmountPercentageChange(0, curr_0_balance.mul(bignumbers[3]).div(bignumbers[4]))} >75%</Button>
                  <Button disabled={options.readOnly} onClick={() => this.handleAmountPercentageChange(0, curr_0_balance) } >100%</Button>
                </Button.Group>
              </Form.Field>
            </Form.Group>
            <Button className="MarketOrder-button" color='red' disabled={!can_sell || loading[0] || error[0] || options.readOnly} onClick={this.handleMarketSell} >SELL {currencies[0]}</Button>
            {side_texts[0]}
          </Form>
        </div>
      </div>
    );
  }
}

export default MarketOrder
