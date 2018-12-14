import React, { Component } from 'react'
import { Header, Table, Checkbox, Icon } from 'semantic-ui-react'
import './infobar.css'

import WrapStation from './wrapstation/wrapstation'

class Infobar extends Component {
  constructor(props, context) {
    super(props)
    var currencies = {
      "WETH": {
        balance: 0,
        approved: false
      },
      "DAI": {
        balance: 0,
        approved: false
      },
      "MKR": {
        balance: 0,
        approved: false
      }
    }
    this.state = {
      currencies: currencies,
      account: null,
      keys: {
        "WETH": null,
        "DAI": null,
        "MKR": null
      },
      approval_keys: {
        "WETH": null,
        "DAI": null,
        "MKR": null
      }
    }
  }

  componentDidMount() {
    const { drizzle, drizzleState } = this.props
    let account = drizzleState.accounts[0]
    let market_address = drizzle.contracts.Market.address
    const wethDataKey = drizzle.contracts.WETH.methods.balanceOf.cacheCall(account)
    const daiDataKey = drizzle.contracts.DAI.methods.balanceOf.cacheCall(account)
    const mkrDataKey = drizzle.contracts.MKR.methods.balanceOf.cacheCall(account)

    let keys = Object.assign({}, this.state.keys)
    keys["WETH"] = wethDataKey
    keys["DAI"] = daiDataKey
    keys["MKR"] = mkrDataKey

    const wethApprovalKey = drizzle.contracts.WETH.methods.allowance.cacheCall(account, market_address)
    const daiApprovalKey = drizzle.contracts.DAI.methods.allowance.cacheCall(account, market_address)
    const mkrApprovalKey = drizzle.contracts.MKR.methods.allowance.cacheCall(account, market_address)

    let approval_keys = Object.assign({}, this.state.approval_keys)
    approval_keys["WETH"] = wethApprovalKey
    approval_keys["DAI"] = daiApprovalKey
    approval_keys["MKR"] = mkrApprovalKey

    this.setState({ keys, approval_keys, account: account })
  }

  approveCurrencyForAmount(currency, amount) {
    var { drizzle, drizzleState } = this.props
    var account = drizzleState.accounts[0]
    let market_address = drizzle.contracts.Market.address
    var web3 = drizzle.web3

    if(currency in drizzle.contracts) {
      var currency_contract = drizzle.contracts[currency]
      
      var approve = currency_contract.methods.approve
      approve.cacheSend(market_address, amount, {from: account, gasPrice: web3.utils.toWei('5', 'gwei') })
    }
  }

  approveCurrency(currency) {
    this.approveCurrencyForAmount(currency, "115792089237316195423570985008687907853269984665640564039457584007913129639935")
  }

  unapproveCurrency(currency) {
    this.approveCurrencyForAmount(currency, "0")
  }

  toggleApproval(currency, current_approval) {
    let new_approval = !current_approval
    if(new_approval) {
      this.approveCurrency(currency)
    } else {
      this.unapproveCurrency(currency)
    }
  }

  render() {
    const { currencies, keys, approval_keys, account } = this.state
    const { padded, closeSidebar } = this.props
    const web3 = this.props.drizzle.web3
    const contracts = this.props.drizzleState.contracts
    let eth_balance = this.props.drizzleState.accountBalances[account]

    const vals = Object.keys(currencies).map((key) => {
      var obj = currencies[key]
      obj["name"] = key
      var raw_balance = "0"
      var raw_allowance = "0"
      if(keys[key] in contracts[key].balanceOf) {
        raw_balance = contracts[key].balanceOf[keys[key]].value
        let UI_balance = raw_balance
        if(raw_balance != null && raw_allowance != null) {
          UI_balance = Math.round(this.props.drizzle.web3.utils.fromWei(raw_balance.toString(), 'ether') * 1000) / 1000
        } else {
          UI_balance = "Error..."
        }
        obj["balance"] = UI_balance
      }

      if(approval_keys[key] in contracts[key].allowance) {
        raw_allowance = contracts[key].allowance[approval_keys[key]].value
        var UI_allowance = false
        if(raw_allowance != null && raw_balance != null) {
          raw_allowance = web3.utils.toBN(raw_allowance)
          let balance = web3.utils.toBN(raw_balance)
          if(raw_allowance.gte(balance)) {
            UI_allowance = true
          } else {
            UI_allowance = false
          }
        }
        obj["approved"] = UI_allowance
      }

      return obj
    })

    vals.push({
      "balance": eth_balance ? Math.round(this.props.drizzle.web3.utils.fromWei(eth_balance.toString(), 'ether') * 1000) / 1000 : "Error...",
      "approved": true,
      "name": "ETH"
    })

    var padding = null
    var ui_account = account
    var x_icon = <Icon name="close" id="Infobar-x" size="large" onClick={closeSidebar} />
    if(padded) {
      padding = "very"
      x_icon = null
    } else {
      if(ui_account) {
        ui_account = ui_account.substring(0, 10) + " ... " + ui_account.substring(ui_account.length - 10, ui_account.length) 
      }
    }

    return (
      <div id='Infobar'>
        <div className='Infobar-header'>{ui_account}{x_icon}</div>
        <Table basic='very' padded={padding} striped unstackable id="Infobar-table">
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
                    <Header className='Infobar-table-entry' textAlign='left'>{item.name}</Header>
                  </Table.Cell>

                  <Table.Cell>
                    <Header className='Infobar-table-entry' textAlign='left'>{item.balance}</Header>
                  </Table.Cell>

                  <Table.Cell  textAlign='left'>
                    <Checkbox toggle disabled={item.name === "ETH"} checked={item.approved} onClick={ () => this.toggleApproval(item.name, item.approved) } />
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