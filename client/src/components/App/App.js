// Import Major Dependencies
import React from 'react';
import { HashRouter, Switch, Route } from 'react-router-dom';
import { Responsive } from 'semantic-ui-react';
import { ethers } from 'ethers';

// Import CSS Files
import './App.css';

// Import src code
import Market from '../market/market';
import Home from '../home/home';
import Login from '../login/login';
import Navbar from '../navbar/navbar';
import Infobar from '../infobar/infobar';

// Load ABI and Config file
const config = require("./../../config");
const erc20Abi = require("./../../abi/standard-token/erc20");
const WEthAbi = require("./../../abi/standard-token/ds-eth-token");
const MatchingMarketAbi = require("./../../abi/maker-otc/matching-market");
const SupportMethodsAbi = require("./../../abi/otc-support-methods/otc-support-methods");

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      options: {
        provider: null,
        signer: null,
        contracts: [],
        readOnly: true,
        handleLogin: this.handleLogin,
        handleReLogin: this.handleReLogin
      }
    };

    this.handleLogin = this.handleLogin.bind(this);
    this.handleReLogin = this.handleReLogin.bind(this);
  }

  componentWillMount() {
    // Retrieve and store options
    const options = this.getOptions();
    this.setState({ options });
  }

  // Constructs and Returns a Dictionary with the environment options
  getOptions() {
    // Get a connection to the Ethereum blockchain
    const ethereum = this.getEthereum();
    let contracts = [];

    // Retrieve the Provider, Signer, and Contracts
    let provider = null;
    let signer = null;
    let readOnly = true;

    ethers.errors.setLogLevel("off");

    // If an Ethereum connection exists then retrieve the provider and signer
    // Else connect to default provider from ethers.js (myetherwallet/infura) and generate a random account to be the signer
    if(ethereum) {
      provider = new ethers.providers.Web3Provider(ethereum);
      signer = provider.getSigner();

      // Set readOnly to false since we have a signing account (not randomly generated)
      // The contracts are then initialized with the signer
      readOnly = false;
      contracts = this.getContracts(signer);
    } else {
      provider = new ethers.getDefaultProvider();
      signer = new ethers.Wallet.createRandom();

      // Since this is readOnly, the contracts are initialized with the provider
      contracts = this.getContracts(provider);
    }

    // Package options
    const options = this.buildOptions(provider, signer, contracts, readOnly);
    return options;
  }

  async handleLogin(phrase, password) {
    // Only do something if the current page is readOnly and just passthrough otherwise.
    if(this.state.options.readOnly) {
      let provider = new ethers.getDefaultProvider();
      let signer = new ethers.Wallet.fromMnemonic(phrase).connect(provider);
      const contracts = this.getContracts(signer);
      const readOnly = false;
      const options = this.buildOptions(provider, signer, contracts, readOnly);
      this.setState({ options });

      // Encrypt and store the wallet into the browsers local storage
      let encrypted_wallet = await signer.encrypt(password);
      this.saveEncryptedWallet(encrypted_wallet);
    }
  }

  async handleReLogin(account, json_string, password) {
    // Only do something if the current page is readOnly and just passthrough otherwise.
    if(this.state.options.readOnly) {
      console.log("LOGGING IN WITH ACCOUNT " + account);
      let provider = new ethers.getDefaultProvider();
      let signer = await ethers.Wallet.fromEncryptedJson(json_string, password);
      signer = signer.connect(provider);
      const contracts = this.getContracts(signer);
      const readOnly = false;
      const options = this.buildOptions(provider, signer, contracts, readOnly);
      this.setState({ options });
    }
  }

  saveEncryptedWallet(wallet) {
    var json_wallet = JSON.parse(wallet)
    var address = json_wallet.address
    var localStorage = window.localStorage
    if(!localStorage.getItem("encrypted_wallets")) {
      localStorage.setItem("encrypted_wallets", JSON.stringify({}))
    }

    var stored_wallets = JSON.parse(localStorage.getItem("encrypted_wallets"))
    stored_wallets["0x" + address] = wallet
    localStorage.setItem("encrypted_wallets", JSON.stringify(stored_wallets))
  }

  /** ################# HELPER FUNCTIONS ################# **/

  // Helper function to build options dictionary
  buildOptions(provider, signer, contracts, readOnly) {
    return {
      provider: provider,
      signer: signer,
      contracts: contracts,
      readOnly: readOnly,
      handleLogin: this.handleLogin,
      handleReLogin: this.handleReLogin
    }
  }

  // Helper method to retrieve provider to ethereum blockchain if present and null otherwise.
  getEthereum() {
    var ethereum = null;
    // If web3 is present in the window return the connection provider otherwise null

    alert(window.ethereum)
    if(window.web3) {
      ethereum = window.ethereum ? window.ethereum : window.web3.currentProvider;
    } else {
    }
    return ethereum;
  }

  // Helper method to retrieve an object of all the initialized contracts.
  getContracts(contract_initializer) {
    return {
      WETH: new ethers.Contract(config["tokens"]["main"]["W-ETH"], WEthAbi.interface, contract_initializer),
      DAI: new ethers.Contract(config["tokens"]["main"]["DAI"], erc20Abi.interface, contract_initializer),
      MKR: new ethers.Contract(config["tokens"]["main"]["MKR"], erc20Abi.interface, contract_initializer),
      Market: new ethers.Contract(config["market"]["main"]["address"], MatchingMarketAbi.interface, contract_initializer),
      SupportMethods: new ethers.Contract(config["otcSupportMethods"]["main"]["address"], SupportMethodsAbi.interface, contract_initializer)
    };
  }

  /** ################# RENDER ################# **/

  render() {
    const { options } = this.state

    // If there is no provider at all then render a Loading screen.
    if(options.provider === null) {
      return (
        <div className="App">
          Loading...
        </div>
      )
    }

    return (
      <div className="App">
        <HashRouter>
          <div>
            <Navbar options={options} />
            <div id="App_market_container">
                <Switch>
                  <Route exact path='/' render={() => <Home />} />
                  <Route exact path='/login' render={() => <Login options={options} />} />
                  <Route exact path='/WETH_DAI' render={() => <Market key={'WETH_DAI'} options={options} currencies={['WETH', 'DAI']} />} />
                  <Route exact path='/MKR_WETH' render={() => <Market key={'MKR_WETH'} options={options} currencies={['MKR', 'WETH']} />} />
                  <Route exact path='/MKR_DAI' render={() => <Market  key={'MKR_DAI'} options={options} currencies={['MKR', 'DAI']} />} />
                </Switch>
            </div>
            <Responsive minWidth={Responsive.onlyTablet.minWidth}>
              <Infobar padded={true} options={options} />
            </Responsive>
          </div>
        </HashRouter>
      </div>
    );
  }
}

export default App
