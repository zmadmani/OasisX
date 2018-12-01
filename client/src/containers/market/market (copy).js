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
      numBuys: 0,
      bestBuyOfferId: 0,
      bestBuyOffer: {},
      bestSellOffer: {},
      numSells: 0,
      bestSellOfferId: 0,
      buyOffers: [],
      sellOffers: []
    }
    this.updateOrders(false)
  }

  componentWillMount() {
    var currencies = this.props.pair.split("_")
    this.setState({currencies: currencies}, () => {
      this.getBuyOrders()
      this.getSellOrders()
    })
  }

  updateOrders = (initialized) => {
    var timeout = 100000
    if(!initialized) {
      timeout = 100
    }

    setTimeout(() => {
      if(this.state.numBuys !== 0 && this.state.numSells !== 0 && this.state.bestBuyOfferId !== 0 && this.state.bestSellOfferId !== 0) {
        const buy_worst_key = this.context.drizzle.contracts["Market"].methods.getWorseOffer.cacheCall(this.state.bestBuyOfferId)
        const buy_data_key = this.context.drizzle.contracts["Market"].methods.getOffer.cacheCall(this.state.bestBuyOfferId)
        const sell_worst_key = this.context.drizzle.contracts["Market"].methods.getWorseOffer.cacheCall(this.state.bestSellOfferId)
        const sell_data_key = this.context.drizzle.contracts["Market"].methods.getOffer.cacheCall(this.state.bestSellOfferId)

        // this.waitAndSet("bestBuyOffer", "getOffer", buy_worst_key)
        // this.waitAndSet("bestSellOffer", "getOffer", sell_data_key)

        this.fetchOrders(this.state.bestBuyOfferId, this.state.numBuys, buy_worst_key, buy_data_key, "buy")
        this.fetchOrders(this.state.bestSellOfferId, this.state.numSells, sell_worst_key, sell_data_key, "sell")
        // this.updateOrders(true)
      } else {
        this.updateOrders(false)
      }
    }, timeout)
  }

  getBuyOrders = () => {
    var orders = []

    var buy_token_addr = this.context.drizzle.contracts[this.state.currencies[0]].address
    var sell_token_addr = this.context.drizzle.contracts[this.state.currencies[1]].address

    var state = this.context.drizzle.store.getState()
    if(this.props.drizzleStatus.initialized) {
      const numBuysKey = this.context.drizzle.contracts["Market"].methods.getOfferCount.cacheCall(sell_token_addr, buy_token_addr)
      const bestOfferKey = this.context.drizzle.contracts["Market"].methods.getBestOffer.cacheCall(sell_token_addr, buy_token_addr)
      this.waitAndSet('numBuys', 'getOfferCount', numBuysKey)
      this.waitAndSet('bestBuyOfferId', 'getBestOffer', bestOfferKey)
    }
  }

  getSellOrders = () => {
    var orders = []

    var buy_token_addr = this.context.drizzle.contracts[this.state.currencies[1]].address
    var sell_token_addr = this.context.drizzle.contracts[this.state.currencies[0]].address

    var state = this.context.drizzle.store.getState()
    if(this.props.drizzleStatus.initialized) {
      const numSellsKey = this.context.drizzle.contracts["Market"].methods.getOfferCount.cacheCall(sell_token_addr, buy_token_addr)
      const bestOfferKey = this.context.drizzle.contracts["Market"].methods.getBestOffer.cacheCall(sell_token_addr, buy_token_addr)
      this.waitAndSet('numSells', 'getOfferCount', numSellsKey)
      this.waitAndSet('bestSellOfferId', 'getBestOffer', bestOfferKey)
    }
  }

  waitAndSet = (name, method, key) => {
    setTimeout(() => {
      if(key in this.props.market[method]) {
        this.setState({ [name]: this.props.market[method][key].value })
      } else {
        this.waitAndSet(name, method, key)
      }
    }, 25)
  }

  fetchOrders(id, numLeft, worst_key, data_key, type) {
    setTimeout(() => {
       if(data_key in this.props.market.getOffer && worst_key in this.props.market.getWorseOffer) {
        let offers = []
        if(type === "buy") {
          offers = Object.assign([], this.state.buyOffers);
        } else if(type === "sell") {
          offers = Object.assign([], this.state.sellOffers);
        } else {
          return
        }

        var data = this.props.market.getOffer[data_key].value
        let pay_amount = Math.round(this.context.drizzle.web3.utils.fromWei(data[0], 'ether') * 1000) / 1000
        let buy_amount = Math.round(this.context.drizzle.web3.utils.fromWei(data[2], 'ether') * 1000) / 1000
        var worse_id = this.props.market.getWorseOffer[worst_key].value
        if(type === "buy") {
          let price = Math.round(pay_amount / buy_amount * 1000) / 1000
          offers.push([price, buy_amount, pay_amount])
          this.setState({ buyOffers: offers })
          console.log("ADDING BUY: " + numLeft)
        } else if(type === "sell") {
          let price = Math.round(buy_amount / pay_amount * 1000) / 1000
          offers.push([price, pay_amount, buy_amount])
          console.log("ADDING SELL: " + numLeft)
          this.setState({ sellOffers: offers })
        }

        if(numLeft > 0) {
          const new_worst_key = this.context.drizzle.contracts["Market"].methods.getWorseOffer.cacheCall(worse_id)
          const new_data_key = this.context.drizzle.contracts["Market"].methods.getOffer.cacheCall(worse_id)
          this.fetchOrders(worse_id, numLeft-1, new_worst_key, new_data_key, type)
        }
       } else {
        this.fetchOrders(id, numLeft, worst_key, data_key, type)
       }
    }, 50)
  }

  render() {
    var { currencies, numBuys, numSells, buyOffers, sellOffers } = this.state

    var title = "OTC Market: "
    if(currencies.length == 2) {
      title = title + currencies[0] + "/" + currencies[1]
    }

    // <div id="Market-chart"><Chart /></div>
    return (
      <div className="Market">
        <div id="Market-title"><span className="Market-h1">{title}</span></div>
        <div id="Market-buysell"><BuySell currencies={currencies} /></div>
        <Grid columns={2} divided id="Market-orderlists">
          <Grid.Row>
            <Grid.Column>
              <div className="Market-headers">{currencies[0]} <span className="green">Buy</span> Orders (<ContractData contract={"Market"} method={"getOfferCount"} methodArgs={[this.context.drizzle.contracts[this.state.currencies[1]].address, this.context.drizzle.contracts[this.state.currencies[0]].address]} toString />)</div>
              <OrderList currencies={currencies} orders={buyOffers} />
            </Grid.Column>
            <Grid.Column>
              <div className="Market-headers">{currencies[0]} <span className="red">Sell</span> Orders (<ContractData contract={"Market"} method={"getOfferCount"} methodArgs={[this.context.drizzle.contracts[this.state.currencies[0]].address, this.context.drizzle.contracts[this.state.currencies[1]].address]} toString />)</div>
              <OrderList currencies={currencies} orders={sellOffers} />
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </div>
    );
  }
}

export default Market
