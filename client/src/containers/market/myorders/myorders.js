import React, { Component } from 'react'
import { Table, Button } from 'semantic-ui-react'

import './myorders.css'

class MyOrders extends Component {
  constructor(props) {
    super(props)
    this.state = {
      orders: [],
      timer: null
    }

    this.updateOrders = this.updateOrders.bind(this)
  }

  async componentDidMount() {
    this.updateOrders()
  }

  componentWillUnmount() {
    if(this.state.timer) {
      clearTimeout(this.state.timer)
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    if(nextState.orders !== this.state.orders) {
      return true
    } else {
      return false
    }
  }

  async updateOrders() {
    var buy_orders = await this.getOrders("BUY")
    var sell_orders = await this.getOrders("SELL")
    var orders = buy_orders.concat(sell_orders)
    orders.sort(function(a, b) {
      return parseInt(a[3]) > parseInt(b[3]) ? 1 : -1
    })
    var timer = setTimeout(this.updateOrders, 5000)
    this.setState({ timer, orders })
  }

  async getOrders(type) {
    var { drizzle, currencies } = this.props
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
        orders = this.processOrders(rawOrders, type)
      }
      return orders
    }
  }

  processOrders(rawOrders, type) {
    var { drizzleState } = this.props

    let account = drizzleState.accounts[0]
    var n = rawOrders["ids"].length
    var orders = []
    for(var i = 0; i < n; i++) {
      if(rawOrders["ids"][i] !== "0" && rawOrders["owners"][i] === account) {
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

  cancelOrder(id) {
    var { Market } = this.props.drizzle.contracts
    let account = this.props.drizzleState.accounts[0]

    console.log("CANCEL ORDER " + id)
    const cancel = Market.methods.cancel
    cancel.cacheSend(id, {from: account, gasPrice: this.props.drizzle.web3.utils.toWei('5', 'gwei') })
  }

  render() {
    var { orders } = this.state
    var { currencies } = this.props

    var orders_table = null
    var background_item = null

    if(orders.length === 0) {
      background_item = (<div id="MyOrders-empty">NO ORDERS</div>)
    } else {
      orders_table = (<Table.Body id="MyOrders-tableBody">
            {orders.map((item, index) => {
              var type = item["type"] === "BUY" ? (<span className="green MyOrders-color">{item["type"]}</span>) : (<span className="red">{item["type"]}</span>)
              return (
                <Table.Row key={index}>
                  <Table.Cell  textAlign='left'>
                    <div className='MyOrders-table-entry'><Button className="MyOrders-button" color='red' size='mini' inverted onClick={() => {this.cancelOrder(item["id"])}}>CANCEL</Button></div>
                  </Table.Cell>

                  <Table.Cell>
                    <div className='MyOrders-table-entry'>{type}</div>
                  </Table.Cell>

                  <Table.Cell>
                    <div className='MyOrders-table-entry'>{this.numberWithCommas(item["price"])}</div>
                  </Table.Cell>

                  <Table.Cell>
                    <div className='MyOrders-table-entry'>{this.numberWithCommas(item["curr_0_amt"])}</div>
                  </Table.Cell>

                  <Table.Cell  textAlign='left'>
                    <div className='MyOrders-table-entry'>{this.numberWithCommas(item["curr_1_amt"])}</div>
                  </Table.Cell>
                </Table.Row>
              )
            })}
          </Table.Body>)
    }

    return (
      <div className="MyOrders">
        <Table selectable striped basic celled unstackable columns={5} textAlign='left' id="MyOrders-table">
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell className='MyOrders-table-header' textAlign='left'>Action</Table.HeaderCell>
              <Table.HeaderCell className='MyOrders-table-header' textAlign='left'>Type</Table.HeaderCell>
              <Table.HeaderCell className='MyOrders-table-header' textAlign='left'>Price</Table.HeaderCell>
              <Table.HeaderCell className='MyOrders-table-header' textAlign='left'>{currencies[0]}</Table.HeaderCell>
              <Table.HeaderCell className='MyOrders-table-header' textAlign='left'>{currencies[1]}</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          { orders_table }
        </Table>
        { background_item }
      </div>
    );
  }
}

export default MyOrders
