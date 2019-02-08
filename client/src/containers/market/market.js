import React, { Component } from 'react'
import { ethers } from 'ethers';
import { Grid, Tab, Responsive } from 'semantic-ui-react'

// import Chart from './chart/chart'
import OrderListV2 from './orderlistV2/orderlistV2'
import LimitOrder from './limitorder/limitorder'
import MarketOrder from './marketorder/marketorder'
import MyOrders from './myorders/myorders'
import Stats from './stats/stats'
import MarketHistory from './markethistory/markethistory'
import Leaderboard from './leaderboard/leaderboard'
import MyHistory from './myhistory/myhistory'
import SideBar from './sidebar/sidebar'

import './market.css'

class Market extends Component {
  constructor(props) {
    super(props)
    this.state = {
      visible: false,
      account: "",
      sidebar_info: {
        "price": 0,
        "curr_0_amt": 0,
        "curr_1_amt": 0,
        "id": "",
        "type": ""
      },
      past_orders: [],
      open_buy_orders: [],
      open_sell_orders: [],
      num_buys: null,
      num_sells: null,
      balances: ['0', '0'],
      timers: [null, null]
    }

    this.updateBalances = this.updateBalances.bind(this)
    this.updateOpenOrders = this.updateOpenOrders.bind(this)
  }

  componentWillMount() {
  }

  async componentDidMount() {
    let account = await this.props.options.signer.getAddress()
    this.updateOpenOrders()
    this.updateBalances()
    this.setState({ account })
    let past_orders = await this.getPastOrders()
    this.setState({ past_orders })
    this.subscribeToEvents()
  }

  componentWillUnmount() {
    for(var i = 0; i < this.state.timers.length; i++) {
      if(this.state.timers[i] !== null) {
        clearTimeout(this.state.timers[i])
      }
    }

    var { options, currencies } = this.props
    var { Market } = options.contracts
    
    var curr_1_addr = options.contracts[currencies[0]].address
    var curr_2_addr = options.contracts[currencies[1]].address
    
    const hashKey1 = ethers.utils.solidityKeccak256(['bytes', 'bytes'], [curr_1_addr, curr_2_addr])
    const hashKey2 = ethers.utils.solidityKeccak256(['bytes', 'bytes'], [curr_2_addr, curr_1_addr])
    
    var filter1 = Market.filters.LogTake(null, hashKey1, null, null, null, null)
    var filter2 = Market.filters.LogTake(null, hashKey2, null, null, null, null)
    Market.removeAllListeners(filter1).removeAllListeners(filter2)
  }

  async updateBalances() {
    var { options, currencies } = this.props
    var { account } = this.state

    if(account !== "") {
      const currency_0_balance = await options.contracts[currencies[0]].balanceOf(account)
      const currency_1_balance = await options.contracts[currencies[1]].balanceOf(account)
      const balances = [currency_0_balance, currency_1_balance]
      this.setState({ balances })
    }
    var timer = setTimeout(this.updateBalances, 3000)
    var timers = this.state.timers
    timers[0] = timer
    this.setState({ timers })
  }

  async subscribeToEvents() {
    var { currencies, options } = this.props
    var { Market } = options.contracts
    
    // var latestBlock = await options.provider.getBlockNumber()
    
    var curr_1_addr = options.contracts[currencies[0]].address
    var curr_2_addr = options.contracts[currencies[1]].address
    
    const hashKey1 = ethers.utils.solidityKeccak256(['bytes', 'bytes'], [curr_1_addr, curr_2_addr])
    const hashKey2 = ethers.utils.solidityKeccak256(['bytes', 'bytes'], [curr_2_addr, curr_1_addr])
    
    var filter1 = Market.filters.LogTake(null, hashKey1, null, null, null, null)
    var filter2 = Market.filters.LogTake(null, hashKey2, null, null, null, null)
    Market.on(filter1, (id, pair, maker, pay_gem, buy_gem, taker, take_amt, give_amt, timestamp, event) => {
      var order = {
        "id": id,
        "pair": pair,
        "maker": maker,
        "pay_gem": pay_gem,
        "buy_gem": buy_gem,
        "taker": taker,
        "take_amt": take_amt,
        "give_amt": give_amt,
        "timestamp": timestamp
      }
      var orders = this.eventsToOrders([order])
      this.setState({ past_orders: orders.concat(this.state.past_orders) })
    })

    Market.on(filter2, (id, pair, maker, pay_gem, buy_gem, taker, take_amt, give_amt, timestamp, event) => {
      var order = {
        "id": id,
        "pair": pair,
        "maker": maker,
        "pay_gem": pay_gem,
        "buy_gem": buy_gem,
        "taker": taker,
        "take_amt": take_amt,
        "give_amt": give_amt,
        "timestamp": timestamp
      }
      var orders = this.eventsToOrders([order])
      this.setState({ past_orders: orders.concat(this.state.past_orders) })
    })
  }

  getType(order) {
    var { currencies, options } = this.props

    var curr_1_addr = options.contracts[currencies[0]].address
    var curr_2_addr = options.contracts[currencies[1]].address

    var buy_addr = order["buy_gem"].toUpperCase()
    var pay_addr = order["pay_gem"].toUpperCase()

    if(buy_addr === curr_1_addr.toUpperCase() && pay_addr === curr_2_addr.toUpperCase()) {
      return "SELL"
    } else if(buy_addr === curr_2_addr.toUpperCase() && pay_addr === curr_1_addr.toUpperCase()) {
      return "BUY"
    } else {
      return null
    }
  }

  getPrice(pay_amt, buy_amt, type) {
    pay_amt = ethers.utils.bigNumberify(pay_amt)
    buy_amt = ethers.utils.bigNumberify(buy_amt)

    if(pay_amt.lte(ethers.utils.bigNumberify("1000")) || buy_amt.lte(ethers.utils.bigNumberify("1000"))) {
      return false
    }

    var one = ethers.utils.bigNumberify(ethers.utils.parseUnits("1", "ether"))

    var price = 0
    if(type === "BUY") {
      price = parseFloat(ethers.utils.formatUnits(one.mul(pay_amt).div(buy_amt).toString(), 'ether'))
      return [price, buy_amt, pay_amt]
    } else {
      price = parseFloat(ethers.utils.formatUnits(one.mul(buy_amt).div(pay_amt).toString(), 'ether'))
      return [price, pay_amt, buy_amt]
    }
  }

  // Past Event Orders

  eventsToOrders(events) {
    var orders = []
    for(var i = 0; i < events.length; i++) {
      var order = events[i]
      var type = this.getType(order)
      var pay_amt = order["give_amt"].toString()
      var buy_amt = order["take_amt"].toString()
      var offer = this.getPrice(pay_amt, buy_amt, type)
      if(offer) {
        var timestamp = new Date(order["timestamp"] * 1000)
        timestamp = timestamp.toLocaleTimeString(undefined, {hour: 'numeric', minute: '2-digit'}) + " " + timestamp.toLocaleDateString(undefined, {day: 'numeric', month: 'numeric', year: '2-digit'})
        // timestamp = timestamp.toLocaleTimeString() + " " + timestamp.toLocaleDateString()
        order = {
          "raw_timestamp": order["timestamp"] * 1000,
          "timestamp": timestamp,
          "type": type,
          "price": offer[0],
          "curr_0": offer[1],
          "curr_1": offer[2],
          "taker": order["taker"],
          "maker": order["maker"]
        }
        orders.push(order)
      }
    }
    orders.reverse()
    return orders
  }

  async getPastOrders() {
    var { currencies, options } = this.props
    var { Market } = options.contracts
    var latestBlock = await options.provider.getBlockNumber()
    var fromBlock = latestBlock - (5760*5)

    var curr_1_addr = options.contracts[currencies[0]].address
    var curr_2_addr = options.contracts[currencies[1]].address
    const hashKey1 = ethers.utils.solidityKeccak256(['bytes', 'bytes'], [curr_1_addr, curr_2_addr])
    const hashKey2 = ethers.utils.solidityKeccak256(['bytes', 'bytes'], [curr_2_addr, curr_1_addr])

    var filter1 = Market.filters.LogTake(null, hashKey1, null, null, null, null)
    var filter2 = Market.filters.LogTake(null, hashKey2, null, null, null, null)
    filter1.fromBlock = fromBlock
    filter2.fromBlock = fromBlock

    var [events1, events2] = await Promise.all([options.provider.getLogs(filter1), options.provider.getLogs(filter2)])

    events1 = events1.map((item) => {
      var parsed = Market.interface.events.LogTake.decode(item.data, item.topics)
      return parsed
    })
    events2 = events2.map((item) => {
      var parsed = Market.interface.events.LogTake.decode(item.data, item.topics)
      return parsed
    })
    var events = events1.concat(events2)

    events.sort(function(first, second) {
      return parseInt(first.timestamp.toString()) - parseInt(second.timestamp.toString())
    })

    var orders = this.eventsToOrders(events)
    return orders
  }

  // Open Orders

  async updateOpenOrders() {
    var [open_buy_orders, open_sell_orders] = await Promise.all([this.getOpenOrders("BUY"), this.getOpenOrders("SELL")])
    // orders.sort(function(a, b) { return parseInt(a[3]) > parseInt(b[3]) ? 1 : -1 })
    var timer = setTimeout(this.updateOpenOrders, 5000)
    var timers =  this.state.timers
    timers[1] = timer
    this.setState({ timers, open_buy_orders, open_sell_orders })
  }

  async getOpenOrders(type) {
    var { options, currencies } = this.props
    var { Market } = options.contracts

    if(currencies.length === 2) {
      var token_addr_0 = options.contracts[currencies[0]].address
      var token_addr_1 = options.contracts[currencies[1]].address

      var pay_token = null
      var buy_token = null

      if(type === "BUY") {
        pay_token = token_addr_1
        buy_token = token_addr_0
      } else {
        pay_token = token_addr_0
        buy_token = token_addr_1
      }

      const rawOrders = await options.contracts.SupportMethods.getOffers(Market.address, pay_token, buy_token)
      var orders = []
      if(rawOrders) {
        orders = this.processOpenOrders(rawOrders, type)
      }
      return orders
    }
  }

  processOpenOrders(rawOrders, type) {
    var n = rawOrders["ids"].length
    var orders = []
    for(var i = 0; i < n; i++) {
      if(rawOrders["ids"][i].toString() !== "0") { // && rawOrders["owners"][i] === account
        var id = rawOrders["ids"][i].toString()
        var maker = rawOrders["owners"][i]
        var pay_amount = ethers.utils.formatUnits(rawOrders["payAmts"][i].toString(), 'ether')
        var buy_amount = ethers.utils.formatUnits(rawOrders["buyAmts"][i].toString(), 'ether') 
        var price = 0
        var order = {}
        if(type === "BUY") {
          price = Math.round(pay_amount / buy_amount * 1000) / 1000
          buy_amount = Math.round(buy_amount * 1000) / 1000
          pay_amount = Math.round(pay_amount * 1000) / 1000
          order = {
            "price": price,
            "curr_0_amt": buy_amount,
            "curr_1_amt": pay_amount,
            "id": id,
            "type": type,
            "maker": maker
          }
        } else {
          price = Math.round(buy_amount / pay_amount * 1000) / 1000
          buy_amount = Math.round(buy_amount * 1000) / 1000
          pay_amount = Math.round(pay_amount * 1000) / 1000
          order = {
            "price": price,
            "curr_0_amt": pay_amount,
            "curr_1_amt": buy_amount,
            "id": id,
            "type": type,
            "maker": maker
          }
        }
        orders.push(order)
      }
    }

    return orders
  }

  setSidebar = (info) => {
    this.setState({ sidebar_info: info, visible: true })
  }

  toggleSidebar = () => {
    this.setState({ visible: !this.state.visible })
  }

  render() {
    var { visible, sidebar_info, account, past_orders, balances, open_buy_orders, open_sell_orders } = this.state
    var { currencies, options } = this.props

    var title = "Market: "
    if(currencies.length === 2) {
      title = title + currencies[0] + "/" + currencies[1]
    }

    const all_open_orders = open_buy_orders.concat(open_sell_orders)
    all_open_orders.sort(function(a, b) { return parseInt(a[3]) > parseInt(b[3]) ? 1 : -1 })

    var activity_panes = [
      { menuItem: 'Market History', render: () => <Tab.Pane className="Market-tab-pane"><MarketHistory currencies={currencies} options={options} orders={past_orders} /></Tab.Pane> },
      { menuItem: '5-D Leaderboard', render: () => <Tab.Pane className="Market-tab-pane"><Leaderboard currencies={currencies} account={account} options={options} orders={past_orders} /></Tab.Pane> },
    ]

    if(!options.readOnly) {
      var logged_in_panes = [
        { menuItem: 'Open Orders', render: () => <Tab.Pane className="Market-tab-pane"><MyOrders currencies={currencies} options={options} orders={all_open_orders} account={account} /></Tab.Pane> },
        { menuItem: 'My History', render: () => <Tab.Pane className="Market-tab-pane"><MyHistory currencies={currencies} options={options} orders={past_orders} account={account} /></Tab.Pane> },
      ]
      activity_panes = logged_in_panes.concat(activity_panes)
    }

    const last_order = past_orders.length > 0 ? past_orders[0] : ""

    const buy_panes = [
      { menuItem: 'Limit Order', render: () => <Tab.Pane className="Market-tab-pane"><LimitOrder currencies={currencies} options={options} last_price={last_order["price"]} balances={balances} /></Tab.Pane> },
      { menuItem: 'Market Order', render: () => <Tab.Pane className="Market-tab-pane"><MarketOrder currencies={currencies} options={options} balances={balances} /></Tab.Pane> }
    ]

    return (
      <div className="Market">
        <SideBar currencies={currencies} toggleSidebar={this.toggleSidebar} sidebar_info={sidebar_info} visible={visible} account={account} options={options} />
        <div id="Market-title"><span className="Market-h1">{title}</span></div>
        <div className="Market-headers">5-Day Market Stats</div>
        <div id="Market-stats"><Stats currencies={currencies} options={options} orders={past_orders} /></div>

        <Grid divided id="Market-orderlists">
          <Grid.Column className="Market-orderlist" computer={8} tablet={8} mobile={16}>
            <div className="Market-headers">Order Center</div>
            <div id="Market-buysell">
              <Tab menu={{ fluid: true, tabular: true, attached: 'top' }} panes={buy_panes} />
            </div>
          </Grid.Column>
          <Grid.Column className="Market-orderlist" computer={8} tablet={8} mobile={16}>
            <div className="Market-headers">Order Book</div>
            <OrderListV2 currencies={currencies} account={account} options={options} last_order={last_order} buy_orders={open_buy_orders} sell_orders={open_sell_orders} setSidebar={this.setSidebar} />
          </Grid.Column>
        </Grid>

        <div className="Market-headers">Activity Center</div>
        <div id="Market-activity-pane">
          <Responsive minWidth={Responsive.onlyTablet.minWidth}>
            <Tab menu={{ fluid: true, tabular: true, attached: 'top' }} panes={activity_panes} />
          </Responsive>
          <Responsive maxWidth={Responsive.onlyTablet.minWidth}>
            <Tab menu={{ fluid: true, tabular: true, attached: 'top' }} panes={activity_panes.slice(0,3)} />
          </Responsive>
        </div>

        <Responsive maxWidth={Responsive.onlyTablet.minWidth}>
          <div id="Market-leaderboard-pane">
            <div className="Market-headers">Leaderboard</div>
            <Leaderboard currencies={currencies} account={account} options={options} orders={past_orders} />
          </div>
        </Responsive>
      </div>
    );
  }
}

export default Market