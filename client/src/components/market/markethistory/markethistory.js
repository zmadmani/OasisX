// Import Major Dependencies
import React, { Component } from 'react';
import { ethers } from 'ethers';
import { Grid, Icon } from 'semantic-ui-react';
import { AutoSizer, List } from 'react-virtualized';

// Import CSS Files
import './markethistory.css';

// Import src code
import HumanName from '../../utils/humanname/humanname';
import { numberWithCommas } from '../../utils/general';

class MarketHistory extends Component {
  constructor(props) {
    super(props);
    this.state = {
    };

    this.max_order = 1;
  }

  // Only rerender if the number of orders increases
  shouldComponentUpdate(nextProps, nextState) {
    if(this.props.orders.length !== nextProps.orders.length) {
      return true;
    } else {
      return false;
    }
  }

  // Retrive the maximum number in the order history for the color bands
  getMax(orders) {
    return Math.max.apply(Math, orders.slice(0, 250).map(function(o) { return o.curr_1 }));
  }

  // Function to render each row in the virtualized table
  rowRenderer({index, key, style}) {
    var item = this.props.orders[index];
    
    // Calculate the ratio of the order size vs the max order to get the color band size
    var type = item["type"];
    var ratio = item["curr_1"]/this.max_order * 100;
    var direction = "right";
    var color_0 = "rgba(255, 0, 0, 0.2)";
    var color_1 = "rgba(0,0,0,0)";
    if(type === "BUY") {
      color_0 = "rgba(0, 255, 0, 0.1)";
      color_1 = "rgba(0, 0, 0, 0)";
    }

    // Get the color of the color band using the order type
    var color = index % 2 === 0 ? `#182026` : `#1c262c`;

    var custom_style = { 
      backgroundColor: color,
      backgroundImage: `linear-gradient(to ${direction}, ${color_0} , ${color_0}), linear-gradient(to ${direction}, ${color_1}, ${color_1})` ,
      backgroundSize: `calc(${ratio}%) 100%`,
      backgroundRepeat: `no-repeat`
    };
    style = Object.assign(custom_style, style);

    var price = item["type"] === "BUY" ? (<span className="green MarketHistory-type">{numberWithCommas(Math.round(item["price"] * 100)/100)}</span>) : (<span className="red MarketHistory-type">{numberWithCommas(Math.round(item["price"] * 100)/100)}</span>);
    var participants = (<div className="MarketHistory-participants">
                          <div className="MarketHistory-taker"><HumanName icon_only address={item["taker"]} /></div>
                          <div className="MarketHistory-arrow"><Icon size="large" name="long arrow alternate right" /></div>
                          <div className="MarketHistory-maker"><HumanName icon_only address={item["maker"]} /></div>
                        </div>);
    return (
      <div className="MarketHistory-table-entry" key={key} style={style}>
        <Grid padded={true}>
          <Grid.Column computer={3} tablet={3} mobile={3}>
            {price}
          </Grid.Column>
          <Grid.Column computer={4} tablet={4} mobile={6}>
            {item["timestamp"]}
          </Grid.Column>
          <Grid.Column computer={3} tablet={3} mobile={3}>
            {numberWithCommas(Math.round(ethers.utils.formatUnits(item["curr_0"], 'ether') * 100) / 100 )}
          </Grid.Column>
          <Grid.Column computer={3} tablet={3} mobile={4}>
            {numberWithCommas(Math.round(ethers.utils.formatUnits(item["curr_1"], 'ether') * 100) / 100 )}
          </Grid.Column>
          <Grid.Column computer={3} tablet={3} only={'computer tablet'} textAlign='center'>
            {participants}
          </Grid.Column>
        </Grid>
      </div>
    );
  }

  render() {
    var { currencies, orders } = this.props;

    // Update max order class variable (class var to not cause a rerender)
    this.max_order = this.getMax(orders);
    var background_item = null;

    // Set the screen to loading if the orders are not available yet
    if(orders.length === 0) {
      background_item = (<div id="Leaderboard-empty">Loading...</div>);
    }

    return (
      <div className="MarketHistory">
        <Grid id="MarketHistory-table-header">
          <Grid.Column computer={3} tablet={3} mobile={3}>
            Price
          </Grid.Column>
          <Grid.Column computer={4} tablet={4} mobile={6}>
            Time
          </Grid.Column>
          <Grid.Column computer={3} tablet={3} mobile={3}>
            {currencies[0]}
          </Grid.Column>
          <Grid.Column computer={3} tablet={3} mobile={4}>
            {currencies[1]}
          </Grid.Column>
          <Grid.Column computer={3} tablet={3} only={'computer tablet'}>
            Participants
          </Grid.Column>
        </Grid>
        <AutoSizer style={{outline: 'none'}}>
          {({ height, width }) => (
            <List
              width={width}
              height={height - 50}
              rowHeight={50}
              rowCount={orders.length}
              rowRenderer={(props) => this.rowRenderer(props)}
              className="MarketHistory-infinite-list"
            >
            </List>
          )}
        </AutoSizer>
        {background_item}
      </div>
    );
  }
}

export default MarketHistory