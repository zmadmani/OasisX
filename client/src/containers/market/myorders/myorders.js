import React, { Component } from 'react'
import { Table, Button } from 'semantic-ui-react'

import './myorders.css'

class MyOrders extends Component {
  constructor(props) {
    super(props)
    this.state = {
      loading: false
    }
  }

  componentDidMount() {
  }

  componentWillMount() {
  }

  numberWithCommas(x) {
      var parts = x.toString().split(".");
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      return parts.join(".");
  }

  extractMyOrders(keys) {
    var { SupportMethods } = this.props.drizzleState.contracts

    let account = this.props.drizzleState.accounts[0]
    // list of 2 keys. One from buy orderbook and the other from sell orderbook
    if(keys && keys.length === 2 && keys[0] && keys[1]) {
      var offers = []
      for(var i = 0; i < 2; i++) {
        var key = keys[i]
        var type = i === 0 ? "BUY" : "SELL"
        // If the key is valid
        if("getOffers" in SupportMethods && key in SupportMethods.getOffers) {
          var offersRaw = SupportMethods.getOffers[key].value
          // If the key value is valid
          if(offersRaw && "owners" in offersRaw) {
            // Iterate thru the owners and add the orders that match the current account
            for(var j = 0; j < offersRaw["owners"].length; j++) {
              if(account === offersRaw["owners"][j]) {
                var id = offersRaw["ids"][j]
                var pay_amt = this.props.drizzle.web3.utils.fromWei(offersRaw["payAmts"][j].toString(), 'ether')
                var buy_amt = this.props.drizzle.web3.utils.fromWei(offersRaw["buyAmts"][j].toString(), 'ether')
                if(type === "BUY") {
                  var price = Math.round(pay_amt / buy_amt * 1000) / 1000
                  pay_amt = Math.round(pay_amt * 1000) / 1000
                  buy_amt = Math.round(buy_amt * 1000) / 1000
                  offers.push([price, buy_amt, pay_amt, id])
                } else {
                  price = Math.round(buy_amt / pay_amt * 1000) / 1000
                  buy_amt = Math.round(buy_amt * 1000) / 1000
                  pay_amt = Math.round(pay_amt * 1000) / 1000
                  offers.push([price, pay_amt, buy_amt, id])
                }
              }
            }
          }
        }
      }
      return offers
    } else {
      return []
    }
  }

  cancelOrder(id) {
    var { Market } = this.props.drizzle.contracts
    let account = this.props.drizzleState.accounts[0]

    console.log("CANCEL ORDER " + id)
    const cancel = Market.methods.cancel
    cancel.cacheSend(id, {from: account })
  }

  render() {
    var { currencies, offersKeys } = this.props

    var offers = this.extractMyOrders(offersKeys)
    var offers_table = null
    var background_item = null

    if(offers.length === 0) {
      background_item = (<div id="MyOrders-empty">NO ORDERS</div>)
    } else {
      offers_table = (<Table.Body id="MyOrders-tableBody">
            {offers.map((item, index) => {
              return (
                <Table.Row key={index}>
                  <Table.Cell  textAlign='left'>
                    <div className='MyOrders-table-entry'><Button className="MyOrders-button" color='red' size='mini' inverted onClick={() => {this.cancelOrder(item[3])}}>CANCEL</Button></div>
                  </Table.Cell>

                  <Table.Cell>
                    <div className='MyOrders-table-entry'>{this.numberWithCommas(item[0])}</div>
                  </Table.Cell>

                  <Table.Cell>
                    <div className='MyOrders-table-entry'>{this.numberWithCommas(item[1])}</div>
                  </Table.Cell>

                  <Table.Cell  textAlign='left'>
                    <div className='MyOrders-table-entry'>{this.numberWithCommas(item[2])}</div>
                  </Table.Cell>
                </Table.Row>
              )
            })}
          </Table.Body>)
    }

    return (
      <div className="MyOrders">
        <Table selectable basic celled columns={4} id="MyOrders-table">
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell className='MyOrders-table-header' textAlign='left'>Action</Table.HeaderCell>
              <Table.HeaderCell className='MyOrders-table-header' textAlign='left'>Price</Table.HeaderCell>
              <Table.HeaderCell className='MyOrders-table-header' textAlign='left'>{currencies[0]}</Table.HeaderCell>
              <Table.HeaderCell className='MyOrders-table-header' textAlign='left'>{currencies[1]}</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          { offers_table }
        </Table>
        { background_item }
      </div>
    );
  }
}

export default MyOrders
