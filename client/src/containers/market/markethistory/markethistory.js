import React, { Component } from 'react'
import { Table, Icon } from 'semantic-ui-react'

import HumanName from '../../utils/humanname/humanname'

import './markethistory.css'

class MarketHistory extends Component {
  constructor(props) {
    super(props)
    this.state = {
      loading: false,
      orders: [],
      max_order: null,
      subsciption: null
    }
  }

  async componentDidMount() {
    this.setState({loading: true})
    var orders = await this.getPastOrders()
    var max_order = Math.max.apply(Math, orders.map(function(o) { return o.curr_2; }))
    this.setState({ orders, max_order, loading: false })
    var subscription = await this.subscribeToEvents()
    this.setState({ subscription })
  }

  componentWillUnmount() {
    if(this.state.subscription) {
      this.state.subscription.unsubscribe()
    }
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
      this.setState({ orders: orders.concat(this.state.orders) })
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
      fromBlock: latestBlock - 2000,
      toBlock: 'latest'
    })

    events.sort(function(first, second) {
      return first.returnValues.timestamp - second.returnValues.timestamp
    })

    var orders = this.eventsToOrders(events)
    return orders
  }

  render() {
    var { loading, orders, max_order } = this.state
    var { currencies, drizzle } = this.props

    var offers_table = null
    var background_item = null

    if(loading) {
      background_item = (<div id="MarketHistory-empty">Loading...</div>)
    } else if(orders.length === 0) {
      background_item = (<div id="MarketHistory-empty">NO ORDERS</div>)
    } else {
      offers_table = (<Table.Body id="MarketHistory-tableBody">
            {orders.map((item, index) => {
              var ratio = item["curr_2"]/max_order * 100
              var direction = "right"
              var color_0 = "rgba(255, 0, 0, 0.2)"
              var color_1 = "rgba(0,0,0,0)"
              if(item["type"] === "BUY") {
                color_0 = "rgba(0, 255, 0, 0.1)"
                color_1 = "rgba(0, 0, 0, 0)"
              }
              var style = { backgroundImage: `linear-gradient(to ${direction}, ${color_0} , ${color_0}), linear-gradient(to ${direction}, ${color_1}, ${color_1})` ,
                backgroundSize: `calc(${ratio}%) 100%`,
                backgroundRepeat: `no-repeat`
              }
              var type = item["type"] === "BUY" ? (<span className="green MarketHistory-type">BUY</span>) : (<span className="red MarketHistory-type">SELL</span>)
              var participants = (<div className="MarketHistory-participants">
                                    <div className="MarketHistory-participant"><HumanName drizzle={drizzle} icon_only address={item["taker"]} /></div>
                                    <div className="MarketHistory-arrow"><Icon size="large" name="long arrow alternate right" /></div>
                                    <div className="MarketHistory-participant"><HumanName drizzle={drizzle} icon_only address={item["maker"]} /></div>
                                  </div>)
              return (
                <Table.Row key={index} style={style}>
                  <Table.Cell>
                    <div className='MarketHistory-table-entry'>{type}</div>
                  </Table.Cell>

                  <Table.Cell>
                    <div className='MarketHistory-table-entry'>{item["timestamp"]}</div>
                  </Table.Cell>

                  <Table.Cell>
                    <div className='MarketHistory-table-entry'>{participants}</div>
                  </Table.Cell>

                  <Table.Cell>
                    <div className='MarketHistory-table-entry'>{this.numberWithCommas(item["price"])}</div>
                  </Table.Cell>

                  <Table.Cell>
                    <div className='MarketHistory-table-entry'>{this.numberWithCommas(item["curr_1"])}</div>
                  </Table.Cell>

                  <Table.Cell  textAlign='left'>
                    <div className='MarketHistory-table-entry'>{this.numberWithCommas(item["curr_2"])}</div>
                  </Table.Cell>
                </Table.Row>
              )
            })}
          </Table.Body>)
    }

    return (
      <div className="MarketHistory">
        <Table striped basic celled unstackable id="MarketHistory-table">
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell className='MarketHistory-table-header' textAlign='left'>Type</Table.HeaderCell>
              <Table.HeaderCell className='MarketHistory-table-header' textAlign='left'>Time</Table.HeaderCell>
              <Table.HeaderCell className='MarketHistory-table-header' textAlign='center'>Participants</Table.HeaderCell>
              <Table.HeaderCell className='MarketHistory-table-header' textAlign='left'>Price</Table.HeaderCell>
              <Table.HeaderCell className='MarketHistory-table-header' textAlign='left'>{currencies[0]}</Table.HeaderCell>
              <Table.HeaderCell className='MarketHistory-table-header' textAlign='left'>{currencies[1]}</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          { offers_table }
        </Table>
        { background_item }
      </div>
    );
  }
}

export default MarketHistory
