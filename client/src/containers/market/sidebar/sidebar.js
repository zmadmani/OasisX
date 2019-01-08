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
      this.setState({ currency_0_balance, currency_1_balance, info })
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
        this.setState({ info: null, amount: '0', ui_amount: '', button_success: false, button_error: false, button_loading: false })
      }
    }
    if(nextProps.sidebar_info !== this.props.sidebar_info) {
      this.setState({ loading: true })
      const info = await this.props.drizzle.contracts.Market.methods.getOffer(nextProps.sidebar_info["id"]).call()
      this.setState({ id: nextProps.sidebar_info["id"], info, amount: '0', ui_amount: '' })
      setTimeout(this.stopLoading, 250)
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
  executeTrade = () => {
    var { drizzle, drizzleState, sidebar_info } = this.props
    const account = drizzleState.accounts[0]
    const web3 = drizzle.web3

    var amount = this.state.amount === "" ? "0" : this.state.amount.toString()
    var will_receive = amount
    will_receive = web3.utils.fromWei(will_receive, 'ether')
    if(sidebar_info["type"] === "SELL") {
      will_receive /= sidebar_info["price"]
      will_receive = web3.utils.toWei(will_receive.toString(), 'ether')
      if(web3.utils.toBN(will_receive).gt(web3.utils.toBN(this.state.info[0]))) {
        will_receive = this.state.info[0]
      }
      if(web3.utils.toBN(amount).gte(web3.utils.toBN(this.state.currency_1_balance))) {
        let balance_bn = web3.utils.toBN(this.state.currency_1_balance)
        let offer_curr_1_bn = web3.utils.toBN(this.state.info[2])
        let offer_curr_0_bn = web3.utils.toBN(this.state.info[0])
        will_receive = balance_bn.mul(offer_curr_0_bn).div(offer_curr_1_bn)
      }
    } else {
      will_receive *= sidebar_info["price"]
      will_receive = web3.utils.toWei(will_receive.toString(), 'ether')
      if(web3.utils.toBN(will_receive).gt(web3.utils.toBN(this.state.info[2]))) {
        will_receive = this.state.info[2]
      }
      if(web3.utils.toBN(amount).gte(web3.utils.toBN(this.state.currency_0_balance))) {
        let balance_bn = web3.utils.toBN(this.state.currency_0_balance)
        let offer_curr_1_bn = web3.utils.toBN(this.state.info[0])
        let offer_curr_0_bn = web3.utils.toBN(this.state.info[2])
        will_receive = balance_bn.mul(offer_curr_1_bn).div(offer_curr_0_bn)
      }
    }

    var id = sidebar_info["id"]

    drizzle.contracts.Market.methods.buy(id, will_receive.toString()).send({from: account, gasPrice: web3.utils.toWei('5', 'gwei') })
      .on('receipt', this.flashSuccess)
      .on('error', this.flashError)

    this.setState({ button_loading: true })

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

  render() {
    var { visible, amount, ui_amount, currency_0_balance, currency_1_balance, bignumbers, loading, button_loading, button_error, button_success } = this.state
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
      giving["balance"] = web3.utils.toBN(currency_1_balance)
      giving["ui_balance"] = Math.round(web3.utils.fromWei(currency_1_balance.toString(), 'ether') * 1000) / 1000
      giving["offered"] = web3.utils.toBN(updated_info["curr_1_amt"])
      giving["ui_offered"] = Math.round(web3.utils.fromWei(updated_info["curr_1_amt"], 'ether') * 1000) / 1000
      giving["will_receive"] = Math.round((will_receive / updated_info["price"]) * 1000) / 1000
    } else {
      giving["currency"] = currencies[0]
      giving["receive_currency"] = currencies[1]
      giving["balance"] = web3.utils.toBN(currency_0_balance)
      giving["ui_balance"] = Math.round(web3.utils.fromWei(currency_0_balance.toString(), 'ether') * 1000) / 1000
      giving["offered"] = web3.utils.toBN(updated_info["curr_0_amt"])
      giving["ui_offered"] = Math.round(web3.utils.fromWei(updated_info["curr_0_amt"], 'ether') * 1000) / 1000
      giving["will_receive"] = Math.round((will_receive * updated_info["price"]) * 1000) / 1000
    }
    giving["max_take"] = giving["balance"].lt(giving["offered"]) ? giving["balance"] : giving["offered"]

    var button_text = action + " " + currencies[0]
    if(button_success) {
      button_text = "SUCCESS"
    }
    if(button_error) {
      button_text = "FAILED"
    }

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

          <Button className="BuySell-button" loading={button_loading} color={action === "BUY" ? "green" : "red"} disabled={button_text !== action + " " + currencies[0] || ui_amount === "" || web3.utils.toBN(amount).gt(giving["max_take"])} onClick={this.executeTrade}>{button_text}</Button>

        </Sidebar>
      </div>
    );
  }
}

export default SideBar
