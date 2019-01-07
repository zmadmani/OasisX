import React, { Component } from 'react'
import { Statistic, Grid, Icon } from 'semantic-ui-react'
import Chart from './chart/chart'

import './stats.css'

class Stats extends Component {
  constructor(props) {
    super(props)
    this.state = {
      loading: true,
      orders: [],
      stats: {
        num_users: "...",
        num_buys: "...",
        num_sells: "...",
        buy_volume: "...",
        sell_volume: "..."
      },
      subsciption: null
    }

    this.buildStat = this.buildStat.bind(this)
  }

  async componentDidMount() {
    this.setState({loading: true})
    var orders = await this.getPastOrders()
    this.setState({ orders }, this.updateStats)
    var subscription = await this.subscribeToEvents()
    this.setState({ subscription })
  }

  componentWillUnmount() {
    if(this.state.subscription) {
      this.state.subscription.unsubscribe()
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    if(this.are_stats_updated(this.state.stats, nextState.stats)) {
      return true
    } else {
      return false
    }
  }

  are_stats_updated(old_stats, new_stats) {
    if(old_stats["num_users"] !== new_stats["num_users"] ||
      old_stats["num_buys"] !== new_stats["num_buys"] ||
      old_stats["num_sells"] !== new_stats["num_sells"] ||
      old_stats["buy_volume"] !== new_stats["buy_volume"] ||
      old_stats["sell_volume"] !== new_stats["sell_volume"] ) {
      return true
    } else {
      return false
    }
  }

  updateStats() {
    var new_stats = {
      num_users: 0,
      num_buys: 0,
      num_sells: 0,
      buy_volume: 0,
      sell_volume: 0
    }

    var users = {}
    var orders = this.state.orders
    for(var i = 0; i < orders.length; i++) {
      var order = orders[i]

      // Check if maker is in user list
      if(!(order["maker"] in users)) {
        users[order["maker"]] = 1
        new_stats["num_users"] += 1
      }

      // Check if taker is in user list
      if(!(order["taker"] in users)) {
        users[order["taker"]] = 1
        new_stats["num_users"] += 1
      }

      // Check if order is buy or sell and add the necessary info
      if(order["type"] === "BUY") {
        new_stats["num_buys"] += 1
        new_stats["buy_volume"] += order["curr_2"]
      } else if(order["type"] === "SELL") {
        new_stats["num_sells"] += 1
        new_stats["sell_volume"] += order["curr_2"]
      }
    }

    new_stats["buy_volume"] = Math.round(new_stats["buy_volume"] * 100) / 100
    new_stats["sell_volume"] = Math.round(new_stats["sell_volume"] * 100) / 100

    this.setState({ stats: new_stats, loading: false })
  }

  async subscribeToEvents() {
    var { currencies, drizzle } = this.props
    var { Market } = drizzle.contracts
    
    var web3 = drizzle.web3
    var latestBlock = await web3.eth.getBlockNumber()
    
    var curr_1_addr = drizzle.contracts[currencies[0]].address
    var curr_2_addr = drizzle.contracts[currencies[1]].address
    
    const hashKey1 = web3.utils.soliditySha3(curr_1_addr, curr_2_addr)
    const hashKey2 = web3.utils.soliditySha3(curr_2_addr, curr_1_addr)
    
    const market = new web3.eth.Contract(Market.abi, Market.address)
    var subscription = market.events.LogTake({
      filter: { pair: [hashKey1, hashKey2] },
      fromBlock: latestBlock
    }).on('data', function(event) {
      var orders = this.eventsToOrders([event])
      this.setState({ orders: orders.concat(this.state.orders) }, this.updateStats)
    }.bind(this))

    return subscription
  }

  componentWillMount() {
  }

  numberWithCommas(x) {
      var parts = x.toString().split(".");
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      return parts.join(".");
  }

  getType(order) {
    var { currencies, drizzle } = this.props

    var curr_1_addr = drizzle.contracts[currencies[0]].address
    var curr_2_addr = drizzle.contracts[currencies[1]].address

    var buy_addr = order["buy_gem"]
    var pay_addr = order["pay_gem"]

    if(buy_addr === curr_1_addr && pay_addr === curr_2_addr) {
      return "SELL"
    } else if(buy_addr === curr_2_addr && pay_addr === curr_1_addr) {
      return "BUY"
    } else {
      return null
    }
  }

  getPrice(pay_amt, buy_amt, type) {
    var price = 0
    if(type === "BUY") {
      price = Math.round(pay_amt / buy_amt * 1000) / 1000
      buy_amt = Math.round(buy_amt * 1000) / 1000
      pay_amt = Math.round(pay_amt * 1000) / 1000
      return [price, buy_amt, pay_amt]
    } else {
      price = Math.round(buy_amt / pay_amt * 1000) / 1000
      buy_amt = Math.round(buy_amt * 1000) / 1000
      pay_amt = Math.round(pay_amt * 1000) / 1000
      return [price, pay_amt, buy_amt]
    }
  }

  eventsToOrders(events) {
    var orders = []
    for(var i = 0; i < events.length; i++) {
      var order = events[i].returnValues
      var type = this.getType(order)
      var pay_amt = this.props.drizzle.web3.utils.fromWei(order["give_amt"].toString(), 'ether')
      var buy_amt = this.props.drizzle.web3.utils.fromWei(order["take_amt"].toString(), 'ether')
      var offer = this.getPrice(pay_amt, buy_amt, type)
      var timestamp = new Date(order["timestamp"] * 1000)
      timestamp = timestamp.toLocaleTimeString() + " " + timestamp.toLocaleDateString()
      order = {
        "raw_timestamp": order["timestamp"] * 1000,
        "timestamp": timestamp,
        "type": type,
        "price": offer[0],
        "curr_1": offer[1],
        "curr_2": offer[2],
        "taker": order["taker"],
        "maker": order["maker"]
      }
      orders.push(order)
    }
    orders.reverse()
    return orders
  }

  async getPastOrders() {
    var { currencies, drizzle } = this.props
    var { Market } = drizzle.contracts
    var web3 = drizzle.web3
    var latestBlock = await web3.eth.getBlockNumber()

    var curr_1_addr = drizzle.contracts[currencies[0]].address
    var curr_2_addr = drizzle.contracts[currencies[1]].address
    const hashKey1 = web3.utils.soliditySha3(curr_1_addr, curr_2_addr)
    const hashKey2 = web3.utils.soliditySha3(curr_2_addr, curr_1_addr)

    const market = new web3.eth.Contract(Market.abi, Market.address)
    var events = await market.getPastEvents("LogTake", {
      filter: { pair: [hashKey1, hashKey2] },
      fromBlock: latestBlock - 5760,
      toBlock: 'latest'
    })

    events.sort(function(first, second) {
      return first.returnValues.timestamp - second.returnValues.timestamp
    })

    var orders = this.eventsToOrders(events)
    return orders
  }

  buildStat(key) {
    if(this.state.stats[key] === "...") {
      return <span className="loading_value">{this.state.stats[key]}</span>
    }
    var value = this.numberWithCommas(this.state.stats[key])
    if(key === "buy_volume" || key === "sell_volume") {
      value = <span className="value">{value.toString()} <span className="sub_value">{this.props.currencies[1]}</span></span>
    }
    return value
  }

  render() {
    var { orders } = this.state
    var { currencies } = this.props

    var keys = ["num_users", "num_buys", "num_sells", "buy_volume", "sell_volume"]
    var statistics = {}
    for(var i = 0; i < keys.length; i++) {
      var key = keys[i]
      statistics[key] = this.buildStat(key)
    }

    var chart = <div id="Stats-chart"><Chart orders={orders} currencies={currencies} /></div>

    return (
      <div className="Stats">
        {chart}
        <Grid id="Stats-grid">
          <Grid.Row>
            <Grid.Column mobile={16} tablet={5} computer={5} textAlign="center">
              <Statistic className="Stats-statistic" label={<span className="label"><Icon name='user' />Num Users</span>} value={statistics["num_users"]} inverted />
            </Grid.Column>
            <Grid.Column mobile={8} tablet={5} computer={5} textAlign="center">
              <Statistic className="Stats-statistic" label={<span className="label"><Icon name='angle up' />Num Buys</span>} value={statistics["num_buys"]} inverted />
            </Grid.Column>
            <Grid.Column mobile={8} tablet={5} computer={5} textAlign="center">
              <Statistic className="Stats-statistic" label={<span className="label"><Icon name='angle down' />Num Sells</span>} value={statistics["num_sells"]} inverted />
            </Grid.Column>
          </Grid.Row>
          <Grid.Row>
            <Grid.Column mobile={16} tablet={8} computer={8} textAlign="center">
              <Statistic className="Stats-statistic" label={"Buy Volume"} value={statistics["buy_volume"]} inverted size="tiny" />
            </Grid.Column>
            <Grid.Column mobile={16} tablet={8} computer={8} textAlign="center">
              <Statistic className="Stats-statistic" label={"Sell Volume"} value={statistics["sell_volume"]} inverted size="tiny" />
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </div>
    );
  }
}

export default Stats
