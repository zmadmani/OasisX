import React, { Component } from 'react'
import { Sidebar, Segment, Icon, Input, Form, Button } from 'semantic-ui-react'

import './sidebar.css'

class SideBar extends Component {
  constructor(props) {
    super(props)
    this.state = {
      visible: false,
      amount: '0',
      ui_amount: '',
      currency_0_key: null,
      currency_1_key: null,
      info_key: null,
      bignumbers: {}
    }
  }

  // Get the balances for each of the currencies since we will need that throughout the component
  componentDidMount() {
    var { drizzle, drizzleState, currencies } = this.props

    let account = drizzleState.accounts[0]
    const currency_0_key = drizzle.contracts[currencies[0]].methods.balanceOf.cacheCall(account)
    const currency_1_key = drizzle.contracts[currencies[1]].methods.balanceOf.cacheCall(account)

    this.generateBigNumbers()
    this.setState({ currency_0_key, currency_1_key })
  }

  generateBigNumbers() {
    var bignumbers = {}
    for(var i = 0; i <= 10; i++) {
      var key = i
      bignumbers[key] = this.props.drizzle.web3.utils.toBN(key)
    }

    this.setState({ bignumbers })
  }

  // Need to update visible and the side_bar info key if a new order is passed in
  componentWillReceiveProps(nextProps) {
    if(nextProps.visible !== this.props.visible) {
      this.setState({ visible: nextProps.visible })
      if(nextProps.visible === false) {
        this.setState({ info_key: null, amount: '0', ui_amount: '' })
      }
    }
    if(nextProps.sidebar_info !== this.props.sidebar_info) {
      const info_key = this.props.drizzle.contracts.Market.methods.getOffer.cacheCall(nextProps.sidebar_info["id"])
      this.setState({ info_key, amount: '0', ui_amount: '' })
    }
  }

  // Most important function in the entire file since it actually interfaces
  // and edits the blockchain.
  executeTrade = () => {
    var { drizzle, drizzleState, sidebar_info } = this.props
    const account = drizzleState.accounts[0]
    const web3 = drizzle.web3

    var amount = this.state.amount
    var will_receive = amount === "" ? "0" : amount
    will_receive = web3.utils.fromWei(will_receive, 'ether')
    if(sidebar_info["type"] === "sell") {
      will_receive /= sidebar_info["price"]
    } else {
      will_receive *= sidebar_info["price"]
    }
    will_receive = web3.utils.toWei(will_receive.toString(), 'ether')

    var id = sidebar_info["id"]

    const buy = drizzle.contracts.Market.methods.buy
    buy.cacheSend(id, will_receive, {from: account, gasPrice: web3.utils.toWei('5', 'gwei') })

    // this.setState({ visible: false, amount: '0', ui_amount: '', info_key: null })
  }

  numberWithCommas(x) {
    var parts = x.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  }

  handleUserChange(value) {
    var internal_value = 0
    try{
      if(/\S/.test(value)) {
        internal_value = this.props.drizzle.web3.utils.toWei(value.toString(), 'ether')
      }
    } catch (err) {
      console.log(err)
      return
    }
    this.setState({ ui_amount: value, amount: internal_value })
  }

  handleAmountPercentageChange(value) {
    var ui_value = this.props.drizzle.web3.utils.fromWei(value.toString(), 'ether')
    this.setState({ amount: value, ui_amount: ui_value })
  }

  // Helper function to get the cacheKeys from drizzlestate if they exist. else return a 0 BN
  // Also handles the case where sometimes metamask returns a null response. Treats that as a nonexistant key and returns 0 BN
  // Note: ONLY MEANT FOR INTEGER RETURN VALUES
  getItem(contract, func, key) {
    const web3 = this.props.drizzle.web3
    var ret = "0"

    // Check if the cacheKey is in the store
    if(key in contract[func]) {
      ret = contract[func][key].value ? contract[func][key].value : "0"
    }
    return web3.utils.toBN(ret)
  }

  // So we were passed in the most up to date info the older component had.
  // However this can and will change if it was stale or other people are taking the order.
  // This keeps the info up to date and fallsback onto the old data if an error happens.
  getUpdatedInfo() {
    var { info_key } = this.state
    var { sidebar_info } = this.props
    const web3 = this.props.drizzle.web3
    const Market = this.props.drizzleState.contracts.Market

    var updated_info = null

    if(info_key in Market.getOffer && Market.getOffer[info_key].value) {
      updated_info = Market.getOffer[info_key].value
      var buy_amt = updated_info[0]
      var pay_amt = updated_info[2]
      if(sidebar_info["type"] === "buy") {
        updated_info = {
          "price": sidebar_info["price"],
          "curr_0_amt": web3.utils.toBN(pay_amt),
          "curr_1_amt": web3.utils.toBN(buy_amt)
        }
      } else {
        updated_info = {
          "price": sidebar_info["price"],
          "curr_0_amt": web3.utils.toBN(buy_amt),
          "curr_1_amt": web3.utils.toBN(pay_amt)
        }
      }
    } else {
      updated_info = {
          "price": sidebar_info["price"],
          "curr_0_amt": web3.utils.toBN(web3.utils.toWei(sidebar_info["curr_0_amt"].toString(), 'ether')),
          "curr_1_amt": web3.utils.toBN(web3.utils.toWei(sidebar_info["curr_1_amt"].toString(), 'ether'))
      }
    }

    return updated_info
  }

  render() {
    var { visible, amount, ui_amount, currency_0_key, currency_1_key, bignumbers } = this.state
    var { currencies, toggleSidebar, sidebar_info } = this.props
    const contracts = this.props.drizzleState.contracts
    const web3 = this.props.drizzle.web3

    // Invert the type since the action do as a taker is the inverse of the action of the maker
    var action = sidebar_info["type"] === "buy" ? "SELL" : "BUY"
    var subtitle = action === "BUY" ? (<span className="green">{action}</span>) : (<span className="red">SELL</span>)

    // Get the current balances so that we know the limits for our order
    var curr_0_balance = this.getItem(contracts[currencies[0]], "balanceOf", currency_0_key)
    var curr_1_balance = this.getItem(contracts[currencies[1]], "balanceOf", currency_1_key)

    // So we were passed in the most up to date info the older component had.
    // However this can and will change if it was stale or other people are taking the order.
    // This keeps the info up to date and fallsback onto the old data if an error happens.
    var updated_info = this.getUpdatedInfo()
    
    // Build object that swaps values for buys and sells so that rendering is simple
    var giving = {
      "currency": null,
      "balance": 0,
      "offered": 0,
      "max_take": 0,
      "receive_currency": null,
      "will_receive": 0
    }
    var will_receive = ui_amount === "" ? 0 : ui_amount

    if(action === "BUY") {
      giving["currency"] = currencies[1]
      giving["receive_currency"] = currencies[0]
      giving["balance"] = curr_1_balance
      giving["ui_balance"] = Math.round(web3.utils.fromWei(curr_1_balance, 'ether') * 1000) / 1000
      giving["offered"] = updated_info["curr_1_amt"]
      giving["ui_offered"] = Math.round(web3.utils.fromWei(updated_info["curr_1_amt"], 'ether') * 1000) / 1000
      giving["will_receive"] = Math.round((will_receive / updated_info["price"]) * 1000) / 1000
    } else {
      giving["currency"] = currencies[0]
      giving["receive_currency"] = currencies[1]
      giving["balance"] = curr_0_balance
      giving["ui_balance"] = Math.round(web3.utils.fromWei(curr_0_balance, 'ether') * 1000) / 1000
      giving["offered"] = updated_info["curr_0_amt"]
      giving["ui_offered"] = Math.round(web3.utils.fromWei(updated_info["curr_0_amt"], 'ether') * 1000) / 1000
      giving["will_receive"] = Math.round((will_receive * updated_info["price"]) * 1000) / 1000
    }
    giving["max_take"] = giving["balance"].lt(giving["offered"]) ? giving["balance"] : giving["offered"]

    return (
      <div className="Side_bar">
        <Sidebar as={Segment} animation="overlay" direction="right" visible={visible} id="Side_bar">
          <div id="Side_bar-x-container">
            <Icon name="close" onClick={toggleSidebar} id="Side_bar-x" size="large" />
          </div>
          <div id="Side_bar-title">Take Order</div>
          <div id="Side_bar-subtitle">How much would you like to {subtitle}?</div>
          
          <div id="Side_bar-info">
            <div className="Side_bar-info-item">
              <div className="Side_bar-info-title">Price:</div>
              <div className="Side_bar-info-content">{this.numberWithCommas(updated_info["price"])} <span id="Side_bar-exchange">{currencies[1]} / {currencies[0]}</span></div>
            </div>

            <div className="Side_bar-info-item">
              <div className="Side_bar-info-title">Balance {giving["currency"]}:</div>
              <div className="Side_bar-info-content">{this.numberWithCommas(giving["ui_balance"])} <span id="Side_bar-exchange">{giving["currency"]}</span></div>
            </div>

            <div className="Side_bar-info-item">
              <div className="Side_bar-info-title">Offered {giving["currency"]}:</div>
              <div className="Side_bar-info-content">{this.numberWithCommas(giving["ui_offered"])} <span id="Side_bar-exchange">{giving["currency"]}</span></div>
            </div>
          </div>

          <Form size='tiny' id="Side_bar-form">
            <Form.Field>
              <div>
                <div className="Side_bar-info-title">Spend {giving["currency"]}:</div>
                <Input
                  label={{ basic: true, content: giving["currency"] }}
                  labelPosition='right'
                  placeholder='Enter Amount...'
                  value={ui_amount}
                  onChange={(e) => { this.handleUserChange(e.target.value) }}
                />
              </div>
            </Form.Field>
            <Button.Group id="Side_bar-mini-buttons" size='mini' basic>
              <Button onClick={ () => this.handleUserChange("") } >0%</Button>
              <Button onClick={ () => this.handleAmountPercentageChange(giving["max_take"].div(bignumbers[4])) } >25%</Button>
              <Button onClick={ () => this.handleAmountPercentageChange(giving["max_take"].div(bignumbers[2])) } >50%</Button>
              <Button onClick={ () => this.handleAmountPercentageChange(giving["max_take"].mul(bignumbers[3]).div(bignumbers[4])) } >75%</Button>
              <Button onClick={ () => this.handleAmountPercentageChange(giving["max_take"]) } >100%</Button>
            </Button.Group>
          </Form>
          <div className="Side_bar-info-item">
            <div className="Side_bar-info-title">Will Receive</div>
            <div className="Side_bar-info-content">{giving["will_receive"].toString() + " " + giving["receive_currency"]}</div>
          </div>

          <Button className="BuySell-button" color={action === "BUY" ? "green" : "red"} disabled={ui_amount === "" || web3.utils.toBN(amount).gt(giving["max_take"])} onClick={this.executeTrade}>{action} {currencies[0]}</Button>

        </Sidebar>
      </div>
    );
  }
}

export default SideBar
