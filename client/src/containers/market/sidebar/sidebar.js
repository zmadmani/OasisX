import React, { Component } from 'react'
import { Sidebar, Segment, Icon, Input, Form, Button, Loader } from 'semantic-ui-react'

import './sidebar.css'

class SideBar extends Component {
  constructor(props) {
    super(props)
    this.state = {
      loading: false,
      visible: false,
      amount: '0',
      ui_amount: '',
      currency_0_balance: "0",
      currency_1_balance: "0",
      id: null,
      info: null,
      owner: null,
      bignumbers: {},
      button_loading: false,
      button_success: false,
      button_error: false
    }

    this.updateInfo = this.updateInfo.bind(this)
    this.stopLoading = this.stopLoading.bind(this)
    this.flashError = this.flashError.bind(this)
    this.flashSuccess = this.flashSuccess.bind(this)
  }

  // Get the balances for each of the currencies since we will need that throughout the component
  componentDidMount() {
    this.generateBigNumbers()
    this.updateInfo()
  }

  async updateInfo() {
    var { drizzle, drizzleState, currencies } = this.props
    if(this.state.visible && this.state.id) {
      let account = drizzleState.accounts[0]

      const currency_0_balance = await drizzle.contracts[currencies[0]].methods.balanceOf(account).call()
      const currency_1_balance = await drizzle.contracts[currencies[1]].methods.balanceOf(account).call()
      const info = await drizzle.contracts.Market.methods.getOffer(this.state.id).call()
      const owner = await drizzle.contracts.Market.methods.getOwner(this.state.id).call()
      this.setState({ currency_0_balance, currency_1_balance, info, owner })
    }
    setTimeout(this.updateInfo, 1000)
  }

  generateBigNumbers() {
    var bignumbers = {}
    for(var i = 0; i <= 10; i++) {
      var key = i
      bignumbers[key] = this.props.drizzle.web3.utils.toBN(key)
    }

    this.setState({ bignumbers })
  }

  stopLoading() {
    this.setState({ loading: false })
  }

  // Need to update visible and the side_bar info key if a new order is passed in
  async componentWillReceiveProps(nextProps) {
    if(nextProps.visible !== this.props.visible) {
      this.setState({ visible: nextProps.visible })
      if(nextProps.visible === false) {
        this.setState({ info: null, owner: null, amount: '0', ui_amount: '', button_success: false, button_error: false, button_loading: false })
      }
    }
    if(nextProps.sidebar_info !== this.props.sidebar_info) {
      this.setState({ loading: true })
      const info = await this.props.drizzle.contracts.Market.methods.getOffer(nextProps.sidebar_info["id"]).call()
      const owner = await this.props.drizzle.contracts.Market.methods.getOwner(nextProps.sidebar_info["id"]).call()
      this.setState({ id: nextProps.sidebar_info["id"], info, owner, amount: '0', ui_amount: '' })
      setTimeout(this.stopLoading, 150)
    }
  }

  flashSuccess() {
    var { toggleSidebar } = this.props
    this.setState({ button_success : true, button_loading: false })
    setTimeout(toggleSidebar, 1500)
  }

  flashError() {
    this.setState({ button_error: true, button_loading: false })
    setTimeout(() => this.setState({ button_error: false }), 1500)
  }

  // Most important function in the entire file since it actually interfaces
  // and edits the blockchain.
  executeTrade = (will_receive) => {
    var { drizzle, drizzleState, sidebar_info } = this.props
    const account = drizzleState.accounts[0]
    const web3 = drizzle.web3

    var id = sidebar_info["id"]

    // Log the inputs for the transaction so that you can always be 100% positive what is being sent
    var inputs = {
      "id": id,
      "will_receive": will_receive.toString(),
      "will_receive_wholenums": web3.utils.fromWei(will_receive.toString(), 'ether')
    }
    console.log(inputs)

    drizzle.contracts.Market.methods.buy(id, will_receive.toString()).send({from: account, gasPrice: web3.utils.toWei('5', 'gwei') })
      .on('receipt', this.flashSuccess)
      .on('error', this.flashError)

    this.setState({ button_loading: true })
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
        internal_value = this.props.drizzle.web3.utils.toWei(value.toString(), 'ether').toString()
      }
    } catch (err) {
      console.log(err)
      return
    }
    this.setState({ ui_amount: value, amount: internal_value })
  }

  handleAmountPercentageChange(value) {
    var ui_value = this.props.drizzle.web3.utils.fromWei(value.toString(), 'ether')
    this.setState({ amount: value.toString(), ui_amount: ui_value })
  }

  // So we were passed in the most up to date info the older component had.
  // However this can and will change if it was stale or other people are taking the order.
  // This keeps the info up to date and fallsback onto the old data if an error happens.
  getUpdatedInfo() {
    var { info } = this.state
    var { sidebar_info } = this.props

    var info_obj = {}
    if(!info) {
      return null
    }

    var buy_amt = info[0]
    var pay_amt = info[2]
    if(sidebar_info["type"] === "BUY") {
      info_obj = {
        "price": sidebar_info["price"],
        "curr_0_amt": pay_amt.toString(),
        "curr_1_amt": buy_amt.toString()
      }
    } else {
      info_obj = {
        "price": sidebar_info["price"],
        "curr_0_amt": buy_amt.toString(),
        "curr_1_amt": pay_amt.toString()
      }
    }

    return info_obj
  }

  calcWillReceive() {
    var { drizzle } = this.props
    var { amount } = this.state
    const web3 = drizzle.web3

    // Don't forget that these are flipped from the actual smart contract docs since
    // WE are the counterparties so buy_amt/pay_amt is flipped from expected
    var buy_amt = web3.utils.toBN(this.state.info[0])
    var pay_amt = web3.utils.toBN(this.state.info[2])

    let amount_bn = web3.utils.toBN(amount)
    try {
      let will_receive = amount_bn.mul(buy_amt).div(pay_amt)
      return will_receive
    } catch(err) {
      return web3.utils.toBN("0")
    }
  }

  getMaxTake() {
    var { sidebar_info, drizzle } = this.props
    var { info, currency_0_balance, currency_1_balance } = this.state
    const web3 = drizzle.web3

    var pay_amt = web3.utils.toBN(info[2])
    var balance = sidebar_info["type"] === "BUY" ? web3.utils.toBN(currency_0_balance) : web3.utils.toBN(currency_1_balance)
    if(balance.lt(pay_amt)) {
      return balance
    } else {
      return pay_amt
    }
  }

  render() {
    var { visible, amount, ui_amount, currency_0_balance, currency_1_balance, bignumbers, loading, button_loading, button_error, button_success, owner } = this.state
    var { currencies, toggleSidebar, sidebar_info } = this.props
    const web3 = this.props.drizzle.web3

    // Invert the type since the action do as a taker is the inverse of the action of the maker
    var action = sidebar_info["type"] === "BUY" ? "SELL" : "BUY"
    var subtitle = action === "BUY" ? (<span className="green">{action}</span>) : (<span className="red">SELL</span>)

    // So we were passed in the most up to date info the older component had.
    // However this can and will change if it was stale or other people are taking the order.
    // This keeps the info up to date and fallsback onto the old data if an error happens.
    var updated_info = this.getUpdatedInfo()
    if(!updated_info || loading) {
      return (
        <div className="Side_bar">
          <Sidebar as={Segment} animation="overlay" direction="right" visible={visible} id="Side_bar">
            <div id="Side_bar-x-container">
              <Icon name="close" onClick={toggleSidebar} id="Side_bar-x" size="large" />
            </div>
            <div id="Side_bar-title">Take Order</div>
            <Loader active>Loading</Loader>
          </Sidebar>
        </div>
      )
    }

    // Build object that swaps values for buys and sells so that rendering is simple
    var giving = {
      "currency": null,
      "receive_currency": null,
      "balance": 0,
      "offered": 0,
      "max_take": this.getMaxTake(),
      "will_receive": this.calcWillReceive(),
      "maker": owner ? owner.substring(0, 10) + " ... " + owner.substring(owner.length - 10, owner.length) : "Loading...",
    }
    giving["ui_will_receive"] = Math.round(web3.utils.fromWei(giving["will_receive"].toString()) * 1000) / 1000

    if(action === "BUY") {
      giving["currency"] = currencies[1]
      giving["receive_currency"] = currencies[0]
      giving["balance"] = web3.utils.toBN(currency_1_balance)
      giving["ui_balance"] = Math.round(web3.utils.fromWei(currency_1_balance.toString(), 'ether') * 1000) / 1000
      giving["offered"] = web3.utils.toBN(updated_info["curr_1_amt"])
      giving["ui_offered"] = Math.round(web3.utils.fromWei(updated_info["curr_1_amt"], 'ether') * 1000) / 1000
    } else {
      giving["currency"] = currencies[0]
      giving["receive_currency"] = currencies[1]
      giving["balance"] = web3.utils.toBN(currency_0_balance)
      giving["ui_balance"] = Math.round(web3.utils.fromWei(currency_0_balance.toString(), 'ether') * 1000) / 1000
      giving["offered"] = web3.utils.toBN(updated_info["curr_0_amt"])
      giving["ui_offered"] = Math.round(web3.utils.fromWei(updated_info["curr_0_amt"], 'ether') * 1000) / 1000
    }

    // Adjust the text on the button if an action or error just occurred
    var button_text = action + " " + currencies[0]
    button_text = button_success ? "SUCCESS" : button_text
    button_text = button_error ? "FAILED" : button_text

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
              <div className="Side_bar-info-title">Maker:</div>
              <div className="Side_bar-info-content">{giving["maker"]}</div>
            </div>

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
            <div className="Side_bar-info-content">{giving["ui_will_receive"].toString() + " " + giving["receive_currency"]}</div>
          </div>

          <Button className="BuySell-button" loading={button_loading} color={action === "BUY" ? "green" : "red"} disabled={button_text !== action + " " + currencies[0] || giving["will_receive"].lte(web3.utils.toBN("1000")) || web3.utils.toBN(amount).gt(giving["max_take"])} onClick={() => this.executeTrade(giving["will_receive"]) }>{button_text}</Button>

        </Sidebar>
      </div>
    );
  }
}

export default SideBar
