import React, { Component } from 'react'
import { ContractData, ContractForm } from 'drizzle-react-components'
import { Grid } from 'semantic-ui-react'

import Chart from './chart/chart'
import OrderList from './orderlist/orderlist'
import BuySell from './buysell/buysell'

import './market.css'

class Market extends Component {
  constructor(props) {
    super(props)
    this.state = {
      currencies: [],
      buyOffers: [],
      sellOffers: [],
      keys: {
        numBuys: null,
        numSells: null,
        bestBuyOffer: null,
        bestSellOffer: null
      }
    }

    this.pollForOrders(false)
  }

  componentDidMount() {
    var { drizzle, drizzleState } = this.props
    var currencies = this.props.pair.split("_")

    var buy_token_addr = drizzle.contracts[currencies[0]].address
    var sell_token_addr = drizzle.contracts[currencies[1]].address

    const numBuysKey = drizzle.contracts.Market.methods.getOfferCount.cacheCall(sell_token_addr, buy_token_addr)
    const bestBuyOffer = drizzle.contracts.Market.methods.getBestOffer.cacheCall(sell_token_addr, buy_token_addr)

    const numSellsKey = drizzle.contracts.Market.methods.getOfferCount.cacheCall(buy_token_addr, sell_token_addr)
    const bestSellOffer = drizzle.contracts.Market.methods.getBestOffer.cacheCall(buy_token_addr, sell_token_addr)

    let keys = Object.assign({}, this.state.keys)
    keys["numBuys"] = numBuysKey
    keys["numSells"] = numSellsKey
    keys["bestBuyOffer"] = bestBuyOffer
    keys["bestSellOffer"] = bestSellOffer

    this.setState({currencies, keys})
  }

  pollForOrders = (initialized) => {
    var timeout = 100
    if(initialized) {
      timeout = 60000
    }

    setTimeout(() => {
      if(this.isInitialized()) {
        var { keys } = this.state
        var market = this.props.drizzleState.contracts.Market
        var numBuys = market.getOfferCount[keys["numBuys"]].value
        var numSells = market.getOfferCount[keys["numSells"]].value
        var bestBuyId = market.getBestOffer[keys["bestBuyOffer"]].value
        var bestSellId = market.getBestOffer[keys["bestSellOffer"]].value
        this.setState({ buyOffers: [], sellOffers: [] })
        if(numSells && numBuys && bestBuyId && bestSellId) {
          this.buildOrderBook(bestBuyId, numBuys, "buy")
          this.buildOrderBook(bestSellId, numSells, "sell")
          this.pollForOrders(true)
        } else {
          this.pollForOrders(false)
        }
      } else {
        this.pollForOrders(false)
      }
    }, timeout)
  }

  isInitialized() {
    var { keys } = this.state
    var { drizzle, drizzleState } = this.props
    var market = drizzleState.contracts.Market

    if(keys["numBuys"] in market.getOfferCount 
      && keys["numSells"] in market.getOfferCount
      && keys["bestBuyOffer"] in market.getBestOffer
      && keys["bestSellOffer"] in market.getBestOffer) {
      return true
    } else {
      return false
    }
  }

  buildOrderBook = async (id, num_orders, type) => {
    var market = this.props.drizzle.contracts.Market
    var offers = []
    var next_id = 0

    var web3 = this.props.drizzle.web3

    var i = 0;
    while(i < num_orders) {
      try {
        next_id = await market.methods.getWorseOffer(id).call()
        var order_data = await market.methods.getOffer(id).call()

        if(type==="buy") {
        console.log(order_data)
          
        }

        let pay_amount = Math.round(this.props.drizzle.web3.utils.fromWei(order_data[0].toString(), 'ether') * 1000) / 1000
        let buy_amount = Math.round(this.props.drizzle.web3.utils.fromWei(order_data[2].toString(), 'ether') * 1000) / 1000

        if(type === "buy") {
          let price = Math.round(pay_amount / buy_amount * 1000) / 1000
          offers.push([price, buy_amount, pay_amount])
          // this.setState({ buyOffers: offers })
        } else if(type === "sell") {
          let price = Math.round(buy_amount / pay_amount * 1000) / 1000
          offers.push([price, pay_amount, buy_amount])
          // this.setState({ sellOffers: offers })
        } else {
          return
        }

        id = next_id
        i++
        if(i % 5 === 0) {
          if(type === "buy") {
            this.setState({ buyOffers: offers })
          } else {
            this.setState({ sellOffers: offers })
          }
        }
      } catch(err) {
        console.log(err)
        break
      }
    }

    if(type === "buy") {
      this.setState({ buyOffers: offers })
    } else {
      this.setState({ sellOffers: offers })
    }
  }

  render() {
    var { currencies, buyOffers, sellOffers, keys } = this.state
    var { Market } = this.props.drizzleState.contracts

    var title = "OTC Market: "
    if(currencies.length == 2) {
      title = title + currencies[0] + "/" + currencies[1]
    }

    var numBuys = null
    var numSells = null
    if(keys["numBuys"] in Market.getOfferCount) {
      numBuys = Market.getOfferCount[keys["numBuys"]].value
    }
    if(keys["numSells"] in Market.getOfferCount) {
      numSells = Market.getOfferCount[keys["numSells"]].value
    }

    return (
      <div className="Market">
        <div id="Market-title"><span className="Market-h1">{title}</span></div>
        <div id="Market-buysell"><BuySell currencies={currencies} /></div>
        <Grid columns={2} divided id="Market-orderlists">
          <Grid.Row>
            <Grid.Column>
              <div className="Market-headers">{currencies[0]} <span className="green">Buy</span> Orders ({numBuys})</div>
              <OrderList currencies={currencies} orders={buyOffers} />
            </Grid.Column>
            <Grid.Column>
              <div className="Market-headers">{currencies[0]} <span className="red">Sell</span> Orders ({numSells})</div>
              <OrderList currencies={currencies} orders={sellOffers} />
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </div>
    );
  }
}

export default Market
