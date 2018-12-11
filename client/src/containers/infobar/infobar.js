import React, { Component } from 'react'
import { Header, Table, Checkbox } from 'semantic-ui-react'
import './infobar.css'

import WrapStation from './wrapstation/wrapstation'

class Infobar extends Component {
  constructor(props, context) {
    super(props)
    var currencies = {
      "WETH": {
        balance: 0,
        approved: true
      },
      "DAI": {
        balance: 0,
        approved: true
      },
      "MKR": {
        balance: 0,
        approved: true
      }
    }
    this.state = {
      currencies: currencies,
      account: null,
      keys: {
        "WETH": null,
        "DAI": null,
        "MKR": null
      }
    }
  }

  componentDidMount() {
    const { drizzle, drizzleState } = this.props
    let account = drizzleState.accounts[0]
    const wethDataKey = drizzle.contracts.WETH.methods.balanceOf.cacheCall(account)
    const daiDataKey = drizzle.contracts.DAI.methods.balanceOf.cacheCall(account)
    const mkrDataKey = drizzle.contracts.MKR.methods.balanceOf.cacheCall(account)

    let keys = Object.assign({}, this.state.keys)
    keys["WETH"] = wethDataKey
    keys["DAI"] = daiDataKey
    keys["MKR"] = mkrDataKey
    this.setState({ keys, account: account })
  }

  render() {
    const { currencies, keys, account } = this.state
    const contracts = this.props.drizzleState.contracts
    let eth_balance = this.props.drizzleState.accountBalances[account]

    const vals = Object.keys(currencies).map((key) => {
      var obj = currencies[key]
      obj["name"] = key
      if(keys[key] in contracts[key].balanceOf) {
        let val = contracts[key].balanceOf[keys[key]].value
        if(val) {
          val = Math.round(this.props.drizzle.web3.utils.fromWei(val.toString(), 'ether') * 1000) / 1000
        } else {
          val = "Error..."
        }
        obj["balance"] = val
      }
      return obj
    })

    vals.push({
      "balance": eth_balance ? Math.round(this.props.drizzle.web3.utils.fromWei(eth_balance.toString(), 'ether') * 1000) / 1000 : 0,
      "approved": true,
      "name": "ETH"
    })

    return (
      <div id='Infobar'>
        <div className='Infobar-header'>{account}</div>
        <Table basic='very' padded='very' striped id="Infobar-table">
          <Table.Header id="Infobar-table-header">
            <Table.Row>
              <Table.HeaderCell className='Infobar-table-entry' textAlign='left'>Token</Table.HeaderCell>
              <Table.HeaderCell className='Infobar-table-entry' textAlign='left'>Balance</Table.HeaderCell>
              <Table.HeaderCell className='Infobar-table-entry' textAlign='left'>Approved</Table.HeaderCell>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {vals.map((item, index) => {
              return (
                <Table.Row key={index}>
                  <Table.Cell>
                    <Header className='Infobar-table-entry' as='h3' textAlign='left'>{item.name}</Header>
                  </Table.Cell>

                  <Table.Cell>
                    <Header className='Infobar-table-entry' as='h3' textAlign='left'>{item.balance}</Header>
                  </Table.Cell>

                  <Table.Cell  textAlign='left'>
                    <Checkbox toggle checked={item.approved} />
                  </Table.Cell>
                </Table.Row>
              )
            })}
          </Table.Body>
        </Table>

        <WrapStation drizzle={this.props.drizzle} drizzleState={this.props.drizzleState} weth_key={keys["WETH"]} />
      </div>
    )
  }
}

export default Infobar;