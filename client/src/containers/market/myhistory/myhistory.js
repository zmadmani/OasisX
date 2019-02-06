import React, { Component } from 'react'
import { ethers } from 'ethers';
import { Table } from 'semantic-ui-react'

import HumanName from '../../utils/humanname/humanname'

import './myhistory.css'

class MyHistory extends Component {
  constructor(props) {
    super(props)
    this.state = {
      loading: true
    }
  }

  componentDidMount() {
    if(this.props.orders.length > 0) {
      this.setState({ loading: false })
    }
  }

  getMax(orders) {
    return Math.max.apply(Math, orders.map(function(o) { return o.curr_1 }))
  }

  shouldComponentUpdate(nextProps, nextState) {
    if(this.state.loading && !nextState.loading) {
      return true
    } else if(this.props.orders.length !== nextProps.orders.length) {
      this.setState({ loading: false })
      return true
    } else {
      return false
    }
  }

  numberWithCommas(x) {
      var parts = x.toString().split(".");
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      return parts.join(".");
  }

  getMyOrders() {
    var { orders, account } = this.props
    var myOrders = []

    for(var i = 0; i < orders.length; i++) {
      let order = orders[i]
      if(order["maker"] === account) {
        let new_order = Object.assign({}, order)
        new_order["participant"] = new_order["taker"]
        new_order["type"] = new_order["type"] === "BUY" ? "SELL" : "BUY"
        myOrders.push(new_order)
      } else if(order["taker"] === account) {
        let new_order = Object.assign({}, order)
        new_order["participant"] = new_order["maker"]
        myOrders.push(new_order)
      }
    }
    return myOrders
  }

  render() {
    var { loading } = this.state
    var { currencies } = this.props

    var offers_table = null
    var background_item = null
    var orders = this.getMyOrders()

    if(loading) {
      background_item = (<div id="MarketHistory-empty">Loading...</div>)
    } else if(orders.length === 0) {
      background_item = (<div id="MarketHistory-empty">NO ORDERS</div>)
    } else {
      var max_order = this.getMax(orders)
      offers_table = (<Table.Body id="MarketHistory-tableBody">
            {orders.map((item, index) => {
              var ratio = item["curr_1"]/max_order * 100
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
              var price = item["type"] === "BUY" ? (<span className="green MarketHistory-type">{this.numberWithCommas(Math.round(item["price"] * 1000)/1000)}</span>) : (<span className="red MarketHistory-type">{this.numberWithCommas(Math.round(item["price"] * 1000)/1000)}</span>)
              return (
                <Table.Row key={index} style={style}>
                  <Table.Cell>
                    <div className='MarketHistory-table-entry'>{price}</div>
                  </Table.Cell>

                  <Table.Cell>
                    <div className='MarketHistory-table-entry'>{item["timestamp"]}</div>
                  </Table.Cell>

                  <Table.Cell>
                    <div className='MarketHistory-table-entry'>{this.numberWithCommas(Math.round(ethers.utils.formatUnits(item["curr_0"], 'ether') * 1000) / 1000 )}</div>
                  </Table.Cell>

                  <Table.Cell  textAlign='left'>
                    <div className='MarketHistory-table-entry'>{this.numberWithCommas(Math.round(ethers.utils.formatUnits(item["curr_1"], 'ether') * 1000) / 1000 )}</div>
                  </Table.Cell>
                
                  <Table.Cell width={1}>
                    <div className='MarketHistory-table-entry'><HumanName address={item["participant"]} icon_only /></div>
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
              <Table.HeaderCell className='MarketHistory-table-header' textAlign='left'>Price</Table.HeaderCell>
              <Table.HeaderCell className='MarketHistory-table-header' textAlign='left'>Time</Table.HeaderCell>
              <Table.HeaderCell className='MarketHistory-table-header' textAlign='left'>{currencies[0]}</Table.HeaderCell>
              <Table.HeaderCell className='MarketHistory-table-header' textAlign='left'>{currencies[1]}</Table.HeaderCell>
              <Table.HeaderCell className='MarketHistory-table-header' textAlign='left'>Participant</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          { offers_table }
        </Table>
        { background_item }
      </div>
    );
  }
}

export default MyHistory
