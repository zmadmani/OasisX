import React, { Component } from 'react'
import { ethers } from 'ethers';
import { Input, Form, Button } from 'semantic-ui-react'

import './wrapstation.css'

class WrapStation extends Component {
  constructor(props) {
    super(props)
    this.state = {
      amount_wrap: '0',
      ui_amount_wrap: '',
      amount_unwrap: '0',
      ui_amount_unwrap: '',
      bignumbers: {},
      loading: [false, false],
      error: [false, false],
      success: [false, false]
    }

    this.flashSuccess = this.flashSuccess.bind(this)
    this.flashError = this.flashError.bind(this)
  }

  componentDidMount() {
    var bignumbers = {}
    for(var i = 0; i <= 10; i++) {
      var key = i
      bignumbers[key] = ethers.utils.bigNumberify(key)
    }

    this.setState({ bignumbers })
  }

  handlePercentUpdate(name, value) {
    var ui_value = ethers.utils.formatUnits(value.toString(), 'ether')
    if(name === "amount_wrap") {
      this.setState({ amount_wrap: value, ui_amount_wrap: ui_value })
    } else if(name === "amount_unwrap") {
      this.setState({ amount_unwrap: value, ui_amount_unwrap: ui_value })
    } else {
      return
    }
  }

  handleUserUpdate(name, value) {
    var internal_value = 0
    try{
      if(/\S/.test(value)) {
        internal_value = ethers.utils.parseUnits(value.toString(), 'ether')
      }
    } catch (err) {
      console.log(err)
      return
    }

    if(name === "ui_amount_wrap") {
      this.setState({ ui_amount_wrap: value, amount_wrap: internal_value })
    } else if(name === "ui_amount_unwrap") {
      this.setState({ ui_amount_unwrap: value, amount_unwrap: internal_value })
    } else {
      return
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
    var { loading, success, error, amount_wrap, amount_unwrap, ui_amount_wrap, ui_amount_unwrap } = this.state
    loading[index] = false
    success[index] = false
    error[index] = false
    if(index === 0) {
      amount_wrap = '0'
      ui_amount_wrap = ''
    }
    if(index === 1) {
      amount_unwrap = '0'
      ui_amount_unwrap = ''
    }
    this.setState({ loading, success, error, amount_wrap, amount_unwrap, ui_amount_wrap, ui_amount_unwrap })
  }

  onWrap = async () => {
    // Grab the wrap function from the contract instance and the account and amount we want to execute it with
    const deposit = this.props.options.contracts.WETH.deposit
    var amount = this.state.amount_wrap

    // Need to check if the amount value is an empty string/undefined/null and that it's greater than 0
    if(amount && amount > 0) {
      var { loading } = this.state
      loading[0] = true
      this.setState({ loading })
      console.log("SENDING " + amount + " TO WRAPPER...")
      try {
        var tx = await deposit({value: amount})
        await tx.wait()
        this.flashSuccess(0)
      } catch (error) {
        this.flashError(0)
      }
    } else {
      console.log("Error: No amount chosen")
    }
  }

  onUnwrap = async () => {
    const withdraw = this.props.options.contracts.WETH.withdraw
    var amount = this.state.amount_unwrap

    if(amount && amount > 0) {
      var { loading } = this.state
      loading[1] = true
      this.setState({ loading })
      console.log("SENDING " + amount + " TO UNWRAPPER...")
      try {
        var tx = await withdraw(amount.toString())
        await tx.wait()
        this.flashSuccess(1)
      } catch (error) {
        this.flashError(1)
      }
    } else {
      console.log("Error: No amount chosen")
    }
  }

  render() {
    var { weth_balance, eth_balance } = this.props
    var { ui_amount_wrap, ui_amount_unwrap, bignumbers, loading, success, error } = this.state

    // Convert to BigNumbers since they will have potential math done on them (risk of overflow/underflow)
    eth_balance = ethers.utils.bigNumberify(eth_balance)
    weth_balance = ethers.utils.bigNumberify(weth_balance)

    var button_text = ["WRAP", "UNWRAP"]
    for(var i = 0; i < button_text.length; i++) {
      if(success[i]) {
        button_text[i] = "SUCCESS"
      }
      if(error[i]) {
        button_text[i] = "FAILED"
      }
    }

    return (
      <div className="WrapStation">
        <div id="WrapStation-title">Wrap / Unwrap</div>
        <Form onSubmit={this.handleSubmit} size='tiny' id="WrapStation-form">
          <div className="WrapStation-headers">Wrap <span id="WrapStation-warning"><span className="red">WARNING:</span> DO NOT WRAP ALL YOUR ETHER</span></div>
          <Form.Group unstackable className="WrapStation-formgroup">
            <Form.Field width={11}>
              <Input
                label={{ basic: true, content: "ETH" }}
                labelPosition='right'
                placeholder='Enter Amount ETH...'
                value={ui_amount_wrap}
                disabled={ loading[0] || error[0] || success[0] }
                onChange={(e) => { this.handleUserUpdate('ui_amount_wrap', e.target.value) }}
              />
            </Form.Field>
            <Form.Button disabled={ loading[0] || error[0] || success[0] || ui_amount_wrap === "" } loading={loading[0]} width={4} className="WrapStation-button" color={error[0] ? 'red' : 'green'} size='small' onClick={ () => this.onWrap() } >{button_text[0]}</Form.Button>
          </Form.Group>
          <Button.Group className="WrapStation-mini-buttons" size='mini' basic inverted>
            <Button disabled={ loading[0] || error[0] || success[0] } onClick={ () => this.handleUserUpdate("ui_amount_wrap", "") } >0%</Button>
            <Button disabled={ loading[0] || error[0] || success[0] } onClick={ () => this.handlePercentUpdate("amount_wrap", eth_balance.div(bignumbers[4])) } >25%</Button>
            <Button disabled={ loading[0] || error[0] || success[0] } onClick={ () => this.handlePercentUpdate("amount_wrap", eth_balance.div(bignumbers[2])) } >50%</Button>
            <Button disabled={ loading[0] || error[0] || success[0] } onClick={ () => this.handlePercentUpdate("amount_wrap", eth_balance.mul(bignumbers[3]).div(bignumbers[4])) } >75%</Button>
            <Button disabled={ loading[0] || error[0] || success[0] } onClick={ () => this.handlePercentUpdate("amount_wrap", eth_balance.mul(bignumbers[9]).div(bignumbers[10])) } >90%</Button>
          </Button.Group>
          <div className="WrapStation-headers">Unwrap</div>
          <Form.Group unstackable className="WrapStation-formgroup">
            <Form.Field width={10}>
              <Input
                label={{ basic: true, content: "WETH" }}
                labelPosition='right'
                placeholder='Enter Amount WETH...'
                value={ui_amount_unwrap}
                disabled={ loading[1] || error[1] || success[1] }
                onChange={(e) => { this.handleUserUpdate('ui_amount_unwrap', e.target.value) }}
              />
            </Form.Field>
            <Form.Button disabled={ loading[1] || error[1] || success[1] || ui_amount_unwrap === "" } loading={loading[1]} width={4} className="WrapStation-button" color={error[1] ? 'red' : 'green'} size='small' onClick={ () => this.onUnwrap() } >{button_text[1]}</Form.Button>
          </Form.Group>
          <Button.Group className="WrapStation-mini-buttons" size='mini' basic inverted>
            <Button disabled={ loading[1] || error[1] || success[1] } onClick={ () => this.handleUserUpdate("ui_amount_unwrap", "") } >0%</Button>
            <Button disabled={ loading[1] || error[1] || success[1] } onClick={ () => this.handlePercentUpdate("amount_unwrap", weth_balance.div(bignumbers[4])) } >25%</Button>
            <Button disabled={ loading[1] || error[1] || success[1] } onClick={ () => this.handlePercentUpdate("amount_unwrap", weth_balance.div(bignumbers[2])) } >50%</Button>
            <Button disabled={ loading[1] || error[1] || success[1] } onClick={ () => this.handlePercentUpdate("amount_unwrap", weth_balance.mul(bignumbers[3]).div(bignumbers[4])) } >75%</Button>
            <Button disabled={ loading[1] || error[1] || success[1] } onClick={ () => this.handlePercentUpdate("amount_unwrap", weth_balance) } >100%</Button>
          </Button.Group>
        </Form>
      </div>
    );
  }
}

export default WrapStation
