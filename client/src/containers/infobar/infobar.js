import React, { Component } from 'react'
import { Header, Table, Checkbox, Icon } from 'semantic-ui-react'
import './infobar.css'

import WrapStation from './wrapstation/wrapstation'

class Infobar extends Component {
  constructor(props, context) {
    super(props)
    this.state = {
      currencies: {
        "WETH": {
          balance: 0,
          approved: 0
        },
        "DAI": {
          balance: 0,
          approved: 0
        },
        "MKR": {
          balance: 0,
          approved: 0
        },
        "ETH": {
          balance: 0,
          approved: 0
        }
      }
    }

    this.updateInfo = this.updateInfo.bind(this)
  }

  componentDidMount() {
    this.updateInfo()
  }

  async updateInfo() {
    const { drizzle, drizzleState } = this.props
    let account = drizzleState.accounts[0]
    let market_address = drizzle.contracts.Market.address
    
    const weth_balance = await drizzle.contracts.WETH.methods.balanceOf(account).call()
    const dai_balance = await drizzle.contracts.DAI.methods.balanceOf(account).call()
    const mkr_balance = await drizzle.contracts.MKR.methods.balanceOf(account).call()
    
    const weth_approval = await drizzle.contracts.WETH.methods.allowance(account, market_address).call()
    const dai_approval = await drizzle.contracts.DAI.methods.allowance(account, market_address).call()
    const mkr_approval = await drizzle.contracts.MKR.methods.allowance(account, market_address).call()
    
    var eth_balance = drizzleState.accountBalances[account]

    var currencies = {
      "WETH": {
        balance: weth_balance,
        approved: weth_approval
      },
      "DAI": {
        balance: dai_balance,
        approved: dai_approval
      },
      "MKR": {
        balance: mkr_balance,
        approved: mkr_approval
      },
      "ETH": {
        balance: eth_balance,
        approved: "115792089237316195423570985008687907853269984665640564039457584007913129639935"
      }
    }

    this.setState({ currencies })

    setTimeout(this.updateInfo, 5000)
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

  getUIBalance(raw_balance) {
    let UI_balance = raw_balance
    if(raw_balance != null) {
      UI_balance = Math.round(this.props.drizzle.web3.utils.fromWei(raw_balance.toString(), 'ether') * 1000) / 1000
    } else {
      UI_balance = "Error..."
    }
    return UI_balance    
  }

  getUIAllowance(raw_balance, raw_allowance) {
    const web3 = this.props.drizzle.web3
    let UI_allowance = false
    raw_allowance = web3.utils.toBN(raw_allowance)
    let balance = web3.utils.toBN(raw_balance)
    if(raw_allowance.gte(balance)) {
      UI_allowance = true
    } else {
      UI_allowance = false
    }
    return UI_allowance
  }

  render() {
    const { currencies } = this.state
    const { padded, closeSidebar, drizzle, drizzleState } = this.props
    let account = drizzleState.accounts[0]

    const vals = Object.keys(currencies).map((key) => {
      var obj = {}
      obj["name"] = key
      obj["balance"] = "0"
      obj["approved"] = false
      var raw_balance = currencies[key]["balance"]
      var raw_allowance = currencies[key]["approved"]
      if(raw_balance && raw_allowance) {
        obj["balance"] = this.getUIBalance(raw_balance)
        obj["approved"] = this.getUIAllowance(raw_balance, raw_allowance)      
      }
      return obj
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

        <WrapStation drizzle={drizzle} drizzleState={drizzleState} weth_balance={currencies["WETH"]["balance"]} eth_balance={currencies["ETH"]["balance"]} />
      </div>
    )
  }
}

export default Infobar;