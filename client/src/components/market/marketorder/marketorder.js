// Import Major Dependencies
import React, { Component } from 'react'
import { ethers } from 'ethers';
import { Input, Form, Button, Loader } from 'semantic-ui-react'

// Import CSS Files
import './marketorder.css'

class MarketOrder extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: [false, false],
      error: [false, false],
      success: [false, false],
      amounts: ['0', '0'],
      ui_amounts: ['', ''],
      expected_price: ['', ''],
      expected_amount: ['0', '0'],
      bignumbers: []
    };

    this.handleMarketBuy = this.handleMarketBuy.bind(this);
    this.handleMarketSell = this.handleMarketSell.bind(this);
    this.flashSuccess = this.flashSuccess.bind(this);
    this.flashError = this.flashError.bind(this);
  }

  componentDidMount() {
    this.generateBigNumbers();
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

  // Handler for Market Buy
  async handleMarketBuy() {
    // Set loading to true to update UI
    let { loading, error, success } = this.state;
    loading[1] = true;
    error[1] = false;
    success[1] = false;
    this.setState({ loading , error, success });
    
    // Retrieve important variables
    const { amounts, expected_amount } = this.state;
    const { currencies, options } = this.props;
    
    const curr_gem_0 = options.contracts[currencies[0]].address;
    const curr_gem_1 = options.contracts[currencies[1]].address;

    // Calculate the minimum expected amount of currency you will receive
    const min_expected_amount = ethers.utils.bigNumberify("98").mul(expected_amount[1]).div(ethers.utils.bigNumberify("100"));

    // Assemble the data information into an object
    const data = {
      pay_gem: curr_gem_1,
      pay_amt: amounts[1],
      buy_gem: curr_gem_0,
      min_fill_amount: min_expected_amount.toString()
    };

    // Log the data object to console for clarity
    console.log(data);

    // Try catch to handle successful and failed tx
    try {
      var tx = await options.contracts.Market.sellAllAmount(data["pay_gem"], data["pay_amt"], data["buy_gem"], data["min_fill_amount"], { gasLimit: 500000, gasPrice: ethers.utils.parseUnits('10.0', 'gwei') });
      // Wait for transaction to finish
      await tx.wait();
      this.flashSuccess(1);
    } catch (error) {
      this.flashError(1);
    }
  }

  // Handler for Market Sell
  async handleMarketSell() {
    // Set loading to true to update UI
    let { loading, error, success } = this.state;
    loading[0] = true;
    error[0] = false;
    success[0] = false;
    this.setState({ loading , error, success });

    // Retrieve important variables
    const { amounts, expected_amount } = this.state;
    const { currencies, options } = this.props;

    const curr_gem_0 = options.contracts[currencies[0]].address;
    const curr_gem_1 = options.contracts[currencies[1]].address;

    // Calculate the minimum expected amount of currency you will receive
    const min_expected_amount = ethers.utils.bigNumberify("98").mul(expected_amount[0]).div(ethers.utils.bigNumberify("100"));

    // Assemble the data information into an object
    const data = {
      pay_gem: curr_gem_0,
      pay_amt: amounts[0],
      buy_gem: curr_gem_1,
      min_fill_amount: min_expected_amount.toString()
    };

    // Log the dta object to console for clarity
    console.log(data);

    // Try catch to handle successful and failed tx
    try {
      const tx = await options.contracts.Market.sellAllAmount(data["pay_gem"], data["pay_amt"], data["buy_gem"], data["min_fill_amount"], { gasLimit: 500000, gasPrice: ethers.utils.parseUnits('10.0', 'gwei') });
      // Wait for tx to finish
      await tx.wait();
      this.flashSuccess(0);
    } catch (error) {
      this.flashError(0);
    }
  }

  // Handler for when a tx is successful
  flashSuccess(index) {
    let { loading, success, error } = this.state;
    loading[index] = false;
    success[index] = true;
    error[index] = false;
    this.setState({ loading, success, error });
    setTimeout(() => this.reset(index), 1500);
  }

  // Handler for whne a tx is failed
  flashError(index) {
    let { loading, success, error } = this.state;
    loading[index] = false;
    success[index] = false;
    error[index] = true;
    this.setState({ loading, success, error });
    setTimeout(() => {
      let { loading, success, error } = this.state;
      loading[index] = false;
      success[index] = false;
      error[index] = false;
      this.setState({ error });
    }, 1500);
  }

  // State reset function that completely nullifies the component state
  reset(index) {
    let { loading, success, error, amounts, ui_amounts } = this.state;
    loading[index] = false;
    success[index] = false;
    error[index] = false;
    amounts[index] = "0";
    ui_amounts[index] = "";
    this.setState({ loading, success, error, amounts, ui_amounts });
  }

  // Calculate the amount of currency that we expect to receive from the trade
  // Index is wether currency 0 or 1 is being bought
  async setExpectedAmount(index) {
    // Assemble variables
    const { amounts, expected_amount, expected_price } = this.state;
    const { currencies, options } = this.props;

    const curr_gem_0 = options.contracts[currencies[0]].address;
    const curr_gem_1 = options.contracts[currencies[1]].address;

    let will_receive = "0";
    let giving = amounts[index];

    // Depending on which currency is being received
    if(index === 0) {
      will_receive = await options.contracts.Market.getBuyAmount(curr_gem_1, curr_gem_0, giving);
    } else if(index === 1) {
      will_receive = await options.contracts.Market.getBuyAmount(curr_gem_0, curr_gem_1, giving);
    }

    // If the amount received/given is greater than 0 then calculate expected info using BigNumber
    if(will_receive !== "0" && giving !== "0") {
      will_receive = ethers.utils.bigNumberify(will_receive);
      giving = ethers.utils.bigNumberify(giving);
      var one = ethers.utils.bigNumberify(ethers.utils.parseUnits('1', 'ether'));

      var price = one.mul(will_receive).div(giving);
      if(index === 1) {
        price = one.mul(giving).div(will_receive);
      }
      price = Math.round(ethers.utils.formatUnits(price.toString(), 'ether') * 1000) / 1000;

      expected_amount[index] = will_receive;
      expected_price[index] = price;
    } else {
      expected_amount[index] = "0";
      expected_price[index] = "";
    }
    this.setState({ expected_amount, expected_price });
  }

  // Handler for a change in the amount of currency to be traded
  handleAmountChange(index, value) {
    const { amounts, ui_amounts } = this.state;

    // Gather currency balance
    let new_amounts = amounts.slice(0);
    let new_ui_amounts = ui_amounts.slice(0);

    // If there is an error then replace values with empty values
    try {
      // Test the new amount value to see if it is whitespace and if so replace with empty values
      if(/\S/.test(value)) {
        const ui_amount = value;

        // Get BigNumber representation of the amount in wei
        const amount_bn = ethers.utils.bigNumberify(ethers.utils.parseUnits(ui_amount.toString(), 'ether'));

        // Reassign the new amounts
        new_amounts[index] = amount_bn.toString();
        new_ui_amounts[index] = ui_amount.toString();

        // Save the amounts
        this.setState({ 
          amounts: new_amounts,
          ui_amounts: new_ui_amounts
        });
      } else {
        new_amounts[index] = '0';
        new_ui_amounts[index] = '';
      }
    } catch(err) {
      console.log(err);
      new_amounts[index] = '0';
      new_ui_amounts[index] = '';
    }

    this.setState({
      amounts: new_amounts,
      ui_amounts: new_ui_amounts
    }, () => {
      this.setExpectedAmount(index);
    });
  }

  // Handler for changes in amount using percentage tool
  handleAmountPercentageChange(index, value) {
    const { amounts, ui_amounts } = this.state;

    // Gather the amount variables
    // Initialize ui_amount to 0 to be replaced by real value in try/catch
    const amount_bn = value;
    let ui_amount = ethers.utils.formatUnits("0", 'ether');
    try {
      ui_amount = ethers.utils.formatUnits(amount_bn.toString(), 'ether');
    } catch(err) {
      console.log(err);
    }

    // clone amounts into new objects
    let new_amounts = amounts.slice(0);
    let new_ui_amounts = ui_amounts.slice(0);

    new_amounts[index] = amount_bn.toString();
    new_ui_amounts[index] = ui_amount.toString();

    // Store new objects
    this.setState({ 
      amounts: new_amounts,
      ui_amounts: new_ui_amounts
    }, () => {
      this.setExpectedAmount(index);
    });
  }

  /** ################# RENDER ################# **/

  render() {
    const { amounts, ui_amounts, expected_price, bignumbers, loading, success, error } = this.state;
    const { currencies, balances, options } = this.props;
    
    // Set flags if buying/selling is logically valid
    let can_buy = false;
    let can_sell = false;
    
    // Get the balances for each currency
    const curr_0_balance = ethers.utils.bigNumberify(balances[0]);
    const curr_1_balance = ethers.utils.bigNumberify(balances[1]);
    
    // Get the amounts for each currency input box
    const amount_0_bn = ethers.utils.bigNumberify(amounts[0]);
    const amount_1_bn = ethers.utils.bigNumberify(amounts[1]);

    // If the balance is greater than the amount then set the proper flags
    if(curr_0_balance.gte(amount_0_bn) && amount_0_bn.gt(ethers.utils.bigNumberify("1000"))) {
      can_sell = true;
    }
    if(curr_1_balance.gte(amount_1_bn) && amount_1_bn.gt(ethers.utils.bigNumberify("1000"))) {
      can_buy = true;
    }

    // Generate the side text next to the buttons
    let side_texts = ["", ""];
    for(let i = 0; i < 2; i++) {
      if(loading[i]) {
        side_texts[i] = (<span className="MarketOrder-color"><Loader active inline size="small"/> LOADING...</span>);
      }
      if(error[i]) {
        side_texts[i] = (<span className="red MarketOrder-color">FAILED</span>);
      }
      if(success[i]) {
        side_texts[i] = (<span className="green MarketOrder-color">SUCCESS</span>);
      }
    }

    return (
      <div className="MarketOrder">
        <div className="MarketOrder-pane">
          <div className="MarketOrder-main-header">Market <span className="green">BUY</span></div>
          <div className="MarketOrder-small-note">Note: Orders will cancel if slippage >2%</div>
          <div className="MarketOrder-sub-header">Est. Price: {expected_price[1]} <span className="MarketOrder-tiny-note">{currencies[1]}/{currencies[0]}</span></div>
          <Form size='tiny'>
            <div className="MarketOrder-headers"><span className="green">Buy</span> Allowance</div>
            <Form.Group widths='equal'>
              <Form.Field>
                <Input
                  label={{ basic: true, content: currencies[1] }}
                  labelPosition='right'
                  placeholder='Enter Amount...'
                  value={ui_amounts[1]}
                  onChange={(e) => { this.handleAmountChange(1, e.target.value) }}
                  className="MarketOrder-amount-input"
                  disabled={options.readOnly}
                />
                <Button.Group className="MarketOrder-mini-buttons" size='mini' basic inverted>
                  <Button disabled={options.readOnly} onClick={() => this.handleAmountChange(1, '') } >0%</Button>
                  <Button disabled={options.readOnly} onClick={() => this.handleAmountPercentageChange(1, curr_1_balance.div(bignumbers[4]))} >25%</Button>
                  <Button disabled={options.readOnly} onClick={() => this.handleAmountPercentageChange(1, curr_1_balance.div(bignumbers[2]))} >50%</Button>
                  <Button disabled={options.readOnly} onClick={() => this.handleAmountPercentageChange(1, curr_1_balance.mul(bignumbers[3]).div(bignumbers[4]))} >75%</Button>
                  <Button disabled={options.readOnly} onClick={() => this.handleAmountPercentageChange(1, curr_1_balance) } >100%</Button>
                </Button.Group>
              </Form.Field>
            </Form.Group>
            <Button className="MarketOrder-button" color='green' disabled={!can_buy || loading[1] || error[1] || options.readOnly} onClick={this.handleMarketBuy} >BUY {currencies[0]}</Button>
            {side_texts[1]}
          </Form>
        </div>
        <hr />
        <div className="MarketOrder-pane">
          <div className="MarketOrder-main-header">Market <span className="red">SELL</span></div>
          <div className="MarketOrder-small-note">Note: Orders will cancel if slippage >2%</div>
          <div className="MarketOrder-sub-header">Est. Price: {expected_price[0]} <span className="MarketOrder-tiny-note">{currencies[1]}/{currencies[0]}</span></div>
          <Form size='tiny'>
            <div className="MarketOrder-headers"><span className="red">Sell</span> Allowance</div>
            <Form.Group widths='equal'>
              <Form.Field>
                <Input
                  label={{ basic: true, content: currencies[0] }}
                  labelPosition='right'
                  placeholder='Enter Amount...'
                  value={ui_amounts[0]}
                  onChange={(e) => { this.handleAmountChange(0, e.target.value) }}
                  className="MarketOrder-amount-input"
                  disabled={options.readOnly}
                />
                <Button.Group className="MarketOrder-mini-buttons" size='mini' basic inverted>
                  <Button disabled={options.readOnly} onClick={() => this.handleAmountChange(0, '') } >0%</Button>
                  <Button disabled={options.readOnly} onClick={() => this.handleAmountPercentageChange(0, curr_0_balance.div(bignumbers[4]))} >25%</Button>
                  <Button disabled={options.readOnly} onClick={() => this.handleAmountPercentageChange(0, curr_0_balance.div(bignumbers[2]))} >50%</Button>
                  <Button disabled={options.readOnly} onClick={() => this.handleAmountPercentageChange(0, curr_0_balance.mul(bignumbers[3]).div(bignumbers[4]))} >75%</Button>
                  <Button disabled={options.readOnly} onClick={() => this.handleAmountPercentageChange(0, curr_0_balance) } >100%</Button>
                </Button.Group>
              </Form.Field>
            </Form.Group>
            <Button className="MarketOrder-button" color='red' disabled={!can_sell || loading[0] || error[0] || options.readOnly} onClick={this.handleMarketSell} >SELL {currencies[0]}</Button>
            {side_texts[0]}
          </Form>
        </div>
      </div>
    );
  }
}

export default MarketOrder
