import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import { ethers } from 'ethers';
import { Header, Table, Checkbox, Icon, Button } from 'semantic-ui-react'
import './infobar.css'

import WrapStation from './wrapstation/wrapstation'
import HumanName from '../utils/humanname/humanname'

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
      },
      account: ""
    }

    this.updateInfo = this.updateInfo.bind(this)
  }

  componentDidMount() {
    this.updateInfo()
  }

  async updateInfo() {
    const { options } = this.props

    if(!options.readOnly) {
      let account = await options.signer.getAddress()
      let market_address = options.contracts.Market.address

      const weth_balance = await options.contracts.WETH.balanceOf(account)
      const dai_balance = await options.contracts.DAI.balanceOf(account)
      const mkr_balance = await options.contracts.MKR.balanceOf(account)
      
      const weth_approval = await options.contracts.WETH.allowance(account, market_address)
      const dai_approval = await options.contracts.DAI.allowance(account, market_address)
      const mkr_approval = await options.contracts.MKR.allowance(account, market_address)
      
      var eth_balance = await options.provider.getBalance(account)

      var currencies = {
        "WETH": {
          balance: weth_balance.toString(),
          approved: weth_approval.toString()
        },
        "DAI": {
          balance: dai_balance.toString(),
          approved: dai_approval.toString()
        },
        "MKR": {
          balance: mkr_balance.toString(),
          approved: mkr_approval.toString()
        },
        "ETH": {
          balance: eth_balance.toString(),
          approved: "115792089237316195423570985008687907853269984665640564039457584007913129639935"
        }
      }
      this.setState({ currencies, account })
    }

    setTimeout(this.updateInfo, 3000)
  }

  async approveCurrencyForAmount(currency, amount) {
    var { options } = this.props
    
    let market_address = options.contracts.Market.address

    if(currency in options.contracts) {
      var contract = options.contracts[currency]
      await contract.approve(market_address, amount)
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
      UI_balance = Math.round(ethers.utils.formatUnits(raw_balance.toString(), 'ether') * 1000) / 1000
    } else {
      UI_balance = "Error..."
    }
    return UI_balance    
  }

  getUIAllowance(raw_balance, raw_allowance) {
    let UI_allowance = false
    raw_allowance = ethers.utils.bigNumberify(raw_allowance)
    let balance = ethers.utils.bigNumberify(raw_balance)
    if(raw_allowance.gt(balance)) {
      UI_allowance = true
    } else {
      UI_allowance = false
    }
    return UI_allowance
  }

  render() {
    const { currencies, account } = this.state
    const { padded, closeSidebar, options } = this.props

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

    var x_icon = <Icon name="close" id="Infobar-x" size="large" onClick={closeSidebar} />
    if(padded) {
      x_icon = null
    }

    var username = <Button primary as={Link} to={'/login'} fluid onClick={closeSidebar} >Login</Button>
    if(!options.readOnly) {
      username = <HumanName address={account} />
    }


    return (
      <div id='Infobar'>
        <div className='Infobar-header'>{username}{x_icon}</div>
        <Table basic='very' padded={"very"} striped unstackable id="Infobar-table">
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
                    <Checkbox toggle disabled={item.name === "ETH" || options.readOnly} checked={item.approved} onClick={ () => this.toggleApproval(item.name, item.approved) } />
                  </Table.Cell>
                </Table.Row>
              )
            })}
          </Table.Body>
        </Table>

        <WrapStation options={options} weth_balance={currencies["WETH"]["balance"]} eth_balance={currencies["ETH"]["balance"]} />
      </div>
    )
  }
}

export default Infobar;