import React, { Component } from 'react'
import { Grid, Tab } from 'semantic-ui-react'

// import Chart from './chart/chart'
import OrderList from './orderlist/orderlist'
import LimitOrder from './limitorder/limitorder'
import MarketOrder from './marketorder/marketorder'
import MyOrders from './myorders/myorders'
import Stats from './stats/stats'
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
        numSells: null
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
    const numSellsKey = drizzle.contracts.Market.methods.getOfferCount.cacheCall(buy_token_addr, sell_token_addr)

    let keys = Object.assign({}, this.state.keys)
    keys["numBuys"] = numBuysKey
    keys["numSells"] = numSellsKey

    this.setState({currencies, keys})
  }

  setSidebar = (info) => {
    this.setState({ sidebar_info: info, visible: true })
  }

  toggleSidebar = () => {
    this.setState({ visible: !this.state.visible })
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

    const activity_panes = [
      { menuItem: 'Open Orders', render: () => <Tab.Pane className="Market-tab-pane"><MyOrders currencies={currencies} drizzle={drizzle} drizzleState={drizzleState} /></Tab.Pane> },
      { menuItem: 'My History', render: () => <Tab.Pane className="Market-tab-pane"><MyHistory currencies={currencies} drizzle={drizzle} drizzleState={drizzleState} /></Tab.Pane> },
      { menuItem: 'Market History', render: () => <Tab.Pane className="Market-tab-pane"><MarketHistory currencies={currencies} drizzle={drizzle} drizzleState={drizzleState} /></Tab.Pane> },
    ]

    const buy_panes = [
      { menuItem: 'Limit Order', render: () => <Tab.Pane className="Market-tab-pane"><LimitOrder currencies={currencies} drizzle={drizzle} drizzleState={ drizzleState } /></Tab.Pane> },
      { menuItem: 'Market Order', render: () => <Tab.Pane className="Market-tab-pane"><MarketOrder currencies={currencies} drizzle={drizzle} drizzleState={ drizzleState } /></Tab.Pane> }
    ]

    return (
      <div className="Market">
        <SideBar currencies={currencies} toggleSidebar={this.toggleSidebar} sidebar_info={sidebar_info} visible={visible} drizzle={drizzle} drizzleState={ drizzleState } />
        <div id="Market-title"><span className="Market-h1">{title}</span></div>

        <div className="Market-headers">24-Hour Market Stats</div>
        <div id="Market-stats"><Stats currencies={currencies} drizzle={drizzle} drizzleState={ drizzleState } /></div>

        <div className="Market-headers">Order Center</div>
        <div id="Market-buysell">
          <Tab menu={{ fluid: true, tabular: true, attached: 'top' }} panes={buy_panes} />
        </div>
 
        <div className="Market-headers">Activity Center</div>
        <div id="Market-activity-pane">
          <Tab menu={{ fluid: true, tabular: true, attached: 'top' }} panes={activity_panes} />
        </div>
        
        <Grid divided id="Market-orderlists">
          <Grid.Row>
            <Grid.Column className="Market-orderlist" computer={8} tablet={8} mobile={16}>
              <div className="Market-headers">{currencies[0]} <span className="green">Buy</span> Orders ({numBuys})</div>
              <OrderList currencies={currencies} type={"BUY"} drizzle={drizzle} drizzleState={ drizzleState } setSidebar={this.setSidebar} />
            </Grid.Column>
            <Grid.Column className="Market-orderlist" computer={8} tablet={8} mobile={16}>
              <div className="Market-headers">{currencies[0]} <span className="red">Sell</span> Orders ({numSells})</div>
              <OrderList currencies={currencies} type={"SELL"} drizzle={drizzle} drizzleState={ drizzleState } setSidebar={this.setSidebar} />
            </Grid.Column>
          </Grid.Row>
        </Grid>
      
      </div>
    );
  }
}

export default Market
