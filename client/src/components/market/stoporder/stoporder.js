// Import Major Dependencies
import React, { Component } from 'react'
import { ethers } from 'ethers';
import { Input, Form, Button, Loader, Dropdown, Checkbox } from 'semantic-ui-react'

// Import CSS Files
import './stoporder.css'

const MAX_VAL = "115792089237316195423570985008687907853269984665640564039457584007913129639935";

class StopOrder extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      error: false,
      success: false,
      condOrderType: '',
      conditional: '',
      targetPrice: '',
      tradeOrderType: '',
      tradeAmount: '0',
      tradeAmountUI: '',
      approved: false,
      bignumbers: []
    };

    this.handlePlaceOrder = this.handlePlaceOrder.bind(this);
    this.flashSuccess = this.flashSuccess.bind(this);
    this.flashError = this.flashError.bind(this);
    this.updateInfo = this.updateInfo.bind(this);
    this.toggleApproval = this.toggleApproval.bind(this);
  }

  componentDidMount() {
    this.generateBigNumbers();
    this.updateInfo();
  }

  // Timed recursive function that periodically updates the information from the blockchain.
  async updateInfo() {
    const { options } = this.props;

    try {
      // If the page is not readOnly then get balances for the active account.
      if(!options.readOnly) {
        console.log("Updating Stoploss Allowances...");
        const account = await options.signer.getAddress();
        const [curr0_approval, curr1_approval] = await this.getApprovals(account);
        console.log("APPROVAL 0: " + curr0_approval)
        console.log("APPROVAL 1: " + curr1_approval)
        const zeroBN = ethers.utils.bigNumberify("0");
        let approved = false;
        if (ethers.utils.bigNumberify(curr0_approval).gt(zeroBN) && ethers.utils.bigNumberify(curr0_approval).gt(zeroBN)) {
          approved = true;
        }

        this.setState({ approved });
      }
    } catch (err) {
      console.log("Error getting Stoploss Allowances!: " + err);
    } finally {
      // Call the same function after timeout of 3 seconds
      setTimeout(this.updateInfo, 3000);
    }
  }

  // Generates and stores a list of BigNumber integers for arithmetic later
  generateBigNumbers() {
    let bignumbers = {};
    for(let i = 0; i <= 10; i++) {
      const key = i;
      bignumbers[key] = ethers.utils.bigNumberify(key);
    }

    this.setState({ bignumbers });
  }

  getPayReceiveCryptos(orderType) {
    const { options, currencies } = this.props;
    if (orderType === "BUY") {
      return [ options.contracts[currencies[1]].address, options.contracts[currencies[0]].address ]
    } else {
      return [ options.contracts[currencies[0]].address, options.contracts[currencies[1]].address ]
    }
  }

  getReceiveLimit(orderType, price, payAmt) {
    const priceBN = ethers.utils.bigNumberify(price.toString());
    const payAmtBN = ethers.utils.bigNumberify(payAmt.toString());
    if (orderType === "BUY") {
      return payAmtBN.div(priceBN).toString();
    } else {
      return payAmtBN.mul(priceBN).toString();
    }
  }

  getUpDown(orderType, conditional) {
    if (orderType === "BUY") {
      return conditional === ">" ? 1 : 0;
    } else {
      return conditional === ">" ? 0 : 1;
    }
  }

  // Handler for Market Buy
  async handlePlaceOrder() {
    // Set loading to true to update UI
    const loading = true;
    const error = false;
    const success = false;
    this.setState({ loading , error, success });
    
    // Retrieve important variables
    const { condOrderType, conditional, targetPrice, tradeOrderType, tradeAmount } = this.state;
    const { options } = this.props;
    
    const [ condPayCrypto, condReceiveCrypto ] = this.getPayReceiveCryptos(condOrderType);
    const [ tradePayCrypto, tradeReceiveCrypto ] = this.getPayReceiveCryptos(tradeOrderType);
    const condPayAmt = tradeAmount;
    const condReceiveLimit = this.getReceiveLimit(condOrderType, targetPrice, condPayAmt);
    const tradePayAmt = tradeAmount;

    const updown = this.getUpDown(condOrderType, conditional);

    // Assemble the data information into an object
    const data = {
      updown,
      condPayCrypto,
      condPayAmt,
      condReceiveCrypto,
      condReceiveLimit,
      tradePayCrypto,
      tradeReceiveCrypto,
      tradePayAmt
    };

    // Log the data object to console for clarity
    console.log(data);

    // Try catch to handle successful and failed tx
    try {
      var tx = await options.contracts.OasisX.createOrder(data["updown"], data["condPayCrypto"], data["condPayAmt"], data["condReceiveCrypto"], data["condReceiveLimit"], data["tradePayCrypto"], data["tradeReceiveCrypto"], data["tradePayAmt"], { gasLimit: 500000, gasPrice: options.gasPrice });
      // Wait for transaction to finish
      await tx.wait();
      this.flashSuccess();
    } catch (error) {
      this.flashError();
    }
  }

  // Handler for when a tx is successful
  flashSuccess() {
    const loading = false;
    const success = true;
    const error = false;
    this.setState({ loading, success, error });
    setTimeout(() => this.reset(), 1500);
  }

  // Handler for whne a tx is failed
  flashError() {
    const loading = false;
    const success = false;
    const error = true;
    this.setState({ loading, success, error });
    setTimeout(() => {
      const error = false;
      this.setState({ error });
    }, 1500);
  }

  // State reset function that completely nullifies the component state
  reset() {
    const loading = false;
    const success = false;
    const error = false;
    this.setState({ loading, success, error });
  }

  // Handler for changes in price in the UI
  handleTargetPriceChange(value) {
    if(/\S/.test(value)) {
      const targetPrice = value;
      this.setState({ targetPrice });
    }
  }

  handleFieldChange(name, value) {
    console.log(value);
    this.setState({ [name]: value })
  }

  // Handler for a change in the amount of currency to be traded
  handleAmountChange(value) {
    let newTradeAmount, newTradeAmountUI;

    // If there is an error then replace values with empty values
    try {
      // Test the new amount value to see if it is whitespace and if so replace with empty values
      if(/\S/.test(value)) {
        const ui_amount = value;

        // Get BigNumber representation of the amount in wei
        const amount_bn = ethers.utils.bigNumberify(ethers.utils.parseUnits(ui_amount.toString(), 'ether'));

        // Reassign the new amounts
        newTradeAmount = amount_bn.toString();
        newTradeAmountUI = ui_amount.toString();

      } else {
        newTradeAmount = '0';
        newTradeAmountUI = '';
      }
    } catch(err) {
      console.log(err);
      newTradeAmount = '0';
      newTradeAmountUI = '';
    }

    this.setState({ tradeAmount: newTradeAmount, tradeAmountUI: newTradeAmountUI });
  }

  // Handler for changes in amount using percentage tool
  handleAmountPercentageChange(value) {
    // Initialize ui_amount to 0 to be replaced by real value in try/catch
    const amount_bn = value;
    let ui_amount = ethers.utils.formatUnits("0", 'ether');
    try {
      ui_amount = ethers.utils.formatUnits(amount_bn.toString(), 'ether');
    } catch(err) {
      console.log(err);
    }

    let newTradeAmount = amount_bn.toString();
    let newTradeAmountUI = ui_amount.toString();

    // Store new objects
    this.setState({tradeAmount: newTradeAmount, tradeAmountUI: newTradeAmountUI});
  }

  buildExplanation() {
    const { condOrderType, conditional, targetPrice, tradeOrderType, tradeAmountUI } = this.state;
    const { currencies } = this.props;
    let amount_label = "____";
    if (tradeOrderType !== "") {
      amount_label = tradeOrderType === "BUY" ? currencies[1] : currencies[0];
    }
    const condOrderType_corrected = condOrderType === "" ? "____" : condOrderType;
    const conditional_corrected = conditional === "" ? "__" : conditional;
    const targetPrice_corrected = targetPrice === "" ? "____" : targetPrice;
    const tradeOrderType_corrected = tradeOrderType === "" ? "____" : tradeOrderType;
    const tradeAmountUI_corrected = tradeAmountUI === "0" || tradeAmountUI === "" ? "____" : tradeAmountUI;
    const explanation = "If Market " + condOrderType_corrected + " Price " + conditional_corrected + " " + targetPrice_corrected + " " + currencies[1] + "/" + currencies[0] + " then Market " + tradeOrderType_corrected + " using " + tradeAmountUI_corrected + " " + amount_label;
    return explanation;
  }

  // Approves the market contract to use a given amount of a given currency.
  async approveCurrencyForAmount(amount) {
    var { currencies, options } = this.props
    
    let oasisx_address = options.contracts.OasisX.address

    let promises = [];
    for (var i in currencies) {
      const currency = currencies[i];
      var contract = options.contracts[currency]
      promises.push(contract.approve(oasisx_address, amount))
    }

    return Promise.all(promises);
  }

  // Approves a MAX_VAL amount of active currencies for the oasisX contract.
  approveCurrency() {
    this.approveCurrencyForAmount(MAX_VAL)
  }

  // Approves a 0 amount of active currencies for the oasisX contract.
  unapproveCurrency() {
    this.approveCurrencyForAmount("0")
  }

  toggleApproval() {
    const newApproved = !this.state.approved;
    if (newApproved) {
      this.approveCurrency();
    } else {
      this.unapproveCurrency();
    }
    this.setState({ approved: newApproved });
  }

// Helper function to get approvals for all the currencies in this market for the given account.
  async getApprovals(account) {
    const { options, currencies } = this.props;
    const { OasisX } = options.contracts;
    const oasisx_address = OasisX.address;
    let promises = [];
    for (let i in currencies) {
      promises.push(options.contracts[currencies[i]].allowance(account, oasisx_address));
    }
    return Promise.all(promises);
  }

  /** ################# RENDER ################# **/

  render() {
    const { bignumbers, loading, success, error, condOrderType, conditional, targetPrice, tradeOrderType, tradeAmount, tradeAmountUI, approved } = this.state;
    const { currencies, balances, options } = this.props;
    

    // Get the balances for each currency
    const curr_0_balance = ethers.utils.bigNumberify(balances[0]);
    const curr_1_balance = ethers.utils.bigNumberify(balances[1]);
    
    // Set flags if buying/selling is logically valid
    let can_place_order = true;
    if (!approved || targetPrice === "" || tradeAmountUI === "" || tradeAmount === "0" || conditional === "" || condOrderType === "" || tradeOrderType === "") {
      can_place_order = false;
    }
    
    // If the balance is greater than the amount then set the proper flags
    // if(curr_0_balance.gte(amount_0_bn) && amount_0_bn.gt(ethers.utils.bigNumberify("1000")) && slippage !== "") {
    //   can_place_order = true;
    // }

    // Generate the side text next to the buttons
    let side_text = "";
    if(loading) {
        side_text = (<span className="StopOrder-color"><Loader active inline size="small"/> LOADING...</span>);
    }
    if(error) {
      side_text = (<span className="red StopOrder-color">FAILED</span>);
    }
    if(success) {
      side_text = (<span className="green StopOrder-color">SUCCESS</span>);
    }

    const conditionOrderTypes = [
      {
        key: "BUY",
        text: "Buy",
        value: "BUY"
      },
      {
        key: "SELL",
        text: "Sell",
        value: "SELL"
      }
    ];
    const conditionalTypes = [
      {
        key: ">",
        text: ">",
        value: ">"
      },
      {
        key: "<",
        text: "<",
        value: "<"
      }
    ];

    const curr_balance = tradeOrderType === "BUY" ? curr_1_balance : curr_0_balance;
    const amount_label = tradeOrderType === "BUY" ? currencies[1] : currencies[0];
    const explanation = this.buildExplanation();

    return (
      <div className="StopOrder">
        <div className="StopOrder-pane">
          <div className="StopOrder-main-header">Stop Order (Activated: <Checkbox fitted toggle disabled={options.readOnly} checked={approved} onClick={this.toggleApproval} /> )</div>
          <Form size='tiny'>
            <Form.Field>
              <div className="StopOrder-headers">Condition Order Type</div>
              <Dropdown placeholder='Order Type' selection options={conditionOrderTypes} value={condOrderType} onChange={(e, data) => { this.handleFieldChange("condOrderType", data.value) }}/>
            </Form.Field>
            <Form.Field>
              <div className="StopOrder-headers">Conditional</div>
              <Dropdown placeholder='Conditional' selection options={conditionalTypes} value={conditional} onChange={(e, data) => { this.handleFieldChange("conditional", data.value) }}/>
            </Form.Field>
            <Form.Field>
              <div className="StopOrder-headers">Target Price</div>
              <Input
                label={{ basic: true, content: currencies[1] + "/" + currencies[0] }}
                labelPosition='right'
                placeholder='Enter Amount...'
                value={targetPrice}
                onChange={(e) => { this.handleTargetPriceChange(e.target.value) }}
                className="StopOrder-amount-input"
                disabled={options.readOnly}
              />
            </Form.Field>
            <hr />
            <Form.Field>
              <div className="StopOrder-headers">Trade Order Type</div>
              <Dropdown placeholder='Order Type' selection options={conditionOrderTypes} value={tradeOrderType} onChange={(e, data) => { this.handleFieldChange("tradeOrderType", data.value) }}/>
            </Form.Field>
            <Form.Group widths='equal'>
              <Form.Field>
                <div className="StopOrder-headers">Trade Amount</div>
                <Input
                  label={{ basic: true, content: amount_label }}
                  labelPosition='right'
                  placeholder='Enter Amount...'
                  value={tradeAmountUI}
                  onChange={(e) => { this.handleAmountChange(e.target.value) }}
                  className="StopOrder-amount-input"
                  disabled={options.readOnly}
                />
                <Button.Group className="StopOrder-mini-buttons" size='mini' basic inverted disabled={tradeOrderType === ''}>
                  <Button disabled={options.readOnly} onClick={() => this.handleAmountChange('') } >0%</Button>
                  <Button disabled={options.readOnly} onClick={() => this.handleAmountPercentageChange(curr_balance.div(bignumbers[4]))} >25%</Button>
                  <Button disabled={options.readOnly} onClick={() => this.handleAmountPercentageChange(curr_balance.div(bignumbers[2]))} >50%</Button>
                  <Button disabled={options.readOnly} onClick={() => this.handleAmountPercentageChange(curr_balance.mul(bignumbers[3]).div(bignumbers[4]))} >75%</Button>
                  <Button disabled={options.readOnly} onClick={() => this.handleAmountPercentageChange(curr_balance) } >100%</Button>
                </Button.Group>
              </Form.Field>
            </Form.Group>
            <div id="StopOrder-explanation"><span className="bold">Explanation:</span> {explanation}</div>
            <Button className="StopOrder-button" color='blue' disabled={!can_place_order || loading || error || options.readOnly} onClick={this.handlePlaceOrder}>Place Order</Button>
            {side_text}
          </Form>
        </div>
      </div>
    );
  }
}

export default StopOrder
