// Import Major Dependencies
import React, { Component } from 'react';
import { ethers } from 'ethers';
import { Grid } from 'semantic-ui-react';
import { AutoSizer, List } from 'react-virtualized';

// Import CSS Files
import './myhistory.css';

// Import src Code
import HumanName from '../../utils/humanname/humanname';
import { numberWithCommas } from '../../utils/general';

class MyHistory extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true
    };

    this.my_orders = [];
    this.max_order = 1;
  }

  componentDidMount() {
    // If the orders prop is longer than 0 then set loading to false
    if(this.props.orders.length > 0) {
      this.setState({ loading: false });
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    // Only update if the new state isn't loading or if the props orders has changed
    if(this.state.loading && !nextState.loading) {
      return true;
    } else if(this.props.orders.length !== nextProps.orders.length) {
      this.setState({ loading: false });
      return true;
    } else {
      return false;
    }
  }

  // Gets the max value from the order history
  getMax() {
    return Math.max.apply(Math, this.my_orders.map(function(o) { return o.curr_1 }));
  }

  // Extract orders that match the current account address and return the filtered list
  getMyOrders() {
    const { orders, account } = this.props;
    let myOrders = [];

    for(let i = 0; i < orders.length; i++) {
      let order = orders[i];
      if(order["maker"] === account) {
        let new_order = Object.assign({}, order);
        new_order["participant"] = new_order["taker"];
        new_order["type"] = new_order["type"] === "BUY" ? "SELL" : "BUY";
        myOrders.push(new_order);
      } else if(order["taker"] === account) {
        let new_order = Object.assign({}, order);
        new_order["participant"] = new_order["maker"];
        myOrders.push(new_order);
      }
    }
    return myOrders;
  }

  // Build the HTML for each row to be rendered in the virtualized table
  // Includes getting the color bar for each row
  rowRenderer({index, key, style}) {
    const item = this.my_orders[index];
    
    // Getting the information for the coloring ratio by dividng by the max order
    const type = item["type"];
    const ratio = item["curr_1"]/this.max_order * 100;
    const direction = "right";
    let color_0 = "rgba(255, 0, 0, 0.2)";
    let color_1 = "rgba(0,0,0,0)";
    if(type === "BUY") {
      color_0 = "rgba(0, 255, 0, 0.1)";
      color_1 = "rgba(0, 0, 0, 0)";
    }

    // Getting the color for the color band
    const color = index % 2 === 0 ? `#182026` : `#1c262c`;

    const custom_style = { 
      backgroundColor: color,
      backgroundImage: `linear-gradient(to ${direction}, ${color_0} , ${color_0}), linear-gradient(to ${direction}, ${color_1}, ${color_1})` ,
      backgroundSize: `calc(${ratio}%) 100%`,
      backgroundRepeat: `no-repeat`
    };
    style = Object.assign(custom_style, style);

    // Construct the HTML row
    const price = item["type"] === "BUY" ? (<span className="green MarketHistory-type">{numberWithCommas(Math.round(item["price"] * 100)/100)}</span>) : (<span className="red MarketHistory-type">{numberWithCommas(Math.round(item["price"] * 100)/100)}</span>);
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
            <HumanName address={item["participant"]} icon_only />
          </Grid.Column>
        </Grid>
      </div>
    )
  }

  /** ################# RENDER ################# **/

  render() {
    const { loading } = this.state;
    const { currencies } = this.props;

    let background_item = null;
    this.my_orders = this.getMyOrders();

    if(loading) {
      background_item = (<div id="MarketHistory-empty">Loading...</div>);
    } else if(this.my_orders.length === 0) {
      background_item = (<div id="MarketHistory-empty">NO ORDERS</div>);
    } else {
      this.max_order = this.getMax();
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
              rowCount={this.my_orders.length}
              rowRenderer={(props) => this.rowRenderer(props)}
              className="MarketHistory-infinite-list"
            >
            </List>
          )}
        </AutoSizer>
        { background_item }
      </div>
    );
  }
}

export default MyHistory