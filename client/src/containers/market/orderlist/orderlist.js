import React, { Component } from 'react'
import { Table } from 'semantic-ui-react'

import './orderlist.css'

class OrderList extends Component {
  constructor(props) {
    super(props)
    this.state = {
      orders: null,
      timeout: null,
      max_order: null
    }

    this.buildRow = this.buildRow.bind(this)
    this.updateOrders = this.updateOrders.bind(this)
  }

  async componentDidMount() {
    this.updateOrders()
  }

  shouldComponentUpdate(nextProps, nextState) {
    if(nextState.orders !== this.state.orders) {
      return true
    } else {
      return false
    }
  }

  componentWillUnmount() {
    if(this.state.timeout !== null) {
      clearTimeout(this.state.timeout)
    }
  }

  async updateOrders() {
    var orders = await this.getOrders()
    var max_order = Math.max.apply(Math, orders.map(function(o) { return o.curr_1_amt; }))
    var timeout = setTimeout(this.updateOrders, 5000)
    this.setState({ orders, timeout, max_order })
  }

  async getOrders() {
    var { drizzle, currencies, type } = this.props
    var market = drizzle.contracts.Market

    if(currencies.length === 2) {
      var token_addr_0 = drizzle.contracts[currencies[0]].address
      var token_addr_1 = drizzle.contracts[currencies[1]].address

      var pay_token = null
      var buy_token = null

      if(type === "BUY") {
        pay_token = token_addr_1
        buy_token = token_addr_0
      } else {
        pay_token = token_addr_0
        buy_token = token_addr_1
      }

      const rawOrders = await drizzle.contracts.SupportMethods.methods.getOffers(market.address, pay_token, buy_token).call()
      var orders = []
      if(rawOrders) {
        orders = this.processOrders(rawOrders)
      }
      return orders
    }
  }

  processOrders(rawOrders) {
    var { type } = this.props

    var n = rawOrders["ids"].length
    var orders = []
    for(var i = 0; i < n; i++) {
      if(rawOrders["ids"][i] !== "0") {
        var id = rawOrders["ids"][i]
        var pay_amount = this.props.drizzle.web3.utils.fromWei(rawOrders["payAmts"][i].toString(), 'ether')
        var buy_amount = this.props.drizzle.web3.utils.fromWei(rawOrders["buyAmts"][i].toString(), 'ether') 
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
            "type": type
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
            "type": type
          }
        }
        orders.push(order)
      }
    }

    return orders
  }

  numberWithCommas(x) {
      var parts = x.toString().split(".");
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      return parts.join(".");
  }

  buildRow(item, index) {
    var { max_order } = this.state
    var { type } = this.props

    var ratio = item["curr_1_amt"]/max_order * 100
    var direction = "right"
    var color_0 = "rgba(255, 0, 0, 0.2)"
    var color_1 = "rgba(0,0,0,0)"
    if(type === "BUY") {
      color_0 = "rgba(0, 255, 0, 0.1)"
      color_1 = "rgba(0, 0, 0, 0)"
    }
    var style = { backgroundImage: `linear-gradient(to ${direction}, ${color_0} , ${color_0}), linear-gradient(to ${direction}, ${color_1}, ${color_1})` ,
      backgroundSize: `calc(${ratio}%) 100%`,
      backgroundRepeat: `no-repeat`
    }

    return (
      <Table.Row key={item["id"]} onClick={() => this.props.setSidebar(item) } className="OrderList-table-row" style={style}>
        <Table.Cell>
          <div className='OrderList-table-entry'>{this.numberWithCommas(item["price"])}</div>
        </Table.Cell>

        <Table.Cell>
          <div className='OrderList-table-entry'>{this.numberWithCommas(item["curr_0_amt"])}</div>
        </Table.Cell>

        <Table.Cell  textAlign='left'>
          <div className='OrderList-table-entry'>{this.numberWithCommas(item["curr_1_amt"])}</div>
        </Table.Cell>
      </Table.Row>
    )
  }

  render() {
    var { orders } = this.state
    var { currencies } = this.props

    if(!orders) {
      return (
        <div className="OrderList">
          <div className="OrderList-loading">Error...</div>
        </div>
      )
    }

    if(orders.length === 0) {
      return (
        <div className="OrderList">
          <div className="OrderList-loading">Loading...</div>
        </div>
      )
    }

    return (
      <div className="OrderList">
        <Table striped basic celled unstackable id="OrderList-table">
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell className='OrderList-table-header' textAlign='left'>Price</Table.HeaderCell>
              <Table.HeaderCell className='OrderList-table-header' textAlign='left'>{currencies[0]}</Table.HeaderCell>
              <Table.HeaderCell className='OrderList-table-header' textAlign='left'>{currencies[1]}</Table.HeaderCell>
            </Table.Row>
          </Table.Header>

          <Table.Body id="OrderList-tableBody">
            {orders.map(this.buildRow)}
          </Table.Body>
        </Table>

      </div>
    );
  }
}

export default OrderList
