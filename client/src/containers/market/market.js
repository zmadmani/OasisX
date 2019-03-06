// Import Major dependencies
import React, { Component } from 'react';
import { Grid, Tab, Responsive } from 'semantic-ui-react';

// Import CSS Files
import './market.css';

// Import src code
import OrderListV2 from './orderlistV2/orderlistV2';
import LimitOrder from './limitorder/limitorder';
import MarketOrder from './marketorder/marketorder';
import MyOrders from './myorders/myorders';
import Stats from './stats/stats';
import MarketHistory from './markethistory/markethistory';
import Leaderboard from './leaderboard/leaderboard';
import MyHistory from './myhistory/myhistory';
import SideBar from './sidebar/sidebar';

// Import orderbook read functions
import { getPastOrders, subscribeToNewOrders, unSubscribeToNewOrders } from '../utils/orders';
import { getOpenOrders } from '../utils/openorders';

class Market extends Component {
  constructor(props) {
    super(props);
    this.state = {
      visible: false,
      account: "",
      sidebar_info: {
        "price": 0,
        "curr_0_amt": 0,
        "curr_1_amt": 0,
        "id": "",
        "type": ""
      },
      past_orders: [],
      open_buy_orders: [],
      open_sell_orders: [],
      balances: ['0', '0'],
      timers: [null, null]
    };

    this.updateBalances = this.updateBalances.bind(this);
    this.updateOpenOrders = this.updateOpenOrders.bind(this);
  }

  async componentDidMount() {
    // Retrieve starting data and subscribe to future live feeds
    const { currencies, options } = this.props;
    
    // Store account in state for convenience
    let account = await options.signer.getAddress();
    this.setState({ account });
    
    // Start polls for open orders and balances
    this.updateOpenOrders();
    this.updateBalances();

    // Get past orders for 5 years (5 * 5760)
    let past_orders = await getPastOrders(currencies, options.contracts, options.provider, -1, 5760*5);
    this.setState({ past_orders });

    // Subscribe to updates for new orders and pass in callback
    subscribeToNewOrders(currencies, options.contracts, this.addOrders);
  }

  // Cleaning up timers and unsubscribing from live feeds
  componentWillUnmount() {
    for(let i = 0; i < this.state.timers.length; i++) {
      if(this.state.timers[i] !== null) {
        clearTimeout(this.state.timers[i]);
      }
    }

    const { options, currencies } = this.props;
    unSubscribeToNewOrders(currencies, options.contracts);
  }

  /** ################# POLLING FUNCTIONS ################# **/

  // Function to periodically update the balances in the state from the blockchain
  async updateBalances() {
    const { options, currencies } = this.props;
    const { account } = this.state;

    if(account !== "") {
      const currency_0_balance = await options.contracts[currencies[0]].balanceOf(account);
      const currency_1_balance = await options.contracts[currencies[1]].balanceOf(account);
      const balances = [currency_0_balance, currency_1_balance];
      this.setState({ balances });
    }

    // Set timer to recall same function after 3 seconds and store the timer in state
    // for cleanup
    const timer = setTimeout(this.updateBalances, 3000);
    let timers = this.state.timers;
    timers[0] = timer;
    this.setState({ timers });
  }

  // Function to periodically update the list of open orders from the blockchain
  async updateOpenOrders() {
    const [open_buy_orders, open_sell_orders] = await Promise.all([getOpenOrders("BUY", this.props.currencies, this.props.options.contracts), getOpenOrders("SELL", this.props.currencies, this.props.options.contracts)]);

    // Set timer to recall same function after 5 seconds and store the timer in state
    // for cleanup
    const timer = setTimeout(this.updateOpenOrders, 5000);
    let timers =  this.state.timers;
    timers[1] = timer;
    this.setState({ timers, open_buy_orders, open_sell_orders });
  }

  /** ################# HELPER FUNCTIONS ################# **/

  // Helper function used as a callback function for the subscription function
  addOrders = (orders) => {
    this.setState({ past_orders: orders.concat(this.state.past_orders) });
  }

  // Function to set the order information for the sidebar and sets it to visible
  setSidebar = (info) => {
    this.setState({ sidebar_info: info, visible: true });
  }

  // Function to toggle the visibility of the order sidebar
  toggleSidebar = () => {
    this.setState({ visible: !this.state.visible });
  }

  // Function to build the title of the Market page if valid currencies are selected
  buildTitle() {
    const { currencies } = this.props;
    let title = "Market: ";
    title = currencies.length === 2 ? title + currencies[0] + "/" + currencies[1] : title;
    return title;
  }

  /** ################# RENDER ################# **/

  render() {
    const { visible, sidebar_info, account, past_orders, balances, open_buy_orders, open_sell_orders } = this.state;
    const { currencies, options } = this.props;

    // Build the title
    const title = this.buildTitle();

    // Concat buy and sell orders and sort to create an All Orders book
    const all_open_orders = open_buy_orders.concat(open_sell_orders);
    all_open_orders.sort(function(a, b) { return parseInt(a[3]) > parseInt(b[3]) ? 1 : -1 });

    // Get the last order in the order book
    const last_order = past_orders.length > 0 ? past_orders[0] : "";

    // Create the panels for the Activity Pane Tabs
    let activity_panes = [
      { menuItem: 'Market History', render: () => <Tab.Pane className="Market-tab-pane"><MarketHistory currencies={currencies} options={options} orders={past_orders} /></Tab.Pane> },
      { menuItem: '5-D Leaderboard', render: () => <Tab.Pane className="Market-tab-pane"><Leaderboard currencies={currencies} account={account} options={options} orders={past_orders} /></Tab.Pane> },
    ];

    // If in readOnly mode then add more panes for account specific information
    if(!options.readOnly) {
      const logged_in_panes = [
        { menuItem: 'Open Orders', render: () => <Tab.Pane className="Market-tab-pane"><MyOrders currencies={currencies} options={options} orders={all_open_orders} account={account} /></Tab.Pane> },
        { menuItem: 'My History', render: () => <Tab.Pane className="Market-tab-pane"><MyHistory currencies={currencies} options={options} orders={past_orders} account={account} /></Tab.Pane> },
      ];
      activity_panes = logged_in_panes.concat(activity_panes);
    }

    // Create the panels for the Order Pane Tabs
    const buy_panes = [
      { menuItem: 'Limit Order', render: () => <Tab.Pane className="Market-tab-pane"><LimitOrder currencies={currencies} options={options} last_price={last_order["price"]} balances={balances} /></Tab.Pane> },
      { menuItem: 'Market Order', render: () => <Tab.Pane className="Market-tab-pane"><MarketOrder currencies={currencies} options={options} balances={balances} /></Tab.Pane> }
    ];

    return (
      <div className="Market">
        <SideBar currencies={currencies} toggleSidebar={this.toggleSidebar} sidebar_info={sidebar_info} visible={visible} account={account} options={options} />
        <div id="Market-title"><span className="Market-h1">{title}</span></div>
        <div className="Market-headers">5-Day Market Stats</div>
        <div id="Market-stats"><Stats currencies={currencies} options={options} orders={past_orders} /></div>

        <Grid divided id="Market-orderlists">
          <Grid.Column className="Market-orderlist" computer={8} tablet={8} mobile={16}>
            <div className="Market-headers">Order Center</div>
            <div id="Market-buysell">
              <Tab menu={{ fluid: true, tabular: true, attached: 'top' }} panes={buy_panes} />
            </div>
          </Grid.Column>
          <Grid.Column className="Market-orderlist" computer={8} tablet={8} mobile={16}>
            <div className="Market-headers">Order Book</div>
            <OrderListV2 currencies={currencies} account={account} options={options} last_order={last_order} buy_orders={open_buy_orders} sell_orders={open_sell_orders} setSidebar={this.setSidebar} />
          </Grid.Column>
        </Grid>

        <div className="Market-headers">Activity Center</div>
        <div id="Market-activity-pane">
          <Responsive minWidth={Responsive.onlyTablet.minWidth}>
            <Tab menu={{ fluid: true, tabular: true, attached: 'top' }} panes={activity_panes} />
          </Responsive>
          <Responsive maxWidth={Responsive.onlyTablet.minWidth}>
            <Tab menu={{ fluid: true, tabular: true, attached: 'top' }} panes={activity_panes.slice(0,3)} />
          </Responsive>
        </div>

        <Responsive maxWidth={Responsive.onlyTablet.minWidth}>
          <div id="Market-leaderboard-pane">
            <div className="Market-headers">Leaderboard</div>
            <Leaderboard currencies={currencies} account={account} options={options} orders={past_orders} />
          </div>
        </Responsive>
      </div>
    );
  }
}

export default Market