// Import Major Dependencies
import React, { Component } from 'react';
import { Grid, Icon, Popup } from 'semantic-ui-react';
import { AutoSizer, List } from 'react-virtualized';

// Import CSS FIle
import './orderlistV2.css';

// Import src code
import HumanName from '../../utils/humanname/humanname';
import { numberWithCommas } from '../../utils/general';

class OrderListV2 extends Component {
  constructor(props) {
    super(props);
    this.state = {
    };

    this.max_order = 1;
    this.orders = [];
  }

  shouldComponentUpdate(nextProps, nextState) {
    // Only update if buy/sell orders has changed or the last order is different
    if(nextProps.buy_orders !== this.props.buy_orders || nextProps.sell_orders !== this.props.sell_orders || nextProps.last_order !== this.props.last_order) {
      return true;
    } else {
      return false;
    }
  }

  // Retreives the maximum value in the orderbook
  getMax(orders) {
    const top10 = orders.concat().sort((a,b) => b.curr_1_amt - a.curr_1_amt).slice(0,10);
    for(let i = 0; i < top10.length-1; i++) {
      console.log(i);
      if(top10[i].curr_1_amt <= top10[i+1].curr_1_amt*2) {
        console.log(top10[i].curr_1_amt);
        return top10[i].curr_1_amt;
      }
    }
    if(top10.length > 0) {
      return top10[top10.length-1];
    } else {
      return null;
    }
  }

  // Renders the HTML for each row in the virtualized table
  // Includes the color bands based on ratio to max
  rowRenderer({index, key, style}) {
    const item = this.orders[index];
    // If this condition is true then this means it is the middle dividing row and the last price should be shown
    if(item.maker === "0") {
      const { last_order } = this.props;
      let price = "...";
      if(last_order["price"]) {
        price = last_order["type"] === "BUY" ? (<span className="green">{numberWithCommas(Math.round(last_order["price"] * 100)/100) + "▲"}</span>) : (<span className="red">{numberWithCommas(Math.round(last_order["price"] * 100)/100)  + "▼" }</span>);
      }
      return (
        <div id="OrderListV2-table-middle" key={key} style={style} >
          <Grid padded={'horizontally'}>
            <Grid.Column computer={2} tablet={2} mobile={3}>
            </Grid.Column>
            <Grid.Column computer={4} tablet={4} mobile={4}>
              <Popup trigger={<span>{price}</span>} content='Last Price' />
            </Grid.Column>
            <Grid.Column computer={5} tablet={5} mobile={4}>
            </Grid.Column>
            <Grid.Column computer={5} tablet={5} mobile={5}>
            </Grid.Column>
          </Grid>
        </div>
      )      
    }

    // Calculate ratio to the max
    const { account } = this.props;
    const type = item["type"];
    const ratio = item["curr_1_amt"]/this.max_order * 100;
    const direction = "right";

    // Calculate the colors for the color bands
    let color_0 = "rgba(255, 0, 0, 0.2)";
    let color_1 = "rgba(0,0,0,0)";
    if(type === "BUY") {
      color_0 = "rgba(0, 255, 0, 0.1)";
      color_1 = "rgba(0, 0, 0, 0)";
    }

    // Get the color to make the rows striped
    let color = index % 2 === 0 ? `#182026` : `#1c262c`;
    if(account === item["maker"]) {
      color = `#3f4a50`;
    }

    const custom_style = { 
      backgroundColor: color,
      backgroundImage: `linear-gradient(to ${direction}, ${color_0} , ${color_0}), linear-gradient(to ${direction}, ${color_1}, ${color_1})` ,
      backgroundSize: `calc(${ratio}%) 100%`,
      backgroundRepeat: `no-repeat`
    };

    style = Object.assign(custom_style, style);
    let price = item["type"] === "BUY" ? (<span className="green">{numberWithCommas(Math.round(item["price"] * 100)/100)}</span>) : (<span className="red">{numberWithCommas(Math.round(item["price"] * 100)/100)}</span>);
    return (
      <div className="OrderListV2-table-entry" key={key} style={style} onClick={() => this.props.setSidebar(item) }>
        <Grid padded={'horizontally'} verticalAlign={'middle'} className="OrderListV2-table-entry-grid">
          <Grid.Column computer={2} tablet={2} mobile={3} className="OrderListV2-table-entry-grid-img">
            <HumanName inactive_link icon_only address={item["maker"]} />
          </Grid.Column>
          <Grid.Column computer={4} tablet={4} mobile={4} className="OrderListV2-table-entry-grid-col">
            {price}
          </Grid.Column>
          <Grid.Column computer={5} tablet={5} mobile={4} className="OrderListV2-table-entry-grid-col">
            {numberWithCommas(item["curr_0_amt"])}
          </Grid.Column>
          <Grid.Column computer={5} tablet={5} mobile={5} className="OrderListV2-table-entry-grid-col">
            {numberWithCommas(item["curr_1_amt"])}
          </Grid.Column>
        </Grid>
      </div>
    )
  }

  /** ################# RENDER ################# **/

  render() {
    const { currencies, buy_orders, sell_orders } = this.props;

    // Copy and reverse the sell order list
    const sell_orders_reverse = sell_orders.slice(0);
    sell_orders_reverse.reverse();

    // Push the "MIDDLE" row with the price summary onto the list
    sell_orders_reverse.push({
      "maker": "0",
      "price": "0",
      "curr_0_amt": "0",
      "curr_1_amt": "0"
    });

    // Concatenate with the list of buy orders to get the mirroed orderbook
    this.orders = sell_orders_reverse.concat(buy_orders);

    // Recalculate the max order on the books
    this.max_order = this.getMax(this.orders);

    // If the buy or sell book is length 0 then just show loading screen since this mostly indicates an error and bad UX
    if(sell_orders.length === 0 && buy_orders.length === 0) {
      return (
        <div className="OrderListV2">
          <div className="OrderListV2-loading">Loading...</div>
        </div>
      );
    }

    return (
      <div className="OrderListV2">
        <Grid id="OrderListV2-table-header">
          <Grid.Column computer={2} tablet={2} mobile={3}>
            <Icon name="user circle" size="large" />
          </Grid.Column>
          <Grid.Column computer={4} tablet={4} mobile={4}>
            Price
          </Grid.Column>
          <Grid.Column computer={5} tablet={5} mobile={4}>
            {currencies[0]}
          </Grid.Column>
          <Grid.Column computer={5} tablet={5} mobile={5}>
            {currencies[1]}
          </Grid.Column>
        </Grid>
        <AutoSizer style={{outline: 'none'}}>
          {({ height, width }) => (
            <List
              width={width}
              height={height - 50}
              rowHeight={40}
              rowCount={this.orders.length}
              rowRenderer={(props) => this.rowRenderer(props)}
              scrollToIndex={sell_orders_reverse.length + 6}
              className="OrderListV2-infinite-list"
            >
            </List>
          )}
        </AutoSizer>
      </div>
    );
  }
}

export default OrderListV2