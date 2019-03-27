// Import Major Dependencies
import React, { Component } from 'react';
import { ethers } from 'ethers';
import { Grid } from 'semantic-ui-react';

// Import CSS Files
import './accountstats.css';

// Import src code
import { getPrice } from '../../utils/orders';
import { numberWithCommas } from '../../utils/general';

// Component that calculates and displays the account statistics for a currency market
class AccountStats extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      data: {
          "amount_0_bought": '...',
          "avg_buy_price": '...',
          "amount_0_sold": '...',
          "avg_sell_price": '...',
          "profit": '...'
        }
    };
  }

  componentDidMount() {
    const data = this.eventsToData(this.props.orders);
    this.setState({ data });
  }

  shouldComponentUpdate(nextProps, nextState) {
    // Only update if more orders are added or if the sorting has changed
    if(this.props.orders.length !== nextProps.orders.length || this.state.data !== nextState.data) {
      if(this.props.orders.length !== nextProps.orders.length) {
        const data = this.eventsToData(nextProps.orders);
        this.setState({ data });
      }
      return true;
    } else {
      return false;
    }
  }

  // Function to turn raw events into processed data for the leaderboard
  eventsToData(events) {
    let profiles = {};
    for(let i = 0; i < events.length; i++) {
      const order = events[i];

      // Assemble all necessary vars
      const maker = order["maker"];
      const taker = order["taker"];
      let buyer = null;
      let seller = null;

      // Add maker and taker into the dict if they are not present
      if(!(maker in profiles)) {
        profiles[maker] = this.newUserProfile(maker);
      }
      if(!(taker in profiles)) {
        profiles[taker] = this.newUserProfile(taker);
      }

      // Set who the buyer and who the seller is
      if(order["type"] === "BUY") {
        buyer = taker;
        seller = maker;
      } else {
        buyer = maker;
        seller = taker;
      }

      // Add to buyer and seller data dict
      let profile_data = profiles[buyer];
      profile_data["amount_1_given"] = profile_data["amount_1_given"].add(order["curr_1"]);
      profile_data["amount_0_received"] = profile_data["amount_0_received"].add(order["curr_0"]);
      profiles[buyer] = profile_data;

      profile_data = profiles[seller];
      profile_data["amount_0_given"] = profile_data["amount_0_given"].add(order["curr_0"]);
      profile_data["amount_1_received"] = profile_data["amount_1_received"].add(order["curr_1"]);
      profiles[seller] = profile_data;
    }

    let data = {};
    for (const key in profiles) {
      const avg_buy_order = getPrice(profiles[key]["amount_1_given"], profiles[key]["amount_0_received"], "BUY");
      const avg_buy_price = avg_buy_order ? Math.round(avg_buy_order[0].toString() * 10) / 10 : "N/A";
      const avg_sell_order = getPrice(profiles[key]["amount_0_given"], profiles[key]["amount_1_received"], "SELL");
      const avg_sell_price = avg_sell_order ? Math.round(avg_sell_order[0].toString() * 10) / 10 : "N/A";
      const profit = this.getProfit(avg_buy_order, avg_sell_order);
      const data_point = {
        "amount_0_bought": Math.round(ethers.utils.formatUnits(profiles[key]["amount_0_received"].toString(), 'ether') * 10) / 10,
        "avg_buy_price": avg_buy_price,
        "amount_0_sold": Math.round(ethers.utils.formatUnits(profiles[key]["amount_0_given"].toString(), 'ether') * 10) / 10,
        "avg_sell_price": avg_sell_price,
        "profit": profit
      };
      data[key] = data_point;
    }

    if (this.props.account in data) {
      data = data[this.props.account];
    } else {
      data = {
          "amount_0_bought": '...',
          "avg_buy_price": '...',
          "amount_0_sold": '...',
          "avg_sell_price": '...',
          "profit": '...'
        };
    }

    return data;
  }

  /** ################# HANDLERS ################# **/

  /** ################# HELPER FUNCTIONS ################# **/

  // Helper function that creates an empty user profile object
  newUserProfile(address) {
    return {
          "address": address,
          "amount_0_given": ethers.utils.bigNumberify("0"), // Amount weth sold
          "amount_1_received": ethers.utils.bigNumberify("0"), // Amount dai received for sells
          "amount_1_given": ethers.utils.bigNumberify("0"), // Amount dai given for buys
          "amount_0_received": ethers.utils.bigNumberify("0"), // Amount weth bought
        };
  }

  // Helper function to calculate profit given average buy and sell orders
  getProfit(avg_buy_order, avg_sell_order) {
    if(!avg_buy_order || !avg_sell_order) {
      return 0;
    } else {
      var amount_sell = avg_sell_order[1];
      var amount_buy = avg_buy_order[1];
      var sell_price = avg_sell_order[0];
      var buy_price = avg_buy_order[0];
      var min_amount = amount_buy.lt(amount_sell) ? ethers.utils.formatUnits(amount_buy.toString(), 'ether') : ethers.utils.formatUnits(amount_sell.toString(), 'ether');
      var profit = Math.round(min_amount * (sell_price - buy_price) * 100) / 100;
      return profit;
    }
  }

  /** ################# RENDER ################# **/

  render() {
    const { currencies } = this.props;
    const { loading, data } = this.state;

    // Background Item is in case data is loading or empty
    let background_item = null;

    if(loading) {
      background_item = (<div id="AccountStats-empty">Loading...</div>);
    } else if(data.length === 0) {
      background_item = (<div id="AccountStats-empty">NO DATA</div>);
    }
    let profit_suffix = data['profit'] === '...' ? '' : <span className="sub_value">{currencies[1]}</span>;
    let bought_suffix = data['amount_0_bought'] === '...' ? '' : <span className="sub_value">{currencies[0]}</span>;
    let sold_suffix = data['amount_0_sold'] === '...' ? '' : <span className="sub_value">{currencies[0]}</span>;
    let profit_prefix = "Profit:";

    let profit = data['profit'];
    if (profit !== '...') {
      if (profit > 0) {
        profit = <span className="green">{numberWithCommas(profit)} {profit_suffix}</span>;
      } else {
        profit_prefix = "Loss:";
        profit = <span className="red">{numberWithCommas(profit)} {profit_suffix}</span>;
      }
    }
    return (
      <div className="AccountStats">
        <div id="AccountStats-grid">
          <Grid>
            <Grid.Row>
              <Grid.Column mobile={16} tablet={4} computer={4} textAlign="center" className="AccountStats-grid-col">
                <span className="AccountStats-fieldName">{profit_prefix}</span> {profit}
              </Grid.Column>
              <Grid.Column mobile={16} tablet={3} computer={3} textAlign="center" className="AccountStats-grid-col">
                <span className="AccountStats-fieldName"># Bought:</span> {numberWithCommas(data['amount_0_bought'])} {bought_suffix}
              </Grid.Column>
              <Grid.Column mobile={16} tablet={3} computer={3} textAlign="center" className="AccountStats-grid-col">
                <span className="AccountStats-fieldName">Avg. Buy:</span> {numberWithCommas(data['avg_buy_price'])}
              </Grid.Column>
              <Grid.Column mobile={16} tablet={3} computer={3} textAlign="center" className="AccountStats-grid-col">
                <span className="AccountStats-fieldName"># Sold:</span> {numberWithCommas(data['amount_0_sold'])} {sold_suffix}
              </Grid.Column>
              <Grid.Column mobile={16} tablet={3} computer={3} textAlign="center" className="AccountStats-grid-col">
                <span className="AccountStats-fieldName">Avg. Sell:</span> {numberWithCommas(data['avg_sell_price'])}
              </Grid.Column>
            </Grid.Row>
          </Grid>
        </div>
        {background_item}
      </div>
    );
  }
}

export default AccountStats