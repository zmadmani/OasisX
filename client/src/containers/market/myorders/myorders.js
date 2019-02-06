import React, { Component } from 'react'
import { Table, Button } from 'semantic-ui-react'

import './myorders.css'

class MyOrders extends Component {
  constructor(props) {
    super(props)
    this.state = {
    }

  }

  componentDidMount() {
  }

  // shouldComponentUpdate(nextProps, nextState) {
  //   if(nextState.orders !== this.state.orders) {
  //     return true
  //   } else {
  //     return false
  //   }
  // }

  getMyOrders() {
    var { orders, account } = this.props
    var myOrders = []
    for(var i = 0; i < orders.length; i++) {
      if(orders[i]["maker"] === account) {
        myOrders.push(orders[i])
      }
    }

    return myOrders
  }

  numberWithCommas(x) {
      var parts = x.toString().split(".");
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      return parts.join(".");
  }

  async cancelOrder(id) {
    var { Market } = this.props.options.contracts
    console.log("CANCEL ORDER " + id)
    try {
      var tx = await Market.cancel(id)
      await tx.wait()
    } catch (error) {
      console.log(error)
    }
  }

  render() {
    var { currencies } = this.props

    var orders_table = null
    var background_item = null
    var orders = this.getMyOrders()

    if(orders.length === 0) {
      background_item = (<div id="MyOrders-empty">NO ORDERS</div>)
    } else {
      orders_table = (<Table.Body id="MyOrders-tableBody">
            {orders.map((item, index) => {
              var price = item["type"] === "BUY" ? (<span className="green MyOrders-color">{this.numberWithCommas(item["price"])}</span>) : (<span className="red MyOrders-color">{this.numberWithCommas(item["price"])}</span>)
              return (
                <Table.Row key={index}>
                  <Table.Cell  textAlign='left'>
                    <div className='MyOrders-table-entry'><Button className="MyOrders-button" color='red' size='mini' inverted onClick={() => {this.cancelOrder(item["id"])}}>CANCEL</Button></div>
                  </Table.Cell>

                  <Table.Cell>
                    <div className='MyOrders-table-entry'>{price}</div>
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
