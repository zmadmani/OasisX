import React, { Component } from 'react'
import { Sidebar, Segment, Icon, Input, Form, Button } from 'semantic-ui-react'

import './sidebar.css'

class SideBar extends Component {
  constructor(props) {
    super(props)
    this.state = {
      visible: false,
      amount: "",
      currency_0_key: null,
      currency_1_key: null,
      info_key: null
    }
  }

  componentDidMount() {
    var { drizzle, drizzleState, currencies } = this.props

    let account = drizzleState.accounts[0]
    const currency_0_key = drizzle.contracts[currencies[0]].methods.balanceOf.cacheCall(account)
    const currency_1_key = drizzle.contracts[currencies[1]].methods.balanceOf.cacheCall(account)

    this.setState({ currency_0_key, currency_1_key })
  }

  componentWillReceiveProps(nextProps) {
    if(nextProps.visible !== this.props.visible) {
      this.setState({ visible: nextProps.visible })
    }
    if(nextProps.sidebar_info !== this.props.sidebar_info) {
      const info_key = this.props.drizzle.contracts.Market.methods.getOffer.cacheCall(nextProps.sidebar_info["id"])
      this.setState({ info_key, amount: "" })
    }
  }

  numberWithCommas(x) {
    var parts = x.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  }

  handleChange(name, value) {
    this.setState({ [name]: value })
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

  executeTrade = () => {
    var { drizzle, drizzleState, sidebar_info } = this.props
    const account = drizzleState.accounts[0]
    const web3 = drizzle.web3

    var amount = this.state.amount
    var will_receive = amount === "" ? 0 : amount
    if(sidebar_info["type"] === "sell") {
      will_receive /= sidebar_info["price"]
    } else {
      will_receive *= sidebar_info["price"]
    }
    will_receive = web3.utils.toWei(will_receive.toString(), 'ether')

    var id = sidebar_info["id"]

    const buy = drizzle.contracts.Market.methods.buy
    console.log(id + ": " + will_receive)
    buy.cacheSend(id, will_receive, {from: account })

    this.setState({ loading: false, price: '', amount_0: '', amount_1: '' })
  }

  render() {
    var { visible, amount, currency_0_key, currency_1_key, info_key } = this.state
    var { currencies, toggleSidebar, sidebar_info } = this.props
    const contracts = this.props.drizzleState.contracts
    const web3 = this.props.drizzle.web3

    var action = sidebar_info["type"] === "buy" ? "SELL" : "BUY"
    var subtitle = action === "BUY" ? (<span className="green">{action}</span>) : (<span className="red">SELL</span>)

    var curr_0_amt = web3.utils.toBN(this.getItem(contracts[currencies[0]], "balanceOf", currency_0_key))
    var curr_1_amt = web3.utils.toBN(this.getItem(contracts[currencies[1]], "balanceOf", currency_1_key))
    var updated_info = null
    if(info_key in contracts.Market.getOffer) {
      updated_info = contracts.Market.getOffer[info_key].value
      if(!updated_info) {
        updated_info = {
          "price": sidebar_info["price"],
          "curr_0_amt": sidebar_info["curr_0_amt"],
          "curr_1_amt": sidebar_info["curr_1_amt"]
        }
      } else {
        var buy_amt = Math.round(web3.utils.fromWei(updated_info[0], 'ether') * 1000) / 1000
        var pay_amt = Math.round(web3.utils.fromWei(updated_info[2], 'ether') * 1000) / 1000
        if(sidebar_info["type"] === "buy") {
          updated_info = {
            "price": sidebar_info["price"],
            "curr_0_amt": pay_amt,
            "curr_1_amt": buy_amt
          }
        } else {
          updated_info = {
            "price": sidebar_info["price"],
            "curr_0_amt": buy_amt,
            "curr_1_amt": pay_amt
          }
        }
      }
    } else {
      updated_info = {
          "price": sidebar_info["price"],
          "curr_0_amt": sidebar_info["curr_0_amt"],
          "curr_1_amt": sidebar_info["curr_1_amt"]
      }
    }

    curr_0_amt = Math.round(web3.utils.fromWei(curr_0_amt.toString(), 'ether') * 1000) / 1000
    curr_1_amt = Math.round(web3.utils.fromWei(curr_1_amt.toString(), 'ether') * 1000) / 1000

    var info = null
    var input = null
    var max_val = null

    if(action === "BUY") {
      info = (
        <div id="Side_bar-info">
          <div className="Side_bar-info-item">
            <div className="Side_bar-info-title">Price:</div>
            <div className="Side_bar-info-content">{this.numberWithCommas(updated_info["price"])} <span id="Side_bar-exchange">{currencies[1]} / {currencies[0]}</span></div>
          </div>

          <div className="Side_bar-info-item">
            <div className="Side_bar-info-title">Balance {currencies[1]}:</div>
            <div className="Side_bar-info-content">{this.numberWithCommas(curr_1_amt)} <span id="Side_bar-exchange">{currencies[1]}</span></div>
          </div>

          <div className="Side_bar-info-item">
            <div className="Side_bar-info-title">Offered {currencies[1]}:</div>
            <div className="Side_bar-info-content">{this.numberWithCommas(updated_info["curr_1_amt"])} <span id="Side_bar-exchange">{currencies[1]}</span></div>
          </div>
        </div>
      )
      max_val = Math.min(curr_1_amt, updated_info["curr_1_amt"])
      input = (
        <div>
          <div className="Side_bar-info-title">Spend {currencies[1]}:</div>
          <Input
            label={{ basic: true, content: currencies[1] }}
            labelPosition='right'
            placeholder='Enter Amount...'
            value={amount}
            onChange={(e) => { this.handleChange('amount', e.target.value) }}
          />
        </div>
      )
    } else {
      info = (
        <div id="Side_bar-info">
          <div className="Side_bar-info-item">
            <div className="Side_bar-info-title">Price:</div>
            <div className="Side_bar-info-content">{this.numberWithCommas(updated_info["price"])} <span id="Side_bar-exchange">{currencies[1]} / {currencies[0]}</span></div>
          </div>

          <div className="Side_bar-info-item">
            <div className="Side_bar-info-title">Balance {currencies[0]}:</div>
            <div className="Side_bar-info-content">{this.numberWithCommas(curr_0_amt)} <span id="Side_bar-exchange">{currencies[0]}</span></div>
          </div>

          <div className="Side_bar-info-item">
            <div className="Side_bar-info-title">Offered {currencies[0]}:</div>
            <div className="Side_bar-info-content">{this.numberWithCommas(updated_info["curr_0_amt"])} <span id="Side_bar-exchange">{currencies[0]}</span></div>
          </div>
        </div>
      )
      max_val = Math.min(curr_0_amt, updated_info["curr_0_amt"])
      input = (
        <div>
          <div className="Side_bar-info-title">Spend {currencies[0]}:</div>
          <Input
            label={{ basic: true, content: currencies[0] }}
            labelPosition='right'
            placeholder='Enter Amount...'
            value={amount}
            onChange={(e) => { this.handleChange('amount', e.target.value) }}
          />
        </div>
      )
    }

    var will_receive = amount === "" ? 0 : amount
    if(action === "BUY") {
      will_receive = Math.round((will_receive / updated_info["price"]) * 1000) / 1000
      will_receive = this.numberWithCommas(will_receive).toString() + " " + currencies[0]
    } else {
      will_receive = Math.round((will_receive * updated_info["price"]) * 1000) / 1000
      will_receive = this.numberWithCommas(will_receive).toString() + " " + currencies[1]
    }

    return (
      <div className="Side_bar">
        <Sidebar as={Segment} animation="overlay" direction="right" visible={visible} id="Side_bar">
          <div id="Side_bar-x-container">
            <Icon name="close" onClick={toggleSidebar} id="Side_bar-x" size="large" />
          </div>
          <div id="Side_bar-title">Take Order</div>
          <div id="Side_bar-subtitle">How much would you like to {subtitle}?</div>
          
          {info}

          <Form size='tiny' id="Side_bar-form">
            <Form.Field>
              {input}
            </Form.Field>
            <Button.Group id="Side_bar-mini-buttons" size='mini' basic>
              <Button onClick={ () => this.handleChange("amount", "") } >0%</Button>
              <Button onClick={ () => this.handleChange("amount", 0.25*max_val) } >25%</Button>
              <Button onClick={ () => this.handleChange("amount", 0.50*max_val) } >50%</Button>
              <Button onClick={ () => this.handleChange("amount", 0.75*max_val) } >75%</Button>
              <Button onClick={ () => this.handleChange("amount", max_val) } >100%</Button>
            </Button.Group>
          </Form>
          <div className="Side_bar-info-item">
            <div className="Side_bar-info-title">Will Receive</div>
            <div className="Side_bar-info-content">{will_receive}</div>
          </div>

          <Button className="BuySell-button" color={action === "BUY" ? "green" : "red"} disabled={amount === ""} onClick={this.executeTrade}>{action} {currencies[0]}</Button>

        </Sidebar>
      </div>
    );
  }
}

export default SideBar
