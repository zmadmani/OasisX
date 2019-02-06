import React, { Component } from 'react'
import { Grid, Icon } from 'semantic-ui-react'
import { AutoSizer, List } from 'react-virtualized'

import HumanName from '../../utils/humanname/humanname'

import './orderlistV2.css'

class OrderListV2 extends Component {
  constructor(props) {
    super(props)
    this.state = {
    }

    this.max_order = 1
    this.orders = []
  }

  componentDidMount() {
  }

  getMax(orders) {
    return Math.max.apply(Math, orders.map(function(o) { return o.curr_1_amt }))
  }

  componentDidUpdate(prevProps, prevState) {
    if(prevProps.buy_orders.length === 0 || prevProps.sell_orders.length === 0) {

    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    if(nextProps.buy_orders !== this.props.buy_orders || nextProps.sell_orders !== this.props.sell_orders || nextProps.last_order !== this.props.last_order) {
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

  rowRenderer({index, key, style}) {
    var item = this.orders[index]
    if(item.maker === "0") {
      var { last_order } = this.props
      let price = "..."
      if(last_order["price"]) {
        price = last_order["type"] === "BUY" ? (<span className="green">{this.numberWithCommas(Math.round(last_order["price"] * 100)/100) + "▲"}</span>) : (<span className="red">{this.numberWithCommas(Math.round(last_order["price"] * 100)/100)  + "▼" }</span>)
      }
      return (
        <div id="OrderListV2-table-middle" key={key} style={style} >
          <Grid padded={true}>
            <Grid.Column computer={2} tablet={2} mobile={2}>
            </Grid.Column>
            <Grid.Column computer={4} tablet={4} mobile={4}>
              {price}
            </Grid.Column>
            <Grid.Column computer={5} tablet={5} mobile={5}>
            </Grid.Column>
            <Grid.Column computer={5} tablet={5} mobile={5}>
              Last Price
            </Grid.Column>
          </Grid>
        </div>
      )      
    }

    var { account } = this.props
    var type = item["type"]
    var ratio = item["curr_1_amt"]/this.max_order * 100
    var direction = "right"
    var color_0 = "rgba(255, 0, 0, 0.2)"
    var color_1 = "rgba(0,0,0,0)"
    if(type === "BUY") {
      color_0 = "rgba(0, 255, 0, 0.1)"
      color_1 = "rgba(0, 0, 0, 0)"
    }

    var color = index % 2 === 0 ? `#182026` : `#1c262c`
    if(account === item["maker"]) {
      color = `#3f4a50`
    }

    var custom_style = { 
      backgroundColor: color,
      backgroundImage: `linear-gradient(to ${direction}, ${color_0} , ${color_0}), linear-gradient(to ${direction}, ${color_1}, ${color_1})` ,
      backgroundSize: `calc(${ratio}%) 100%`,
      backgroundRepeat: `no-repeat`
    }

    style = Object.assign(custom_style, style)
    let price = item["type"] === "BUY" ? (<span className="green">{this.numberWithCommas(Math.round(item["price"] * 100)/100)}</span>) : (<span className="red">{this.numberWithCommas(Math.round(item["price"] * 100)/100)}</span>)
    return (
      <div className="OrderListV2-table-entry" key={key} style={style} onClick={() => this.props.setSidebar(item) } >
        <Grid divided padded={true}>
          <Grid.Column computer={2} tablet={2} mobile={3}>
            <HumanName inactive_link icon_only address={item["maker"]} />
          </Grid.Column>
          <Grid.Column computer={4} tablet={4} mobile={4}>
            {price}
          </Grid.Column>
          <Grid.Column computer={5} tablet={5} mobile={4}>
            {this.numberWithCommas(item["curr_0_amt"])}
          </Grid.Column>
          <Grid.Column computer={5} tablet={5} mobile={5}>
            {this.numberWithCommas(item["curr_1_amt"])}
          </Grid.Column>
        </Grid>
      </div>
    )
  }

  render() {
    // var { orders } = this.state
    var { currencies, buy_orders, sell_orders } = this.props

    var sell_orders_reverse = sell_orders.slice(0)
    sell_orders_reverse.reverse()
    sell_orders_reverse.push({
      "maker": "0",
      "price": "0",
      "curr_0_amt": "0",
      "curr_1_amt": "0"
    })

    if(sell_orders.length === 0 && buy_orders.length === 0) {
      return (
        <div className="OrderListV2">
          <div className="OrderListV2-loading">Loading...</div>
        </div>
      )
    }

    this.max_order = Math.max(this.getMax(sell_orders), this.getMax(buy_orders))
    this.orders = sell_orders_reverse.concat(buy_orders)

    return (
      <div className="OrderListV2">
        <Grid id="OrderListV2-table-header">
          <Grid.Column computer={2} tablet={2} mobile={2}>
            <Icon name="user circle" size="large" />
          </Grid.Column>
          <Grid.Column computer={4} tablet={4} mobile={4}>
            Price
          </Grid.Column>
          <Grid.Column computer={5} tablet={5} mobile={5}>
            {currencies[0]}
          </Grid.Column>
          <Grid.Column computer={5} tablet={5} mobile={5}>
            {currencies[1]}
          </Grid.Column>
        </Grid>
        <AutoSizer style={{outline: 'none'}}>
          {({ height, width }) => (
            <List
              width={width}
              height={height - 50}
              rowHeight={50}
              rowCount={this.orders.length}
              rowRenderer={(props) => this.rowRenderer(props)}
              scrollToIndex={sell_orders_reverse.length + 5}
              className="OrderListV2-infinite-list"
            >
            </List>
          )}
        </AutoSizer>
      </div>
    );
  }
}

export default OrderListV2