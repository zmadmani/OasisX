// Import Major Dependencies
import React, { Component } from 'react';
import { ethers } from 'ethers';
import { Grid } from 'semantic-ui-react';
import { AutoSizer, List } from 'react-virtualized';

// Import CSS Files
import './leaderboard.css';

// Import src code
import HumanName from '../../utils/humanname/humanname';
import { getPrice } from '../../utils/orders';
import { numberWithCommas } from '../../utils/general';

// Component that calculates and displays rankings for traders on the leaderboard
class Leaderboard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      data: [],
      direction: 'ascending',
      column: 'profit'
    };
  }

  componentDidMount() {
    // Convert raw orders into the proper format and store max profit someone has made over the data range
    const new_data = this.eventsToData(this.props.orders);
    let max_profit = 1;
    if(new_data.length > 0) {
      max_profit = Math.max(Math.abs(new_data[0]['profit']), Math.abs(new_data[new_data.length-1]['profit']));
    }
    this.setState({ max_profit, data: new_data });
  }

  shouldComponentUpdate(nextProps, nextState) {
    // Only update if more orders are added or if the sorting has changed
    if(this.props.orders.length !== nextProps.orders.length || this.state.data !== nextState.data || this.state.direction !== nextState.direction || this.state.column !== nextState.column) {
      if(this.props.orders.length !== nextProps.orders.length) {
        const new_data = this.eventsToData(nextProps.orders);
        // Need to update the max profit to calibrate the coloring bands
        let max_profit = 1;
        if(new_data.length > 0) {
          max_profit = Math.max(Math.abs(new_data[0]['profit']), Math.abs(new_data[new_data.length-1]['profit']));
        }
        this.setState({ max_profit, data: new_data});
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

    let data = [];
    for (const key in profiles) {
      const avg_buy_order = getPrice(profiles[key]["amount_1_given"], profiles[key]["amount_0_received"], "BUY");
      const avg_buy_price = avg_buy_order ? Math.round(avg_buy_order[0].toString() * 10) / 10 : "N/A";
      const avg_sell_order = getPrice(profiles[key]["amount_0_given"], profiles[key]["amount_1_received"], "SELL");
      const avg_sell_price = avg_sell_order ? Math.round(avg_sell_order[0].toString() * 10) / 10 : "N/A";
      const profit = this.getProfit(avg_buy_order, avg_sell_order);
      const data_point = {
        "user": key,
        "amount_0_bought": Math.round(ethers.utils.formatUnits(profiles[key]["amount_0_received"].toString(), 'ether') * 10) / 10,
        "avg_buy_price": avg_buy_price,
        "amount_0_sold": Math.round(ethers.utils.formatUnits(profiles[key]["amount_0_given"].toString(), 'ether') * 10) / 10,
        "avg_sell_price": avg_sell_price,
        "profit": profit
      };
      data.push(data_point);
    }

    data.sort(function(first, second) {
      return second.profit - first.profit;
    })

    return data;
  }

  // Function that returns a row to be rendered in the virtualized table
  rowRenderer({index, key, style}) {
    const { max_profit } = this.state;
    const { currencies, account, options } = this.props;
    const item = this.state.data[index];

    const ratio = Math.abs(item["profit"])/max_profit * 100;
    const direction = "right";
    let color_0 = "rgba(255, 0, 0, 0.2)";
    let color_1 = "rgba(0,0,0,0)";
    if(item["profit"] > 0) {
      color_0 = "rgba(0, 255, 0, 0.1)";
      color_1 = "rgba(0, 0, 0, 0)";
    }

    let color = index % 2 === 0 ? `#182026` : `#1c262c`;

    if(account === item["user"]) {
      color =  `#3f4a50`;
    }

    const custom_style = { 
      backgroundColor: color,
      backgroundImage: `linear-gradient(to ${direction}, ${color_0} , ${color_0}), linear-gradient(to ${direction}, ${color_1}, ${color_1})` ,
      backgroundSize: `calc(${ratio}%) 100%`,
      backgroundRepeat: `no-repeat`
    };
    style = Object.assign(custom_style, style);

    let profit_color = 'grey';
    if(item["profit"] > 0) {
      profit_color = 'green';
    } else if(item["profit"] < 0) {
      profit_color = 'red';
    }

    return (
      <div className="Leaderboard-table-entry" key={key} style={style}>
        <Grid padded={true}>
          <Grid.Column computer={4} tablet={6} mobile={10}>
            <HumanName address={item["user"]} currencies={currencies} options={options} />
          </Grid.Column>
          <Grid.Column computer={3} tablet={2} only={'computer tablet'}>
            <span>{numberWithCommas(item["amount_0_bought"]) + " "}<span className="Leaderboard-subtext">{currencies[0]}</span></span>
          </Grid.Column>
          <Grid.Column computer={2} tablet={2} only={'computer tablet'}>
            {numberWithCommas(item["avg_buy_price"])}
          </Grid.Column>
          <Grid.Column computer={3} tablet={2} only={'computer tablet'}>
            <span>{numberWithCommas(item["amount_0_sold"]) + " "}<span className="Leaderboard-subtext">{currencies[0]}</span></span>
          </Grid.Column>
          <Grid.Column computer={2} tablet={2} only={'computer tablet'}>
            {numberWithCommas(item["avg_sell_price"])}
          </Grid.Column>
          <Grid.Column computer={2} tablet={2} mobile={6}>
            <span className={profit_color}>{numberWithCommas(item["profit"]) + " "}<span className="Leaderboard-subtext">{currencies[1]}</span></span>
          </Grid.Column>
        </Grid>
      </div>
    )
  }

  /** ################# HANDLERS ################# **/

  // Function used to handle changes in sorting by the user for the table
  handleSort(clicked_column) {
    const { column, data, direction } = this.state;

    if(column !== clicked_column) {
      var new_data = data.concat().sort(function(first, second) {
                      if(first[clicked_column] === "N/A") {
                        return 1;
                      } else if(second[clicked_column] === "N/A") {
                        return -1;
                      } else {
                        return second[clicked_column] - first[clicked_column];
                      }
                    })
      this.setState({
        column: clicked_column,
        data: new_data,
        direction: 'ascending'
      });
    } else {
      this.setState({ 
        data: data.reverse(),
        direction: direction === 'ascending' ? 'descending' : 'ascending'
      });
    }
  }

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
    const { loading, data, column, direction } = this.state;

    // Background Item is in case data is loading or empty
    let background_item = null;

    if(loading) {
      background_item = (<div id="Leaderboard-empty">Loading...</div>);
    } else if(data.length === 0) {
      background_item = (<div id="Leaderboard-empty">NO DATA</div>);
    }

    // Grab sorting symbols
    let symbol = "▲";
    if(direction === 'descending') {
      symbol = "▼";
    }

    // Build header list
    const headers = {
      "name": "Name",
      "amount_0_bought": "# Bought",
      "avg_buy_price": "Avg. Buy",
      "amount_0_sold": "# Sold",
      "avg_sell_price": "Avg. Sell",
      "profit": "Profit"
    };
    headers[column] = headers[column] + symbol;

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