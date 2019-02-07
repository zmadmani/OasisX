import React, { Component } from 'react'
import { ethers } from 'ethers';
import { Grid } from 'semantic-ui-react'
import { AutoSizer, List } from 'react-virtualized'

import HumanName from '../../utils/humanname/humanname'

import './leaderboard.css'

class Leaderboard extends Component {
  constructor(props) {
    super(props)
    this.state = {
      loading: false,
      data: [],
      direction: 'ascending',
      column: 'profit'
    }
  }

  componentDidMount() {
    var new_data = this.eventsToData(this.props.orders)
    var max_profit = 1
    if(new_data.length > 0) {
      max_profit = Math.max(Math.abs(new_data[0]['profit']), Math.abs(new_data[new_data.length-1]['profit']))
    }
    this.setState({ max_profit, data: new_data })
  }

  componentWillMount() {
  }

  shouldComponentUpdate(nextProps, nextState) {
    if(this.props.orders.length !== nextProps.orders.length || this.state.data !== nextState.data || this.state.direction !== nextState.direction || this.state.column !== nextState.column) {
      if(this.props.orders.length !== nextProps.orders.length) {
        var new_data = this.eventsToData(nextProps.orders)
        var max_profit = 1
        if(new_data.length > 0) {
          max_profit = new_data[0]['profit']
        }
        this.setState({ max_profit, data: new_data})
      }
      return true
    } else {
      return false
    }
  }

  getPrice(pay_amt, buy_amt, type) {
    pay_amt = ethers.utils.bigNumberify(pay_amt)
    buy_amt = ethers.utils.bigNumberify(buy_amt)

    if(pay_amt.lte(ethers.utils.bigNumberify("1000")) || buy_amt.lte(ethers.utils.bigNumberify("1000"))) {
      return false
    }

    var one = ethers.utils.bigNumberify(ethers.utils.parseUnits("1", "ether"))

    var price = 0
    if(type === "BUY") {
      price = ethers.utils.formatUnits(one.mul(pay_amt).div(buy_amt).toString(), 'ether')
      // buy_amt = web3.utils.fromWei(buy_amt.toString(), 'ether')
      // pay_amt = web3.utils.fromWei(pay_amt.toString(), 'ether')
      return [price, buy_amt, pay_amt]
    } else {
      price = ethers.utils.formatUnits(one.mul(buy_amt).div(pay_amt).toString(), 'ether')
      // buy_amt = web3.utils.fromWei(buy_amt.toString(), 'ether')
      // pay_amt = web3.utils.fromWei(pay_amt.toString(), 'ether')
      return [price, pay_amt, buy_amt]
    }
  }

  numberWithCommas(x) {
      var parts = x.toString().split(".");
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      return parts.join(".");
  }

  newUserProfile(address) {
    return {
          "address": address,
          "amount_0_given": ethers.utils.bigNumberify("0"), // Amount weth sold
          "amount_1_received": ethers.utils.bigNumberify("0"), // Amount dai received for sells
          "amount_1_given": ethers.utils.bigNumberify("0"), // Amount dai given for buys
          "amount_0_received": ethers.utils.bigNumberify("0"), // Amount weth bought
        }
  }

  getProfit(avg_buy_order, avg_sell_order) {
    if(!avg_buy_order || !avg_sell_order) {
      return 0
    } else {
      var amount_sell = avg_sell_order[1]
      var amount_buy = avg_buy_order[1]
      var sell_price = avg_sell_order[0]
      var buy_price = avg_buy_order[0]
      var min_amount = amount_buy.lt(amount_sell) ? ethers.utils.formatUnits(amount_buy.toString(), 'ether') : ethers.utils.formatUnits(amount_sell.toString(), 'ether')
      var profit = Math.round(min_amount * (sell_price - buy_price) * 100) / 100
      return profit
    }
  }

  eventsToData(events) {
    var profiles = {}
    for(var i = 0; i < events.length; i++) {
      var order = events[i]

      // Assemble all necessary vars
      var maker = order["maker"]
      var taker = order["taker"]
      var buyer = null
      var seller = null

      // Add maker and taker into the dict if they are not present
      if(!(maker in profiles)) {
        profiles[maker] = this.newUserProfile(maker)
      }
      if(!(taker in profiles)) {
        profiles[taker] = this.newUserProfile(taker)
      }

      // Set who the buyer and who the seller is
      if(order["type"] === "BUY") {
        buyer = taker
        seller = maker
      } else {
        buyer = maker
        seller = taker
      }

      // Add to buyer and seller data dict
      var profile_data = profiles[buyer]
      profile_data["amount_1_given"] = profile_data["amount_1_given"].add(order["curr_1"])
      profile_data["amount_0_received"] = profile_data["amount_0_received"].add(order["curr_0"])
      profiles[buyer] = profile_data

      profile_data = profiles[seller]
      profile_data["amount_0_given"] = profile_data["amount_0_given"].add(order["curr_0"])
      profile_data["amount_1_received"] = profile_data["amount_1_received"].add(order["curr_1"])
      profiles[seller] = profile_data
    }

    var data = []
    for (var key in profiles) {
      let avg_buy_order = this.getPrice(profiles[key]["amount_1_given"], profiles[key]["amount_0_received"], "BUY")
      let avg_buy_price = avg_buy_order ? Math.round(avg_buy_order[0].toString() * 10) / 10 : "N/A"
      let avg_sell_order = this.getPrice(profiles[key]["amount_0_given"], profiles[key]["amount_1_received"], "SELL")
      let avg_sell_price = avg_sell_order ? Math.round(avg_sell_order[0].toString() * 10) / 10 : "N/A"
      let profit = this.getProfit(avg_buy_order, avg_sell_order)
      var data_point = {
        "user": key,
        "amount_0_bought": Math.round(ethers.utils.formatUnits(profiles[key]["amount_0_received"].toString(), 'ether') * 10) / 10,
        "avg_buy_price": avg_buy_price,
        "amount_0_sold": Math.round(ethers.utils.formatUnits(profiles[key]["amount_0_given"].toString(), 'ether') * 10) / 10,
        "avg_sell_price": avg_sell_price,
        "profit": profit
      }
      data.push(data_point)
    }

    data.sort(function(first, second) {
      return second.profit - first.profit
    })

    return data
  }

  handleSort(clicked_column) {
    const { column, data, direction } = this.state

    if(column !== clicked_column) {
      var new_data = data.concat().sort(function(first, second) {
                      if(first[clicked_column] === "N/A") {
                        return 1
                      } else if(second[clicked_column] === "N/A") {
                        return -1
                      } else {
                        return second[clicked_column] - first[clicked_column]
                      }
                    })
      this.setState({
        column: clicked_column,
        data: new_data,
        direction: 'ascending'
      })
    } else {
      this.setState({ 
        data: data.reverse(),
        direction: direction === 'ascending' ? 'descending' : 'ascending'
      })
    }
  }

  rowRenderer({index, key, style}) {
    var { max_profit } = this.state
    var { currencies, account } = this.props
    var item = this.state.data[index]

    var ratio = Math.abs(item["profit"])/max_profit * 100
    var direction = "right"
    var color_0 = "rgba(255, 0, 0, 0.2)"
    var color_1 = "rgba(0,0,0,0)"
    if(item["profit"] > 0) {
      color_0 = "rgba(0, 255, 0, 0.1)"
      color_1 = "rgba(0, 0, 0, 0)"
    }

    var color = index % 2 === 0 ? `#182026` : `#1c262c`

    if(account === item["user"]) {
      color =  `#3f4a50`
    }

    var custom_style = { 
      backgroundColor: color,
      backgroundImage: `linear-gradient(to ${direction}, ${color_0} , ${color_0}), linear-gradient(to ${direction}, ${color_1}, ${color_1})` ,
      backgroundSize: `calc(${ratio}%) 100%`,
      backgroundRepeat: `no-repeat`
    }
    style = Object.assign(custom_style, style)

    var profit_color = 'grey'
    if(item["profit"] > 0) {
      profit_color = 'green'
    } else if(item["profit"] < 0) {
      profit_color = 'red'
    }

    return (
      <div className="Leaderboard-table-entry" key={key} style={style}>
        <Grid padded={true}>
          <Grid.Column computer={4} tablet={6} mobile={10}>
            <HumanName address={item["user"]} />
          </Grid.Column>
          <Grid.Column computer={3} tablet={2} only={'computer tablet'}>
            <span>{item["amount_0_bought"] + " "}<span className="Leaderboard-subtext">{currencies[0]}</span></span>
          </Grid.Column>
          <Grid.Column computer={2} tablet={2} only={'computer tablet'}>
            {item["avg_buy_price"]}
          </Grid.Column>
          <Grid.Column computer={3} tablet={2} only={'computer tablet'}>
            <span>{item["amount_0_sold"] + " "}<span className="Leaderboard-subtext">{currencies[0]}</span></span>
          </Grid.Column>
          <Grid.Column computer={2} tablet={2} only={'computer tablet'}>
            {item["avg_sell_price"]}
          </Grid.Column>
          <Grid.Column computer={2} tablet={2} mobile={6}>
            <span className={profit_color}>{item["profit"] + " "}<span className="Leaderboard-subtext">{currencies[1]}</span></span>
          </Grid.Column>
        </Grid>
      </div>
    )
  }

  render() {
    var { loading, data, column, direction } = this.state

    var background_item = null

    if(loading) {
      background_item = (<div id="Leaderboard-empty">Loading...</div>)
    } else if(data.length === 0) {
      background_item = (<div id="Leaderboard-empty">NO DATA</div>)
    }

    var symbol = "▲"
    if(direction === 'descending') {
      symbol = "▼"
    }

    var headers = {
      "name": "Name",
      "amount_0_bought": "# Bought",
      "avg_buy_price": "Avg. Buy",
      "amount_0_sold": "# Sold",
      "avg_sell_price": "Avg. Sell",
      "profit": "Profit"
    }

    headers[column] = headers[column] + symbol

    return (
      <div className="Leaderboard">
        <Grid id="Leaderboard-table-header">
          <Grid.Column computer={4} tablet={6} mobile={10}>
            {headers["name"]}
          </Grid.Column>
          <Grid.Column computer={3} tablet={2} onClick={() => this.handleSort('amount_0_bought')} only={'computer tablet'}>
            {headers["amount_0_bought"]}
          </Grid.Column>
          <Grid.Column computer={2} tablet={2} onClick={() => this.handleSort('avg_buy_price')} only={'computer tablet'}>
            {headers["avg_buy_price"]}
          </Grid.Column>
          <Grid.Column computer={3} tablet={2} onClick={() => this.handleSort('amount_0_sold')} only={'computer tablet'}>
            {headers["amount_0_sold"]}
          </Grid.Column>
          <Grid.Column computer={2} tablet={2} onClick={() => this.handleSort('avg_sell_price')} only={'computer tablet'}>
            {headers["avg_sell_price"]}
          </Grid.Column>
          <Grid.Column computer={2} tablet={2} mobile={6} onClick={() => this.handleSort('profit')}>
            {headers["profit"]}
          </Grid.Column>
        </Grid>
        <AutoSizer style={{outline: 'none'}}>
          {({ height, width }) => (
            <List
              width={width}
              height={height - 50}
              rowHeight={50}
              rowCount={data.length}
              rowRenderer={(props) => this.rowRenderer(props)}
              className="Leaderboard-infinite-list"
            >
            </List>
          )}
        </AutoSizer>
        {background_item}
      </div>
    );
  }
}

export default Leaderboard