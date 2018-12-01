import React, { Component } from 'react'
import { ContractData, ContractForm } from 'drizzle-react-components'
import { Table } from 'semantic-ui-react'

import './orderlist.css'

class OrderList extends Component {
  constructor(props) {
    super(props)
    this.state = {
    }
  }

  componentWillMount() {
  }

  render() {
    var { currencies, orders } = this.props

    if(orders.length === 0) {
      return (
        <div className="OrderList">
          <div className="OrderList-loading">Loading...</div>
        </div>
      )
    }

    return (
      <div className="OrderList">
        <Table selectable basic celled columns={3} id="OrderList-table">
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell className='OrderList-table-header' textAlign='left'>Price</Table.HeaderCell>
              <Table.HeaderCell className='OrderList-table-header' textAlign='left'>{currencies[0]}</Table.HeaderCell>
              <Table.HeaderCell className='OrderList-table-header' textAlign='left'>{currencies[1]}</Table.HeaderCell>
            </Table.Row>
          </Table.Header>

          <Table.Body id="OrderList-tableBody">
            {orders.map((item, index) => {
              return (
                <Table.Row key={index}>
                  <Table.Cell>
                    <div className='OrderList-table-entry'>{item[0]}</div>
                  </Table.Cell>

                  <Table.Cell>
                    <div className='OrderList-table-entry'>{item[1]}</div>
                  </Table.Cell>

                  <Table.Cell  textAlign='left'>
                    <div className='OrderList-table-entry'>{item[2]}</div>
                  </Table.Cell>
                </Table.Row>
              )
            })}
          </Table.Body>
        </Table>

      </div>
    );
  }
}

export default OrderList
