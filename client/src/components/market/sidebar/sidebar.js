// Import Major Dependencies
import React, { Component } from 'react';
import { ethers } from 'ethers';
import { Sidebar, Segment, Icon, Input, Form, Button, Loader } from 'semantic-ui-react';

// Import CSS Files
import './sidebar.css';

// Import src code
import HumanName from '../../utils/humanname/humanname';
import { numberWithCommas } from '../../utils/general';

class SideBar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      visible: false,
      amount: '0',
      ui_amount: '',
      currency_0_balance: "0",
      currency_1_balance: "0",
      id: null,
      info: null,
      owner: null,
      bignumbers: {},
      button_loading: false,
      button_success: false,
      button_error: false
    };

    this.updateInfo = this.updateInfo.bind(this);
    this.stopLoading = this.stopLoading.bind(this);
    this.flashError = this.flashError.bind(this);
    this.flashSuccess = this.flashSuccess.bind(this);
  }

  // Get the balances for each of the currencies since we will need that throughout the component
  componentDidMount() {
    this.generateBigNumbers();
    this.updateInfo();
  }

  // Update the information in the sidebar and recursively call itself every 3 seconds
  async updateInfo() {
    const { account, currencies, options } = this.props;
    if(this.state.visible && this.state.id) {
      const currency_0_balance = await options.contracts[currencies[0]].balanceOf(account);
      const currency_1_balance = await options.contracts[currencies[1]].balanceOf(account);
      const info = await options.contracts.Market.getOffer(this.state.id);
      const owner = await options.contracts.Market.getOwner(this.state.id);
      this.setState({ currency_0_balance, currency_1_balance, info, owner });
    }
    setTimeout(this.updateInfo, 3000);
  }

  // Generate BigNumber represenatation of integers for easy arithmetic later
  generateBigNumbers() {
    let bignumbers = {};
    for(let i = 0; i <= 10; i++) {
      const key = i;
      bignumbers[key] = ethers.utils.bigNumberify(key);
    }
    this.setState({ bignumbers });
  }

  // Helper function to set loading to false
  stopLoading() {
    this.setState({ loading: false });
  }

  // Need to update visible and the side_bar info key if a new order is passed in
  async componentWillReceiveProps(nextProps) {
    // Update if the new props for visibility are changed
    if(nextProps.visible !== this.props.visible) {
      this.setState({ visible: nextProps.visible });
      if(nextProps.visible === false) {
        this.setState({ info: null, owner: null, amount: '0', ui_amount: '', button_success: false, button_error: false, button_loading: false });
      }
    }
    // Update if the information for the sidebar has changed
    if(nextProps.sidebar_info !== this.props.sidebar_info) {
      this.setState({ loading: true });
      const info = await this.props.options.contracts.Market.getOffer(nextProps.sidebar_info["id"]);
      const owner = await this.props.options.contracts.Market.getOwner(nextProps.sidebar_info["id"]);
      this.setState({ id: nextProps.sidebar_info["id"], info, owner, amount: '0', ui_amount: '' });
      // Add artificial delay to show the new results are really updated
      setTimeout(this.stopLoading, 50);
    }
  }

  // Helper function to flash success on tx success
  flashSuccess() {
    const { toggleSidebar } = this.props;
    this.setState({ button_success : true, button_loading: false });
    setTimeout(toggleSidebar, 1500);
  }

  // Helper function to flash error on tx failure
  flashError() {
    this.setState({ button_error: true, button_loading: false });
    setTimeout(() => this.setState({ button_error: false }), 1500);
  }

  // Most important function in the entire file since it actually interfaces
  // and edits the blockchain.
  async executeTrade(will_receive) {
    const { sidebar_info, options } = this.props;

    const id = sidebar_info["id"];

    // Log the inputs for the transaction so that you can always be 100% positive what is being sent
    const inputs = {
      "id": id,
      "will_receive": will_receive.toString(),
      "will_receive_wholenums": ethers.utils.formatUnits(will_receive.toString(), 'ether')
    };
    console.log(inputs);

    try {
      const tx = await this.props.options.contracts.Market.buy(id, will_receive.toString(), { gasLimit: 500000, gasPrice: options.gasPrice });
      this.setState({ button_loading: true });
      await tx.wait();
      this.flashSuccess();
    } catch(error) {
      this.flashError();
    }
  }

  // Handler for when user changes the amount to be bought
  handleUserChange(value) {
    let internal_value = 0;
    try{
      // Check to see if the value is not just white space
      if(/\S/.test(value)) {
        internal_value = ethers.utils.parseUnits(value.toString(), 'ether').toString();
      }
    } catch (err) {
      console.log(err);
      return;
    }
    this.setState({ ui_amount: value, amount: internal_value });
  }

  // Handler for when user uses percentage tool to update amount
  handleAmountPercentageChange(value) {
    const ui_value = ethers.utils.formatUnits(value.toString(), 'ether');
    this.setState({ amount: value.toString(), ui_amount: ui_value });
  }

  // So we were passed in the most up to date info the older component had.
  // However this can and will change if it was stale or other people are taking the order.
  // This keeps the info up to date and fallsback onto the old data if an error happens.
  getUpdatedInfo() {
    const { info } = this.state;
    const { sidebar_info } = this.props;

    let info_obj = {};
    // If info is empty then return null
    if(!info) {
      return null;
    }

    const buy_amt = info[0];
    const pay_amt = info[2];

    // Build information object depending on the types
    if(sidebar_info["type"] === "BUY") {
      info_obj = {
        "price": sidebar_info["price"],
        "curr_0_amt": pay_amt.toString(),
        "curr_1_amt": buy_amt.toString()
      };
    } else {
      info_obj = {
        "price": sidebar_info["price"],
        "curr_0_amt": buy_amt.toString(),
        "curr_1_amt": pay_amt.toString()
      };
    }

    return info_obj;
  }

  // Calculate how much currency the user will receive
  calcWillReceive() {
    const { amount } = this.state;

    // Don't forget that these are flipped from the actual smart contract docs since
    // WE are the counterparties so buy_amt/pay_amt is flipped from expected
    const buy_amt = ethers.utils.bigNumberify(this.state.info[0]);
    const pay_amt = ethers.utils.bigNumberify(this.state.info[2]);

    let amount_bn = ethers.utils.bigNumberify(amount);
    try {
      let will_receive = amount_bn.mul(buy_amt).div(pay_amt);
      return will_receive;
    } catch(err) {
      return ethers.utils.bigNumberify("0");
    }
  }

  // Get the max amount possible to take from this order given the balances and offer
  getMaxTake() {
    const { sidebar_info } = this.props;
    const { info, currency_0_balance, currency_1_balance } = this.state;

    const pay_amt = ethers.utils.bigNumberify(info[2]);
    const balance = sidebar_info["type"] === "BUY" ? ethers.utils.bigNumberify(currency_0_balance) : ethers.utils.bigNumberify(currency_1_balance);
    if(balance.lt(pay_amt)) {
      return balance;
    } else {
      return pay_amt;
    }
  }

  /** ################# RENDER ################# **/

  render() {
    const { visible, amount, ui_amount, currency_0_balance, currency_1_balance, bignumbers, loading, button_loading, button_error, button_success, owner } = this.state;
    const { currencies, toggleSidebar, sidebar_info, options } = this.props;

    // Invert the type since the action do as a taker is the inverse of the action of the maker
    const action = sidebar_info["type"] === "BUY" ? "SELL" : "BUY";
    const subtitle = action === "BUY" ? (<span className="green">{action}</span>) : (<span className="red">SELL</span>);

    // So we were passed in the most up to date info the older component had.
    // However this can and will change if it was stale or other people are taking the order.
    // This keeps the info up to date and fallsback onto the old data if an error happens.
    const updated_info = this.getUpdatedInfo();
    if(!updated_info || loading) {
      return (
        <div className="Side_bar">
          <Sidebar as={Segment} animation="overlay" direction="right" visible={visible} id="Side_bar">
            <div id="Side_bar-x-container">
              <Icon name="close" onClick={toggleSidebar} id="Side_bar-x" size="large" />
            </div>
            <div id="Side_bar-title">Take Order</div>
            <Loader active>Loading</Loader>
          </Sidebar>
        </div>
      );
    }

    // Build object that swaps values for buys and sells so that rendering is simple
    let giving = {
      "currency": null,
      "receive_currency": null,
      "balance": 0,
      "offered": 0,
      "max_take": this.getMaxTake(),
      "will_receive": this.calcWillReceive(),
      "maker": owner ? <HumanName address={owner} options={options} currencies={currencies} /> : "Loading...",
    };
    giving["ui_will_receive"] = Math.round(ethers.utils.formatUnits(giving["will_receive"].toString(), 'ether') * 1000) / 1000;

    if(action === "BUY") {
      giving["currency"] = currencies[1];
      giving["receive_currency"] = currencies[0];
      giving["balance"] = ethers.utils.bigNumberify(currency_1_balance);
      giving["ui_balance"] = Math.round(ethers.utils.formatUnits(currency_1_balance.toString(), 'ether') * 1000) / 1000;
      giving["offered"] = ethers.utils.bigNumberify(updated_info["curr_1_amt"]);
      giving["ui_offered"] = Math.round(ethers.utils.formatUnits(updated_info["curr_1_amt"], 'ether') * 1000) / 1000;
    } else {
      giving["currency"] = currencies[0];
      giving["receive_currency"] = currencies[1];
      giving["balance"] = ethers.utils.bigNumberify(currency_0_balance);
      giving["ui_balance"] = Math.round(ethers.utils.formatUnits(currency_0_balance.toString(), 'ether') * 1000) / 1000;
      giving["offered"] = ethers.utils.bigNumberify(updated_info["curr_0_amt"]);
      giving["ui_offered"] = Math.round(ethers.utils.formatUnits(updated_info["curr_0_amt"], 'ether') * 1000) / 1000;
    }

    // Adjust the text on the button if an action or error just occurred
    var button_text = action + " " + currencies[0];
    button_text = button_success ? "SUCCESS" : button_text;
    button_text = button_error ? "FAILED" : button_text;

    return (
      <div className="Side_bar">
        <Sidebar as={Segment} animation="overlay" direction="right" visible={visible} id="Side_bar">
          <div id="Side_bar-x-container">
            <Icon name="close" onClick={toggleSidebar} id="Side_bar-x" size="large" />
          </div>
          <div id="Side_bar-title">Take Order</div>
          <div id="Side_bar-subtitle">How much would you like to {subtitle}?</div>
          
          <div id="Side_bar-info">
            <div className="Side_bar-info-item">
              <div className="Side_bar-info-title">Maker:</div>
              <div className="Side_bar-info-content">{giving["maker"]}</div>
            </div>

            <div className="Side_bar-info-item">
              <div className="Side_bar-info-title">Price:</div>
              <div className="Side_bar-info-content">{numberWithCommas(updated_info["price"])} <span id="Side_bar-exchange">{currencies[1]} / {currencies[0]}</span></div>
            </div>

            <div className="Side_bar-info-item">
              <div className="Side_bar-info-title">Balance {giving["currency"]}:</div>
              <div className="Side_bar-info-content">{numberWithCommas(giving["ui_balance"])} <span id="Side_bar-exchange">{giving["currency"]}</span></div>
            </div>

            <div className="Side_bar-info-item">
              <div className="Side_bar-info-title">Offered {giving["currency"]}:</div>
              <div className="Side_bar-info-content">{numberWithCommas(giving["ui_offered"])} <span id="Side_bar-exchange">{giving["currency"]}</span></div>
            </div>
          </div>

          <Form size='tiny' id="Side_bar-form">
            <Form.Field>
              <div>
                <div className="Side_bar-info-title">Spend {giving["currency"]}:</div>
                <Input
                  label={{ basic: true, content: giving["currency"] }}
                  labelPosition='right'
                  placeholder='Enter Amount...'
                  value={ui_amount}
                  onChange={(e) => { this.handleUserChange(e.target.value) }}
                  disabled={options.readOnly}
                />
              </div>
            </Form.Field>
            <Button.Group id="Side_bar-mini-buttons" size='mini' basic>
              <Button disabled={options.readOnly} onClick={ () => this.handleUserChange("") } >0%</Button>
              <Button disabled={options.readOnly} onClick={ () => this.handleAmountPercentageChange(giving["max_take"].div(bignumbers[4])) } >25%</Button>
              <Button disabled={options.readOnly} onClick={ () => this.handleAmountPercentageChange(giving["max_take"].div(bignumbers[2])) } >50%</Button>
              <Button disabled={options.readOnly} onClick={ () => this.handleAmountPercentageChange(giving["max_take"].mul(bignumbers[3]).div(bignumbers[4])) } >75%</Button>
              <Button disabled={options.readOnly} onClick={ () => this.handleAmountPercentageChange(giving["max_take"]) } >100%</Button>
            </Button.Group>
          </Form>
          <div className="Side_bar-info-item">
            <div className="Side_bar-info-title">Will Receive</div>
            <div className="Side_bar-info-content">{giving["ui_will_receive"].toString() + " " + giving["receive_currency"]}</div>
          </div>
          <Button className="BuySell-button" loading={button_loading} color={action === "BUY" ? "green" : "red"} disabled={options.readOnly || button_text !== action + " " + currencies[0] || giving["will_receive"].lte(ethers.utils.bigNumberify("1000")) || ethers.utils.bigNumberify(amount).gt(giving["max_take"])} onClick={() => this.executeTrade(giving["will_receive"]) }>{button_text}</Button>
        </Sidebar>
      </div>
    );
  }
}

export default SideBar
