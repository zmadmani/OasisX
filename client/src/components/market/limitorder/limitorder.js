// Import Major Dependencies
import React, { Component } from 'react'
import { ethers } from 'ethers';
import { Input, Form, Button, Loader } from 'semantic-ui-react'

// Import CSS Files
import './limitorder.css'

class LimitOrder extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      sidetext: "LOADING...",
      init: false,
      error: false,
      success: false,
      price: '',
      amount_0: '',
      ui_amount_0: '',
      amount_1: '',
      ui_amount_1: '',
      bignumbers: [],
      last_price: ''
    };

    this.handleSubmit = this.handleSubmit.bind(this);
    this.flashSuccess = this.flashSuccess.bind(this);
    this.flashError = this.flashError.bind(this);
  }

  componentDidMount() {
    this.generateBigNumbers();
  }

  // Generates and stores BigNumber integers for easy math later
  generateBigNumbers() {
    let bignumbers = {};
    for(let i = 0; i <= 10; i++) {
      const key = i;
      bignumbers[key] = ethers.utils.bigNumberify(key);
    }
    this.setState({ bignumbers });
  }

  // Main function that interfaces and writes to the blockchain.
  // This is the most important function here.
  async handleSubmit(type) {
    // Set loading to true to update UI
    let sidetext;
    if(type === "BUY") {
      sidetext = "BUYING..."
    } else if(type === "SELL") {
      sidetext = "SELLING..."
    } else {
      sidetext = "LOADING..."
    }
    this.setState({loading: true, sidetext, error: false, success: false});

    const { currencies, options } = this.props;

    // Get the important info for the transaction
    const amount_0 = this.state.amount_0;
    const amount_1 = this.state.amount_1;
    const curr_gem_0 = options.contracts[currencies[0]].address;
    const curr_gem_1 = options.contracts[currencies[1]].address;
    let data = {};

    // Set data to the correct value depending on if the order is a BUY or SELL
    // Basically you just flip the currency 0 and currency 1
    if(type === "BUY") {
      data = {
        pay_amt: amount_1,
        pay_gem: curr_gem_1,
        buy_amt: amount_0,
        buy_gem: curr_gem_0
      };
    } else if(type === "SELL") {
      data = {
        pay_amt: amount_0,
        pay_gem: curr_gem_0,
        buy_amt: amount_1,
        buy_gem: curr_gem_1
      };
    } else {
      return;
    }

    console.log(data);

    try {
      const tx = await options.contracts.Market.offer(data.pay_amt, data.pay_gem, data.buy_amt, data.buy_gem, 1, { gasLimit: 500000, gasPrice: options.gasPrice });
      await tx.wait();
      this.flashSuccess();
    } catch (error) {
      console.log(error);
      this.flashError();
    }
  }

  // Function to flash Success on the button when a order has gone thru
  flashSuccess() {
    this.setState({ success : true, loading: false });
    setTimeout(() => this.setState({ success: false, price: '', amount_0: '0', ui_amount_0: '', amount_1: '0', ui_amount_1: '' }), 1500);
  }

  // Function to flash Error on the button when a order has failed
  flashError() {
    this.setState({ error: true, loading: false });
    setTimeout(() => this.setState({ error: false }), 1500);
  }

  // Handler for changes in price in the UI
  handlePriceChange(value) {
    if(/\S/.test(value) && this.state.ui_amount_0 !== "") {
      const price = value;
      const ui_amount_1 = this.state.ui_amount_0 * price;
      const amount_1_bn = ethers.utils.parseUnits(ui_amount_1.toString(), 'ether');
      this.setState({ price: price, amount_1: amount_1_bn.toString(), ui_amount_1: ui_amount_1.toString() });
    } else {
      this.setState({ price: value, amount_1: '0', ui_amount_1: '' });
    }
  }

  // Handler for changes in amount to be traded in the UI
  handleAmountChange(index, value) {
    if(/\S/.test(value) && this.state.price !== "") {
      const price = this.state.price;
      let ui_amount_0 = null;
      let ui_amount_1 = null;
      let amount_0_bn = null;
      let amount_1_bn = null;

      // All math is done in BigNumber arithmetic using wei
      if(index === 0) {
        ui_amount_0 = value;
        amount_0_bn = ethers.utils.bigNumberify(ethers.utils.parseUnits(ui_amount_0.toString(), 'ether'));
        ui_amount_1 = ui_amount_0 * price;
        amount_1_bn = ethers.utils.bigNumberify(ethers.utils.parseUnits(ui_amount_1.toString(), 'ether'));
      } else if(index === 1) {
        ui_amount_1 = value;
        amount_1_bn = ethers.utils.bigNumberify(ethers.utils.parseUnits(ui_amount_1.toString(), 'ether'));
        ui_amount_0 = ui_amount_1 / price;
        amount_0_bn = ethers.utils.bigNumberify(ethers.utils.parseUnits(ui_amount_0.toString(), 'ether'));
      } else {
        return;
      }

      this.setState({ 
        amount_0: amount_0_bn.toString(), 
        ui_amount_0: ui_amount_0, 
        amount_1: amount_1_bn.toString(),
        ui_amount_1: ui_amount_1,
      });
    } else {
      this.setState({
        amount_0: '0',
        ui_amount_0: '',
        amount_1: '0',
        ui_amount_1: ''
      });
    }
  }

  // Handler for changes in amount using the percentage tools
  handleAmountPercentageChange(index, value) {
    const price = this.state.price;

    // All arithmetic is done using BigNumber and wei
    let ui_amount_0 = null;
    let ui_amount_1 = null;
    let amount_0_bn = null;
    let amount_1_bn = null;
    const price_bn = ethers.utils.bigNumberify(ethers.utils.parseUnits(price.toString(), 'ether'));
    const one_bn = ethers.utils.bigNumberify(ethers.utils.parseUnits('1'), 'ether');

    if(index === 0) {
      amount_0_bn = value;
      amount_1_bn = amount_0_bn.mul(price_bn).div(one_bn);
    } else if(index === 1) {
      amount_1_bn = value;
      amount_0_bn = amount_1_bn.mul(one_bn).div(price_bn);
    } else {
      return;
    }

    // Try catch to stop any type of input that is invalid with a valid response
    try {
      ui_amount_0 = ethers.utils.formatUnits(amount_0_bn.toString(), 'ether');
    } catch(err) {
      console.log(err);
      ui_amount_0 = ethers.utils.formatUnits("0", 'ether');
    }

    try {
      ui_amount_1 = ethers.utils.formatUnits(amount_1_bn.toString(), 'ether');
    } catch(err) {
      console.log(err);
      ui_amount_1 = ethers.utils.formatUnits("0", 'ether');
    }

    this.setState({
      amount_0: amount_0_bn.toString(),
      ui_amount_0: ui_amount_0,
      amount_1: amount_1_bn.toString(),
      ui_amount_1: ui_amount_1
    });
  }

  render() {
    const { price, amount_0, amount_1, ui_amount_0, ui_amount_1, bignumbers, loading, success, error, sidetext } = this.state;
    const { currencies, last_price, balances, options } = this.props;
    
    // Set flags that set whether a buy/sell is logically possible
    let can_buy = false;
    let can_sell = false;
    
    const curr_0_balance = ethers.utils.bigNumberify(balances[0]);
    const curr_1_balance = ethers.utils.bigNumberify(balances[1]);
    
    const amount_0_bn = ethers.utils.bigNumberify(amount_0);
    const amount_1_bn = ethers.utils.bigNumberify(amount_1);

    if(price !== "" && curr_0_balance.gte(amount_0_bn) && amount_0_bn.gt(ethers.utils.bigNumberify("1000"))) {
      can_sell = true;
    }
    
    if(price !== "" && curr_1_balance.gte(amount_1_bn) && amount_1_bn.gt(ethers.utils.bigNumberify("1000"))) {
      can_buy = true;
    }

    // Set the sidetext (text next to the button) depending on the situation context
    let side_text = "";
    if(loading) {
      side_text = (<span className="LimitOrder-color"><Loader active inline size="small"/> {sidetext} </span>);
    }
    if(error) {
      side_text = (<span className="red LimitOrder-color">FAILED</span>);
    }
    if(success) {
      side_text = (<span className="green LimitOrder-color">SUCCESS</span>);
    }

    return (
      <div className="LimitOrder">
        <Form size='tiny'>
          <div className="LimitOrder-headers">Price</div>
          <Form.Field id="LimitOrder-price">
            <Input
              label={{ basic: true, content: currencies[1] + " / " + currencies[0]  }}
              labelPosition='right'
              placeholder='Enter Price...'
              value={price}
              onChange={(e) => { this.handlePriceChange(e.target.value) }}
              disabled={options.readOnly}
            />
            <span className="LimitOrder-currentPrice" onClick={() => this.handlePriceChange(last_price) } >Current Market Price</span>
          </Form.Field>
          <hr />
          <div className="LimitOrder-headers" id="LimitOrder-amount-header">Amounts</div>
            <Form.Field>
              <Input
                label={{ basic: true, content: currencies[0] }}
                labelPosition='right'
                placeholder='Enter Amount...'
                disabled={price === '' || options.readOnly}
                value={ui_amount_0}
                onChange={(e) => { this.handleAmountChange(0, e.target.value) }}
                className="LimitOrder-amount-input"
              />
              <Button.Group className="LimitOrder-mini-buttons" size='mini' basic inverted>
                <Button disabled={price === "" || options.readOnly} onClick={() => this.handleAmountChange(1, '') } >0%</Button>
                <Button disabled={price === "" || options.readOnly} onClick={() => this.handleAmountPercentageChange(0, curr_0_balance.div(bignumbers[4]))} >25%</Button>
                <Button disabled={price === "" || options.readOnly} onClick={() => this.handleAmountPercentageChange(0, curr_0_balance.div(bignumbers[2]))} >50%</Button>
                <Button disabled={price === "" || options.readOnly} onClick={() => this.handleAmountPercentageChange(0, curr_0_balance.mul(bignumbers[3]).div(bignumbers[4]))} >75%</Button>
                <Button disabled={price === "" || options.readOnly} onClick={() => this.handleAmountPercentageChange(0, curr_0_balance) } >100%</Button>
              </Button.Group>
            </Form.Field>
            <Form.Field>
              <Input
                label={{ basic: true, content: currencies[1] }}
                labelPosition='right'
                placeholder='Enter Amount...'
                disabled={price === '' || options.readOnly}
                value={ui_amount_1}
                onChange={(e) => { this.handleAmountChange(1, e.target.value) }}
                className="LimitOrder-amount-input"
              />
              <Button.Group className="LimitOrder-mini-buttons" size='mini' basic inverted>
                <Button disabled={price === "" || options.readOnly} onClick={() => this.handleAmountChange(1, '') } >0%</Button>
                <Button disabled={price === "" || options.readOnly} onClick={() => this.handleAmountPercentageChange(1, curr_1_balance.div(bignumbers[4]))} >25%</Button>
                <Button disabled={price === "" || options.readOnly} onClick={() => this.handleAmountPercentageChange(1, curr_1_balance.div(bignumbers[2]))} >50%</Button>
                <Button disabled={price === "" || options.readOnly} onClick={() => this.handleAmountPercentageChange(1, curr_1_balance.mul(bignumbers[3]).div(bignumbers[4]))} >75%</Button>
                <Button disabled={price === "" || options.readOnly} onClick={() => this.handleAmountPercentageChange(1, curr_1_balance) } >100%</Button>
              </Button.Group>
            </Form.Field>
          <Button className="LimitOrder-button" color='green' disabled={!can_buy || loading || options.readOnly} onClick={() => this.handleSubmit("BUY")} >BUY {currencies[0]}</Button>
          <Button className="LimitOrder-button" color='red' disabled={!can_sell || loading || options.readOnly} onClick={() => this.handleSubmit("SELL")} >SELL {currencies[0]}</Button>
          {side_text}
        </Form>
      </div>
    );
  }
}

export default LimitOrder