// Import Major Dependencies
import React, { Component } from 'react';
import { ethers } from 'ethers';
import { Grid, List } from 'semantic-ui-react';
import CandleChart from './chart/chart';

// Import CSS Files
import './stats.css';

// Import src code
import { numberWithCommas } from '../../utils/general';

class Stats extends Component {
  constructor(props) {
    super(props);
    this.state = {
    };

    this.buildStat = this.buildStat.bind(this);
  }

  shouldComponentUpdate(nextProps, nextState) {
    // Only update if the orders has increased in length
    if(this.props.orders.length !== nextProps.orders.length) {
      return true;
    } else {
      return false;
    }
  }

  // Update the stats and the document title
  updateStats() {
    let users = {};
    const { orders } = this.props;

    if(orders.length === 0) {
      return {
        num_users: '...',
        num_buys: '...',
        num_sells: '...',
        buy_volume: '...',
        sell_volume: '...',
        last_price: '...',
        last_type: '...'
      };
    }

    let new_stats = {
      num_users: 0,
      num_buys: 0,
      num_sells: 0,
      buy_volume: 0.0,
      sell_volume: 0.0,
      last_price: 0,
      last_type: "BUY"
    };

    for(let i = 0; i < orders.length; i++) {
      const order = orders[i];

      // Check if maker is in user list
      if(!(order["maker"] in users)) {
        users[order["maker"]] = 1;
        new_stats["num_users"] += 1;
      }

      // Check if taker is in user list
      if(!(order["taker"] in users)) {
        users[order["taker"]] = 1;
        new_stats["num_users"] += 1;
      }

      // Check if order is buy or sell and add the necessary info
      const curr_1 = parseFloat(ethers.utils.formatUnits(order["curr_1"].toString(), "ether"));
      if(order["type"] === "BUY") {
        new_stats["num_buys"] += 1;
        new_stats["buy_volume"] += curr_1;
      } else if(order["type"] === "SELL") {
        new_stats["num_sells"] += 1;
        new_stats["sell_volume"] += curr_1;
      }
    }

    if(orders.length > 0) {
      new_stats["last_price"] = Math.round(orders[0]["price"] * 1000) / 1000;
      new_stats["last_type"] = orders[0]["type"];
      new_stats["buy_volume"] = Math.round(new_stats["buy_volume"] * 100) / 100;
      new_stats["sell_volume"] = Math.round(new_stats["sell_volume"] * 100) / 100;
    }

    return new_stats;
  }

  // Build each of the statistics given the raw stats and keys
  buildStat(key, raw_stats) {
    // If loading then print the loading dots
    if(raw_stats[key] === "...") {
      return <span className="loading_value">{raw_stats[key]}</span>;
    }

    var color = null;
    var value = numberWithCommas(raw_stats[key]);
    if(key === "buy_volume" || key === "sell_volume") {
      color = key === "buy_volume" ? "important-green" : "important-red";
      value = <span className={color + " value"}>{value.toString()} <span className="sub_value">{this.props.currencies[1]}</span></span>;
    }

    if(key === "num_buys" || key === "num_sells") {
      color = key === "num_buys" ? "important-green" : "important-red";
      value = <span className={color + " value"}>{value.toString()}</span>;
    }

    if(key === "last_price") {
      color = raw_stats["last_type"] === "BUY" ? "important-green" : "important-red";
      value = <span className={color + " value"}>{value.toString()} <span className="sub_value">{this.props.currencies[1]} / {this.props.currencies[0]}</span></span>;
    }

    return value;
  }

  /** ################# RENDER ################# **/

  render() {
    const { currencies, orders } = this.props;;

    const keys = ["num_users", "num_buys", "num_sells", "buy_volume", "sell_volume", "last_price"];
    let statistics = {};
    const raw_stats = this.updateStats();
    for(let i = 0; i < keys.length; i++) {
      const key = keys[i];
      statistics[key] = this.buildStat(key, raw_stats);
    }

    const chart = <div id="Stats-chart"><CandleChart orders={orders} currencies={currencies} /></div>;

    return (
      <div className="Stats">
        {chart}
        <div id="Stats-statistics">
          <Grid id="Stats-grid">
            <Grid.Row>
              <Grid.Column mobile={8} tablet={4} computer={4} textAlign="center">
                <List.Item className="Stats-statistic">
                  <List.Content>
                    <List.Header className="Stats-header"># Buys</List.Header>
                    <List.Description className="Stats-content">{statistics["num_buys"]}</List.Description>
                  </List.Content>
                </List.Item>
              </Grid.Column>
              <Grid.Column mobile={8} tablet={4} computer={4} textAlign="center">
                <List.Item className="Stats-statistic">
                  <List.Content>
                    <List.Header className="Stats-header">Buy Vol.</List.Header>
                    <List.Description className="Stats-content">{statistics["buy_volume"]}</List.Description>
                  </List.Content>
                </List.Item>
              </Grid.Column>
              <Grid.Column mobile={8} tablet={4} computer={4} textAlign="center">
                <List.Item className="Stats-statistic">
                  <List.Content>
                    <List.Header className="Stats-header"># Sells</List.Header>
                    <List.Description className="Stats-content">{statistics["num_sells"]}</List.Description>
                  </List.Content>
                </List.Item>
              </Grid.Column>
              <Grid.Column mobile={8} tablet={4} computer={4} textAlign="center">
                <List.Item className="Stats-statistic">
                  <List.Content>
                    <List.Header className="Stats-header">Sell Vol.</List.Header>
                    <List.Description className="Stats-content">{statistics["sell_volume"]}</List.Description>
                  </List.Content>
                </List.Item>
              </Grid.Column>
              <Grid.Column mobile={8} tablet={8} computer={8} textAlign="center">
                <List.Item className="Stats-statistic">
                  <List.Content>
                    <List.Header className="Stats-header">Last Price</List.Header>
                    <List.Description className="Stats-content">{statistics["last_price"]}</List.Description>
                  </List.Content>
                </List.Item>
              </Grid.Column>
              <Grid.Column mobile={8} tablet={8} computer={8} textAlign="center">
                <List.Item className="Stats-statistic">
                  <List.Content>
                    <List.Header className="Stats-header"># Users</List.Header>
                    <List.Description className="Stats-content">{statistics["num_users"]}</List.Description>
                  </List.Content>
                </List.Item>
              </Grid.Column>
            </Grid.Row>
          </Grid>
        </div>
      </div>
    );
  }
}

export default Stats