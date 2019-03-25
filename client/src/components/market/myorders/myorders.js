// Import Major Dependencies
import React, { Component } from 'react';
import { Table, Button } from 'semantic-ui-react';

// Import CSS Files
import './myorders.css';

// Import src code
import { numberWithCommas } from '../../utils/general';

class MyOrders extends Component {
  constructor(props) {
    super(props);
    this.state = {
    };
  }

  // Filter to the open orders that match the current account address
  getMyOrders() {
    const { orders, account } = this.props;
    let myOrders = [];
    for(let i = 0; i < orders.length; i++) {
      if(orders[i]["maker"] === account) {
        myOrders.push(orders[i]);
      }
    }
    return myOrders;
  }

  // Handler to cancel an order
  async cancelOrder(id) {
    const { Market } = this.props.options.contracts;
    console.log("CANCEL ORDER " + id);
    try {
      const tx = await Market.cancel(id);
      await tx.wait();
    } catch (error) {
      console.log(error);
    }
  }

  /** ################# RENDER ################# **/

  render() {
    const { currencies } = this.props;

    let orders_table = null;
    let background_item = null;
    const orders = this.getMyOrders();

    // If there are no orders then render an emtpy list
    if(orders.length === 0) {
      background_item = (<div id="MyOrders-empty">NO ORDERS</div>);
    } else {
      orders_table = (<Table.Body id="MyOrders-tableBody">
            {orders.map((item, index) => {
              var price = item["type"] === "BUY" ? (<span className="green MyOrders-color">{numberWithCommas(item["price"])}</span>) : (<span className="red MyOrders-color">{numberWithCommas(item["price"])}</span>)
              return (
                <Table.Row key={index}>
                  <Table.Cell  textAlign='left'>
                    <div className='MyOrders-table-entry'><Button className="MyOrders-button" color='red' size='mini' inverted onClick={() => {this.cancelOrder(item["id"])}}>CANCEL</Button></div>
                  </Table.Cell>

                  <Table.Cell>
                    <div className='MyOrders-table-entry'>{price}</div>
                  </Table.Cell>

                  <Table.Cell>
                    <div className='MyOrders-table-entry'>{numberWithCommas(item["curr_0_amt"])}</div>
                  </Table.Cell>

                  <Table.Cell  textAlign='left'>
                    <div className='MyOrders-table-entry'>{numberWithCommas(item["curr_1_amt"])}</div>
                  </Table.Cell>
                </Table.Row>
              )
            })}
          </Table.Body>);
    }

    return (
      <div className="MyOrders">
        <Table selectable striped basic celled unstackable columns={5} textAlign='left' id="MyOrders-table">
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell className='MyOrders-table-header' textAlign='left'>Action</Table.HeaderCell>
              <Table.HeaderCell className='MyOrders-table-header' textAlign='left'>Price</Table.HeaderCell>
              <Table.HeaderCell className='MyOrders-table-header' textAlign='left'>{currencies[0]}</Table.HeaderCell>
              <Table.HeaderCell className='MyOrders-table-header' textAlign='left'>{currencies[1]}</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          { orders_table }
        </Table>
        { background_item }
      </div>
    );
  }
}

export default MyOrders
