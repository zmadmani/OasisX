// Import Major Dependencies
import React, { Component } from 'react';
import { Table, Button, Popup } from 'semantic-ui-react';

// Import CSS Files
import './mystoporders.css';

// Import src code
import { numberWithCommas } from '../../utils/general';

class MyStopOrders extends Component {
  constructor(props) {
    super(props);
    this.state = {
    };
  }

  // Handler to cancel an order
  async cancelOrder(uid) {
    const { OasisX } = this.props.options.contracts;
    const { options } = this.props;
    console.log("CANCEL ORDER " + uid);
    try {
      const tx = await OasisX.cancel(uid, { gasLimit: 500000, gasPrice: options.gasPrice });
      await tx.wait();
    } catch (error) {
      console.log(error);
    }
  }

  /** ################# RENDER ################# **/

  render() {
    const { currencies, orders } = this.props;

    let orders_table = null;
    let background_item = null;

    // If there are no orders then render an emtpy list
    if(orders.length === 0) {
      background_item = (<div id="MyStopOrders-empty">NO ORDERS</div>);
    } else {
      orders_table = (<Table.Body id="MyStopOrders-tableBody">
            {orders.map((item, index) => {
              var condExplanation = item["condUpDown"] === 1 ? ">" : "<";
              var price = item["condType"] === "BUY" ? (<span className="green MyStopOrders-color">{numberWithCommas(item["price"])}</span>) : (<span className="red MyStopOrders-color">{numberWithCommas(item["price"])}</span>)
              var tradeType = item["tradeType"] === "BUY" ? (<span className="green MyStopOrders-color">{item["tradeType"]}</span>) : (<span className="red MyStopOrders-color">{item["tradeType"]}</span>)
              var tradeSuffix = item["tradeType"] === "BUY" ? currencies[1] : currencies[0];
              var pair = currencies[1] + "/" + currencies[0];
              var explanation = "If Market " + item["condType"] + " Price " + condExplanation + " " + numberWithCommas(item["price"]) + " " + pair;
              return (
                <Table.Row key={index}>
                  <Table.Cell  textAlign='left'>
                    <div className='MyStopOrders-table-entry'><Button className="MyStopOrders-button" color='red' size='mini' inverted onClick={() => {this.cancelOrder(item["uid"])}}>CANCEL</Button></div>
                  </Table.Cell>

                  <Table.Cell>
                    <div className='MyStopOrders-table-entry'><Popup trigger={<span>{condExplanation} {price} {pair}</span>} content={explanation} /></div>
                  </Table.Cell>

                  <Table.Cell>
                    <div className='MyStopOrders-table-entry'>MARKET {tradeType} ({numberWithCommas(item["tradePayAmt"])} {tradeSuffix})</div>
                  </Table.Cell>
                </Table.Row>
              )
            })}
          </Table.Body>);
    }

    return (
      <div className="MyStopOrders">
        <Table selectable striped basic celled unstackable columns={5} textAlign='left' id="MyStopOrders-table">
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell className='MyStopOrders-table-header' textAlign='left'>Action</Table.HeaderCell>
              <Table.HeaderCell className='MyStopOrders-table-header' textAlign='left'>Condition</Table.HeaderCell>
              <Table.HeaderCell className='MyStopOrders-table-header' textAlign='left'>Trade Amt</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          { orders_table }
        </Table>
        { background_item }
      </div>
    );
  }
}

export default MyStopOrders