// Import Major Dependencies
import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import { ethers } from 'ethers';
import { Header, Table, Checkbox, Icon, Button } from 'semantic-ui-react'

// Import CSS Files
import './infobar.css'

// Import src code
import WrapStation from './wrapstation/wrapstation'
import HumanName from '../utils/humanname/humanname'

// Set up constants
const MAX_VAL = "115792089237316195423570985008687907853269984665640564039457584007913129639935";

// Class that controls the side information bar that contains the account balances
// and the wrapping/unwrapping widget.
class Infobar extends Component {
  constructor(props, context) {
    super(props);
    this.state = {
      currencies: {
        "WETH": { balance: 0, approved: 0 },
        "DAI": { balance: 0, approved: 0 },
        "SAI": { balance: 0, approved: 0 },
        "MKR": { balance: 0, approved: 0 },
        "ETH": { balance: 0, approved: 0  }
      },
      account: ""
    };

    this.updateInfo = this.updateInfo.bind(this);
  }

  componentDidMount() {
    // Kick off the update timeout loop
    this.updateInfo();
  }

  // Timed recursive function that periodically updates the information from the blockchain.
  async updateInfo() {
    const { options } = this.props;

    try {
      // If the page is not readOnly then get balances for the active account.
      if(!options.readOnly) {
        console.log("Updating Sidebar Balances...");
        const account = await options.signer.getAddress();
        const market_address = options.contracts.Market.address;

        // Retrieve the balances and approvals
        const [weth_balance, dai_balance, sai_balance, mkr_balance] = await this.getBalances(account);
        const [weth_approval, dai_approval, sai_approval, mkr_approval] = await this.getApprovals(account, market_address);
        const eth_balance = await options.provider.getBalance(account);

        // Create and store currencies object
        var currencies = {
          "WETH": { balance: weth_balance.toString(), approved: weth_approval.toString() },
          "DAI": { balance: dai_balance.toString(), approved: dai_approval.toString() },
          "SAI": { balance: sai_balance.toString(), approved: sai_approval.toString() },
          "MKR": { balance: mkr_balance.toString(), approved: mkr_approval.toString() },
          "ETH": { balance: eth_balance.toString(), approved: MAX_VAL  }
        };
        this.setState({ currencies, account });
      }
    } catch (err) {
      console.log("Error Getting Sidebar Balalnces!: " + err);
    } finally {
      // Call the same function after timeout of 3 seconds
      setTimeout(this.updateInfo, 3000);
    }
  }

  /** ################# BLOCKCHAIN WRITE FUNCTIONS ################# **/

  // Approves the market contract to use a given amount of a given currency.
  async approveCurrencyForAmount(currency, amount) {
    var { options } = this.props
    
    let market_address = options.contracts.Market.address

    if(currency in options.contracts) {
      var contract = options.contracts[currency]
      await contract.approve(market_address, amount)
    }
  }

  // Approves a MAX_VAL amount of a given currency for the market contract.
  approveCurrency(currency) {
    this.approveCurrencyForAmount(currency, MAX_VAL)
  }

  // Approves a 0 amount of a given currency for the market contract.
  unapproveCurrency(currency) {
    this.approveCurrencyForAmount(currency, "0")
  }

  // Toggles between approving and unapproving a currency.
  toggleApproval(currency, current_approval) {
    let new_approval = !current_approval
    if(new_approval) {
      this.approveCurrency(currency)
    } else {
      this.unapproveCurrency(currency)
    }
  }

  /** ################# HELPER FUNCTIONS ################# **/

  // Helper function to get balances for all the currencies for the given account.
  async getBalances(account) {
    const { options } = this.props;
    const weth_promise = options.contracts.WETH.balanceOf(account);
    const dai_promise = options.contracts.DAI.balanceOf(account);
    const sai_promise = options.contracts.SAI.balanceOf(account);
    const mkr_promise = options.contracts.MKR.balanceOf(account);
    return Promise.all([weth_promise, dai_promise, sai_promise, mkr_promise]);
  }

  // Helper function to get approvals for all the currencies in this market for the given account.
  async getApprovals(account, market_address) {
    const { options } = this.props;
    const weth_promise = await options.contracts.WETH.allowance(account, market_address);
    const dai_promise = await options.contracts.DAI.allowance(account, market_address);
    const sai_promise = await options.contracts.SAI.allowance(account, market_address);
    const mkr_promise = await options.contracts.MKR.allowance(account, market_address);
    return Promise.all([weth_promise, dai_promise, sai_promise, mkr_promise])
  }

  // Helper function that gets the UI balance, meaning it is in Ethers (not Gwei) and Rounded to the nearest 1000ths place.
  // If there is a problem in the value then the value is a Error string.
  getUIBalance(raw_balance) {
    let UI_balance = raw_balance
    if(raw_balance != null) {
      UI_balance = Math.round(ethers.utils.formatUnits(raw_balance.toString(), 'ether') * 1000) / 1000
    } else {
      UI_balance = "Error..."
    }
    return UI_balance    
  }

  // Helper function that gets the toggle value for the allowance for a given balance/allowance pair
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

  // Helper function to create object that is used for easy rendering.
  buildRenderList() {
    const { currencies } = this.state;
    const renderList = Object.keys(currencies).map((key) => {
      let raw_balance = currencies[key]["balance"];
      let raw_allowance = currencies[key]["approved"];
      return {
        name: key,
        balance: this.getUIBalance(raw_balance),
        approved: this.getUIAllowance(raw_balance, raw_allowance)
      };
    })
    return renderList;
  }

  /** ################# RENDER ################# **/

  render() {
    const { currencies, account } = this.state
    const { padded, closeSidebar, options } = this.props
    const currenciesInformation = this.buildRenderList();

    // Display a X icon if the user is on mobile (indicated b padded).
    var x_icon = <Icon name="close" id="Infobar-x" size="large" onClick={closeSidebar} />
    if(padded) {
      x_icon = null
    }

    // Retrieve the username or Login button if readOnly is true.
    var username = <Button primary as={Link} to={'/login'} fluid onClick={closeSidebar} >Login</Button>
    if(!options.readOnly) {
      username = <HumanName address={account} />
    }

    return (
      <div id='Infobar'>
        {/* Insert the account information bar */}
        <div className='Infobar-header'>{username} {x_icon}</div>
        
        {/* Insert the Table of Balances/Approvals */}
        <Table basic='very' padded={"very"} striped unstackable id="Infobar-table">
          <Table.Header id="Infobar-table-header">
            <Table.Row>
              <Table.Cell>
                <Header className='Infobar-table-entry' textAlign='left'>Token</Header>
              </Table.Cell>
              <Table.Cell>
                <Header className='Infobar-table-entry' textAlign='left'>Balance</Header>
              </Table.Cell>
              <Table.Cell>
                <Header className='Infobar-table-entry' textAlign='left'>Approved</Header>
              </Table.Cell>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {/* Loop and render each currency's info */}
            {currenciesInformation.map((currency, index) => {
              return (
                <Table.Row key={index}>
                  <Table.Cell>
                    <Header className='Infobar-table-entry' textAlign='left'>{currency.name}</Header>
                  </Table.Cell>

                  <Table.Cell>
                    <Header className='Infobar-table-entry' textAlign='left'>{currency.balance}</Header>
                  </Table.Cell>

                  <Table.Cell  textAlign='left'>
                    <Checkbox toggle disabled={currency.name === "ETH" || options.readOnly} checked={currency.approved} onClick={ () => this.toggleApproval(currency.name, currency.approved) } />
                  </Table.Cell>
                </Table.Row>
              )
            })}
          </Table.Body>
        </Table>

        {/* Insert the wrapping station widget into the sidebar. */}
        <WrapStation options={options} weth_balance={currencies["WETH"]["balance"]} eth_balance={currencies["ETH"]["balance"]} />
      </div>
    )
  }
}

export default Infobar;