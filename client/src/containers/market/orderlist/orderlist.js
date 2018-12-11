import React, { Component } from 'react'
import { Table } from 'semantic-ui-react'

import './orderlist.css'

class OrderList extends Component {
  constructor(props) {
    super(props)
    this.state = {
      offersKey: null
    }
  }

  componentWillReceiveProps(nextProps) {
    this.setState({ offersKey: nextProps.offersKey })
  }

  numberWithCommas(x) {
      var parts = x.toString().split(".");
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      return parts.join(".");
  }

  render() {
    var { offersKey } = this.state
    var { currencies, type, setSidebar } = this.props
    var { SupportMethods } = this.props.drizzleState.contracts

    var offersRaw = {
      "ids": []
    }

    if(offersKey in SupportMethods.getOffers) {
      offersRaw = SupportMethods.getOffers[offersKey].value
    }

    if(!offersRaw) {
      return (
        <div className="OrderList">
          <div className="OrderList-loading">Error...</div>
        </div>
      )
    }

    var n = offersRaw["ids"].length
    var offers = []
    for(var i = 0; i < n; i++) {
      if(offersRaw["ids"][i] !== "0") {
        var id = offersRaw["ids"][i]
        var pay_amount = this.props.drizzle.web3.utils.fromWei(offersRaw["payAmts"][i].toString(), 'ether')
        var buy_amount = this.props.drizzle.web3.utils.fromWei(offersRaw["buyAmts"][i].toString(), 'ether') 
        var price = 0
        var offer = {}
        if(type === "buy") {
          price = Math.round(pay_amount / buy_amount * 1000) / 1000
          buy_amount = Math.round(buy_amount * 1000) / 1000
          pay_amount = Math.round(pay_amount * 1000) / 1000
          offer = {
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
          offer = {
            "price": price,
            "curr_0_amt": pay_amount,
            "curr_1_amt": buy_amount,
            "id": id,
            "type": type
          }
        }
        offers.push(offer)
      } else {
        break
      }
    }

    if(offers.length === 0) {
      return (
        <div className="OrderList">
          <div className="OrderList-loading">Loading...</div>
        </div>
      )
    }

    return (
      <div className="OrderList">
        <Table selectable basic celled id="OrderList-table">
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell className='OrderList-table-header' textAlign='left'>Price</Table.HeaderCell>
              <Table.HeaderCell className='OrderList-table-header' textAlign='left'>{currencies[0]}</Table.HeaderCell>
              <Table.HeaderCell className='OrderList-table-header' textAlign='left'>{currencies[1]}</Table.HeaderCell>
            </Table.Row>
          </Table.Header>

          <Table.Body id="OrderList-tableBody">
            {offers.map((item, index) => {
              return (
                <Table.Row key={item["id"]} onClick={() => setSidebar(item) } className="OrderList-table-row">
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
            })}
          </Table.Body>
        </Table>

      </div>
    );
  }
}

export default OrderList
