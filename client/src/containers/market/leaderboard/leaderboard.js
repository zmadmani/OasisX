import React, { Component } from 'react'
import { Table } from 'semantic-ui-react'

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

  async componentDidMount() {
    this.setState({loading: true})
    var data = await this.getPastOrders()
    this.setState({ data, loading: false })
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
    var web3 = this.props.drizzle.web3
    pay_amt = web3.utils.toBN(pay_amt)
    buy_amt = web3.utils.toBN(buy_amt)

    if(pay_amt.lte(web3.utils.toBN("1000")) || buy_amt.lte(web3.utils.toBN("1000"))) {
      return false
    }

    var one = web3.utils.toBN(web3.utils.toWei("1", "ether"))

    var price = 0
    if(type === "BUY") {
      price = web3.utils.fromWei(one.mul(pay_amt).div(buy_amt).toString(), 'ether')
      // buy_amt = web3.utils.fromWei(buy_amt.toString(), 'ether')
      // pay_amt = web3.utils.fromWei(pay_amt.toString(), 'ether')
      return [price, buy_amt, pay_amt]
    } else {
      price = web3.utils.fromWei(one.mul(buy_amt).div(pay_amt).toString(), 'ether')
      // buy_amt = web3.utils.fromWei(buy_amt.toString(), 'ether')
      // pay_amt = web3.utils.fromWei(pay_amt.toString(), 'ether')
      return [price, pay_amt, buy_amt]
    }
  }

  newUserProfile(address) {
    var web3 = this.props.drizzle.web3
    return {
          "address": address,
          "amount_0_given": web3.utils.toBN("0"), // Amount weth sold
          "amount_1_received": web3.utils.toBN("0"), // Amount dai received for sells
          "amount_1_given": web3.utils.toBN("0"), // Amount dai given for buys
          "amount_0_received": web3.utils.toBN("0"), // Amount weth bought
        }
  }

  getProfit(avg_buy_order, avg_sell_order) {
    var web3 = this.props.drizzle.web3
    if(!avg_buy_order || !avg_sell_order) {
      return 0
    } else {
      var amount_sell = avg_sell_order[1]
      var amount_buy = avg_buy_order[1]
      var sell_price = avg_sell_order[0]
      var buy_price = avg_buy_order[0]
      var min_amount = amount_buy.lt(amount_sell) ? web3.utils.fromWei(amount_buy.toString(), 'ether') : web3.utils.fromWei(amount_sell.toString(), 'ether')
      var profit = Math.round(min_amount * (sell_price - buy_price) * 100) / 100
      return profit
    }
  }

  eventsToData(events) {
    var web3 = this.props.drizzle.web3
    var profiles = {}
    for(var i = 0; i < events.length; i++) {
      var order = events[i].returnValues
      var type = this.getType(order)
      var pay_amt = order["give_amt"].toString()
      var buy_amt = order["take_amt"].toString()
      var offer = this.getPrice(pay_amt, buy_amt, type)
      
      if(!offer) {
        continue
      }

      // Assemble all necessary vars
      var maker = order["maker"]
      var taker = order["taker"]
      var buyer = null
      var seller = null
      order = {
        "price": offer[0],
        "curr_0": offer[1],
        "curr_1": offer[2]
      }

      // Add maker and taker into the dict if they are not present
      if(!(maker in profiles)) {
        profiles[maker] = this.newUserProfile(maker)
      }
      if(!(taker in profiles)) {
        profiles[taker] = this.newUserProfile(taker)
      }

      // Set who the buyer and who the seller is
      if(type === "BUY") {
        buyer = taker
        seller = maker
      } else {
        buyer = maker
        seller = taker
      }

      // Add to buyer and seller data dict
      var profile_data = profiles[buyer]
      console.log(profile_data["amount_1_given"])
      console.log(order)
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
        "amount_0_bought": Math.round(web3.utils.fromWei(profiles[key]["amount_0_received"].toString(), 'ether') * 10) / 10,
        "avg_buy_price": avg_buy_price,
        "amount_0_sold": Math.round(web3.utils.fromWei(profiles[key]["amount_0_given"].toString(), 'ether') * 10) / 10,
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
      fromBlock: latestBlock - 5760,
      toBlock: 'latest'
    })

    var data = this.eventsToData(events)
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

  render() {
    var { loading, data, column, direction } = this.state
    var { currencies, drizzle } = this.props

    var table = null
    var background_item = null

    if(loading) {
      background_item = (<div id="Leaderboard-empty">Loading...</div>)
    } else if(data.length === 0) {
      background_item = (<div id="Leaderboard-empty">NO DATA</div>)
    } else {
      table = (<Table.Body id="Leaderboard-tableBody">
            {data.map((item, index) => {
              var color = 'grey'
              if(item["profit"] > 0) {
                color = 'green'
              } else if(item["profit"] < 0) {
                color = 'red'
              }
              return (
                <Table.Row key={index}>
                  <Table.Cell width={6}>
                    <div className='Leaderboard-table-entry'><HumanName address={item["user"]} drizzle={drizzle} /></div>
                  </Table.Cell>

                  <Table.Cell width={2}>
                    <div className='Leaderboard-table-entry'>{item["amount_0_bought"] + " " + currencies[0]}</div>
                  </Table.Cell>

                  <Table.Cell width={2}>
                    <div className='Leaderboard-table-entry'>{item["avg_buy_price"]}</div>
                  </Table.Cell>

                  <Table.Cell width={2}>
                    <div className='Leaderboard-table-entry'>{item["amount_0_sold"] + " " + currencies[0]}</div>
                  </Table.Cell>

                  <Table.Cell width={2}>
                    <div className='Leaderboard-table-entry'>{item["avg_sell_price"]}</div>
                  </Table.Cell>

                  <Table.Cell width={2}>
                    <div className='Leaderboard-table-entry'><span className={color}>{item["profit"] + " " + currencies[1]}</span></div>
                  </Table.Cell>
                </Table.Row>
              )
            })}
          </Table.Body>)
    }

    return (
      <div className="Leaderboard">
        <Table striped basic celled unstackable sortable id="Leaderboard-table">
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell className='Leaderboard-table-header' textAlign='left'>Name</Table.HeaderCell>
              <Table.HeaderCell sorted={column === 'amount_0_bought' ? direction : null} onClick={() => this.handleSort('amount_0_bought')} className='Leaderboard-table-header' textAlign='left'># Bought</Table.HeaderCell>
              <Table.HeaderCell sorted={column === 'avg_buy_price' ? direction : null} onClick={() => this.handleSort('avg_buy_price')} className='Leaderboard-table-header' textAlign='left'>Avg. Buy</Table.HeaderCell>
              <Table.HeaderCell sorted={column === 'amount_0_sold' ? direction : null} onClick={() => this.handleSort('amount_0_sold')} className='Leaderboard-table-header' textAlign='left'># Sold</Table.HeaderCell>
              <Table.HeaderCell sorted={column === 'avg_sell_price' ? direction : null} onClick={() => this.handleSort('avg_sell_price')} className='Leaderboard-table-header' textAlign='left'>Avg. Sell</Table.HeaderCell>
              <Table.HeaderCell sorted={column === 'profit' ? direction : null} onClick={() => this.handleSort('profit')} className='Leaderboard-table-header' textAlign='left'>Profit</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          { table }
        </Table>
        { background_item }
      </div>
    );
  }
}

export default Leaderboard
