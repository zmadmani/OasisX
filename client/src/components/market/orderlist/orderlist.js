import React, { Component } from 'react'
import { Table, Icon } from 'semantic-ui-react'

import HumanName from '../../utils/humanname/humanname'

import './orderlist.css'

class OrderList extends Component {
  constructor(props) {
    super(props)
    this.state = {
      max_order: null
    }

    this.buildRow = this.buildRow.bind(this)
  }

  // async componentDidMount() {
  //   this.updateOrders()
  // }

  getMax(orders) {
    return Math.max.apply(Math, orders.map(function(o) { return o.curr_1_amt }))
  }

  shouldComponentUpdate(nextProps, nextState) {
    if(nextProps.orders !== this.props.orders) {
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

  buildRow(item, index, max_order) {
    var { type, account } = this.props

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

    var class_names = "OrderList-table-row "
    if(account === item["maker"]) {
      class_names += "OrderList-my-order"
    }

    return (
      <Table.Row className={class_names} key={item["id"]} onClick={() => this.props.setSidebar(item) } style={style}>
        <Table.Cell textAlign='left' width={1}>
          <div className='OrderList-table-entry OrderList-icon'><HumanName inactive_link icon_only address={item["maker"]} /></div>
        </Table.Cell>
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
    // var { orders } = this.state
    var { currencies, orders } = this.props

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

    var max_order = this.getMax(orders)

    return (
      <div className="OrderList">
        <Table striped basic celled unstackable id="OrderList-table">
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell className='OrderList-table-header'><Icon name="user circle" size="large" /></Table.HeaderCell>
              <Table.HeaderCell className='OrderList-table-header' textAlign='left'>Price</Table.HeaderCell>
              <Table.HeaderCell className='OrderList-table-header' textAlign='left'>{currencies[0]}</Table.HeaderCell>
              <Table.HeaderCell className='OrderList-table-header' textAlign='left'>{currencies[1]}</Table.HeaderCell>
            </Table.Row>
          </Table.Header>

          <Table.Body id="OrderList-tableBody">
            {orders.map((item, index) => this.buildRow(item, index, max_order) )}
          </Table.Body>
        </Table>

      </div>
    );
  }
}

export default OrderList
