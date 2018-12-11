import React, { Component } from 'react'
import { Grid, Tab } from 'semantic-ui-react'

// import Chart from './chart/chart'
import OrderList from './orderlist/orderlist'
import BuySell from './buysell/buysell'
import MyOrders from './myorders/myorders'
import MarketHistory from './markethistory/markethistory'
import MyHistory from './myhistory/myhistory'
import SideBar from './sidebar/sidebar'

import './market.css'

class Market extends Component {
  constructor(props) {
    super(props)
    this.state = {
      currencies: [],
      visible: false,
      sidebar_info: {
        "price": 0,
        "curr_0_amt": 0,
        "curr_1_amt": 0,
        "id": "",
        "type": ""
      },
      keys: {
        numBuys: null,
        numSells: null,
        bestBuyOffer: null,
        bestSellOffer: null,
        buyOrdersKey: null,
        sellOrdersKey: null
      }
    }
  }

  componentWillMount() {
    var currencies = this.props.pair.split("_")
    this.setState({currencies})
  }

  componentDidMount() {
    var { drizzle } = this.props
    var { currencies } = this.state

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
    keys["buyOrdersKey"] = this.getOrdersKey("buy")
    keys["sellOrdersKey"] = this.getOrdersKey("sell")

    this.setState({currencies, keys})
  }

  setSidebar = (info) => {
    this.setState({ sidebar_info: info, visible: true })
  }

  toggleSidebar = () => {
    this.setState({ visible: !this.state.visible })
  }

  getOrdersKey(type) {
    var { drizzle } = this.props
    var { currencies } = this.state
    var market = drizzle.contracts.Market

    if(currencies.length === 2) {
      var token_addr_0 = drizzle.contracts[currencies[0]].address
      var token_addr_1 = drizzle.contracts[currencies[1]].address

      var pay_token = null
      var buy_token = null

      if(type === "buy") {
        pay_token = token_addr_1
        buy_token = token_addr_0
      } else {
        pay_token = token_addr_0
        buy_token = token_addr_1
      }

      const offersKey = drizzle.contracts.SupportMethods.methods.getOffers.cacheCall(market.address, pay_token, buy_token)
      return offersKey
    }
  }

  render() {
    var { currencies, keys, visible, sidebar_info } = this.state
    var { Market } = this.props.drizzleState.contracts
    var { drizzle, drizzleState } = this.props

    var title = "Market: "
    if(currencies.length === 2) {
      title = title + currencies[0] + "/" + currencies[1]
    }

    var numBuys = "Loading..."
    var numSells = "Loading..."

    if(keys["numBuys"] in Market.getOfferCount) {
      numBuys = Market.getOfferCount[keys["numBuys"]].value
    }
    if(keys["numSells"] in Market.getOfferCount) {
      numSells = Market.getOfferCount[keys["numSells"]].value
    }

    if(!numBuys) {
      numBuys = "Error..."
    }
    if(!numSells) {
      numSells = "Error..."
    }

    const panes = [
      { menuItem: 'Open Orders', render: () => <Tab.Pane className="Market-tab-pane"><MyOrders currencies={currencies} drizzle={drizzle} drizzleState={drizzleState} offersKeys={[keys["buyOrdersKey"], keys["sellOrdersKey"]]} /></Tab.Pane> },
      { menuItem: 'Order History', render: () => <Tab.Pane className="Market-tab-pane"><MyHistory currencies={currencies} drizzle={drizzle} drizzleState={drizzleState} /></Tab.Pane> },
      { menuItem: 'Market History', render: () => <Tab.Pane className="Market-tab-pane"><MarketHistory currencies={currencies} drizzle={drizzle} drizzleState={drizzleState} /></Tab.Pane> },
    ]

    return (
      <div className="Market">
        <SideBar currencies={currencies} toggleSidebar={this.toggleSidebar} sidebar_info={sidebar_info} visible={visible} drizzle={drizzle} drizzleState={ drizzleState } />
        <div id="Market-title"><span className="Market-h1">{title}</span></div>

        <div className="Market-headers">Make Order</div>
        <div id="Market-buysell"><BuySell currencies={currencies} drizzle={drizzle} drizzleState={ drizzleState } /></div>
        
        <div className="Market-headers">Activity Pane</div>
        <div id="Market-activity-pane">
          <Tab panes={panes} />
        </div>
        <Grid columns={2} divided id="Market-orderlists">
          <Grid.Row>
            <Grid.Column>
              <div className="Market-headers">{currencies[0]} <span className="green">Buy</span> Orders ({numBuys})</div>
              <OrderList currencies={currencies} type={"buy"} drizzle={drizzle} drizzleState={ drizzleState } offersKey={keys["buyOrdersKey"]} setSidebar={this.setSidebar} />
            </Grid.Column>
            <Grid.Column>
              <div className="Market-headers">{currencies[0]} <span className="red">Sell</span> Orders ({numSells})</div>
              <OrderList currencies={currencies} type={"sell"} drizzle={drizzle} drizzleState={ drizzleState } offersKey={keys["sellOrdersKey"]} setSidebar={this.setSidebar} />
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </div>
    );
  }
}

export default Market
