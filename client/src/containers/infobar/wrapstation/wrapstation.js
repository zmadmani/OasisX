import React, { Component } from 'react'
import { Input, Form, Button } from 'semantic-ui-react'

import './wrapstation.css'

class WrapStation extends Component {
  constructor(props) {
    super(props)
    this.state = {
      amount_wrap: '',
      amount_unwrap: ''
    }
  }

  componentDidMount() {

  }

  handleChange(name, value) {
    this.setState({ [name]: value })
  }

  onWrap = () => {
    const deposit = this.props.drizzle.contracts.WETH.methods.deposit
    const account = this.props.drizzleState.accounts[0]
    var amount = this.state.amount_wrap

    if(amount && amount > 0) {
      amount = this.props.drizzle.web3.utils.toWei(amount.toString(), 'ether')
      console.log("SENDING " + amount + " TO WRAPPER...")
      deposit.cacheSend({value: amount, from: account })
    } else {
      console.log("CAN'T WRAP CUZ NULL/0")
    }
  }

  onUnwrap = () => {
    const withdraw = this.props.drizzle.contracts.WETH.methods.withdraw
    const account = this.props.drizzleState.accounts[0]
    var amount = this.state.amount_unwrap

    if(amount && amount > 0) {
      amount = this.props.drizzle.web3.utils.toWei(amount.toString(), 'ether')
      console.log("SENDING " + amount + " TO UNWRAPPER...")
      withdraw.cacheSend(amount, {from: account })
    } else {
      console.log("CAN'T UNWRAP CUZ NULL/0")
    }
  }

  render() {
    var { weth_key } = this.props
    var { amount_wrap, amount_unwrap } = this.state
    const account = this.props.drizzleState.accounts[0]
    const weth_contract = this.props.drizzleState.contracts.WETH

    var weth_amount = "0"
    var eth_amount = "0"
    if(weth_key in weth_contract.balanceOf) {
      weth_amount = weth_contract.balanceOf[weth_key].value
    }
    eth_amount = this.props.drizzleState.accountBalances[account]

    weth_amount = weth_amount ? weth_amount : "0"
    eth_amount = eth_amount ? eth_amount : "0"

    eth_amount = this.props.drizzle.web3.utils.fromWei(eth_amount, 'ether')
    weth_amount = this.props.drizzle.web3.utils.fromWei(weth_amount, 'ether')


    return (
      <div className="WrapStation">
        <div id="WrapStation-title">Wrap / Unwrap</div>
        <Form onSubmit={this.handleSubmit} size='tiny' id="WrapStation-form">
          <div className="WrapStation-headers">Wrap</div>
          <Form.Group widths='equal'>
            <Form.Field>
              <Input
                label={{ basic: true, content: "ETH" }}
                labelPosition='right'
                placeholder='Enter Amount ETH...'
                value={amount_wrap}
                onChange={(e) => { this.handleChange('amount_wrap', e.target.value) }}
              />
            </Form.Field>
            <Button className="WrapStation-button" color='green' size='mini' disabled={amount_wrap === ""} onClick={ () => this.onWrap() } >WRAP</Button>
          </Form.Group>
          <Button.Group className="WrapStation-mini-buttons" size='mini' basic inverted>
            <Button onClick={ () => this.handleChange("amount_wrap", "") } >0%</Button>
            <Button onClick={ () => this.handleChange("amount_wrap", 0.25*eth_amount) } >25%</Button>
            <Button onClick={ () => this.handleChange("amount_wrap", 0.50*eth_amount) } >50%</Button>
            <Button onClick={ () => this.handleChange("amount_wrap", 0.75*eth_amount) } >75%</Button>
            <Button onClick={ () => this.handleChange("amount_wrap", 0.90*eth_amount) } >90%</Button>
          </Button.Group>
          <div className="WrapStation-headers">Unwrap</div>
          <Form.Group widths='equal'>
            <Form.Field>
              <Input
                label={{ basic: true, content: "WETH" }}
                labelPosition='right'
                placeholder='Enter Amount WETH...'
                value={amount_unwrap}
                onChange={(e) => { this.handleChange('amount_unwrap', e.target.value) }}
              />
            </Form.Field>
            <Button className="WrapStation-button" color='green' size='mini' disabled={amount_unwrap === ""} onClick={ () => this.onUnwrap() } >UNWRAP</Button>
          </Form.Group>
          <Button.Group className="WrapStation-mini-buttons" size='mini' basic inverted>
            <Button onClick={ () => this.handleChange("amount_unwrap", "") } >0%</Button>
            <Button onClick={ () => this.handleChange("amount_unwrap", 0.25*weth_amount) } >25%</Button>
            <Button onClick={ () => this.handleChange("amount_unwrap", 0.50*weth_amount) } >50%</Button>
            <Button onClick={ () => this.handleChange("amount_unwrap", 0.75*weth_amount) } >75%</Button>
            <Button onClick={ () => this.handleChange("amount_unwrap", 1.00*weth_amount) } >100%</Button>
          </Button.Group>
        </Form>
      </div>
    );
  }
}

export default WrapStation
