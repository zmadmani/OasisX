import React, { Component } from 'react'
import { HashRouter, Switch, Route } from 'react-router-dom'
import { Responsive } from 'semantic-ui-react'
import { ethers } from 'ethers';

import './App.css'

import Market from '../market/market'
import Home from '../home/home'
import Login from '../login/login'
import Navbar from '../navbar/navbar'
import Infobar from '../infobar/infobar'

const config = require("./../../config")
const erc20Abi = require("./../../abi/standard-token/erc20")
const WEthAbi = require("./../../abi/standard-token/ds-eth-token")
const MatchingMarketAbi = require("./../../abi/maker-otc/matching-market");
const SupportMethodsAbi = require("./../../abi/otc-support-methods/otc-support-methods")

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      options: {
        provider: null,
        signer: null,
        contracts: [],
        readOnly: true,
        handleLogin: this.handleLogin,
        handleReLogin: this.handleReLogin
      }
    }

    this.handleLogin = this.handleLogin.bind(this)
    this.handleReLogin = this.handleReLogin.bind(this)
  }

  componentWillMount() {
    var ethereum = null
    if(window.web3) {
      ethereum = window.ethereum ? window.ethereum : window.web3.currentProvider
    }
    var provider = null
    var signer = null
    var readOnly = true

    var contract_initializer = null
    if(ethereum) {
      provider = new ethers.providers.Web3Provider(ethereum)
      signer = provider.getSigner()
      contract_initializer = signer
      readOnly = false
    } else {
      provider = new ethers.getDefaultProvider()
      signer = new ethers.Wallet.createRandom()
      contract_initializer = provider
    }

    const contracts = {
      WETH: new ethers.Contract(config["tokens"]["main"]["W-ETH"], WEthAbi.interface, contract_initializer),
      DAI: new ethers.Contract(config["tokens"]["main"]["DAI"], erc20Abi.interface, contract_initializer),
      MKR: new ethers.Contract(config["tokens"]["main"]["MKR"], erc20Abi.interface, contract_initializer),
      Market: new ethers.Contract(config["market"]["main"]["address"], MatchingMarketAbi.interface, contract_initializer),
      SupportMethods: new ethers.Contract(config["otcSupportMethods"]["main"]["address"], SupportMethodsAbi.interface, contract_initializer)
    }

    const options = {
      provider: provider,
      signer: signer,
      contracts: contracts,
      readOnly: readOnly,
      handleLogin: this.handleLogin,
      handleReLogin: this.handleReLogin
    }
    this.setState({ options })
  }

  async handleLogin(phrase, password) {
    if(this.state.options.readOnly) {
      console.log("LOGGING IN WITH PHRASE: " + phrase)
      let provider = new ethers.getDefaultProvider()
      let signer = new ethers.Wallet.fromMnemonic(phrase).connect(provider)
      const contracts = {
        WETH: new ethers.Contract(config["tokens"]["main"]["W-ETH"], WEthAbi.interface, signer),
        DAI: new ethers.Contract(config["tokens"]["main"]["DAI"], erc20Abi.interface, signer),
        MKR: new ethers.Contract(config["tokens"]["main"]["MKR"], erc20Abi.interface, signer),
        Market: new ethers.Contract(config["market"]["main"]["address"], MatchingMarketAbi.interface, signer),
        SupportMethods: new ethers.Contract(config["otcSupportMethods"]["main"]["address"], SupportMethodsAbi.interface, signer)
      }
      const readOnly = false
      const options = {
        provider: provider,
        signer: signer,
        contracts: contracts,
        readOnly: readOnly,
        handleLogin: this.handleLogin,
        handleReLogin: this.handleReLogin
      }

      this.setState({ options })
      let encrypted_wallet = await signer.encrypt(password)
      this.saveEncryptedWallet(encrypted_wallet)
    }
  }

  async handleReLogin(account, json_string, password) {
    if(this.state.options.readOnly) {
      console.log("LOGGING IN WITH ACCOUNT " + account)
      let provider = new ethers.getDefaultProvider()
      let signer = await ethers.Wallet.fromEncryptedJson(json_string, password)
      signer = signer.connect(provider)
      const contracts = {
        WETH: new ethers.Contract(config["tokens"]["main"]["W-ETH"], WEthAbi.interface, signer),
        DAI: new ethers.Contract(config["tokens"]["main"]["DAI"], erc20Abi.interface, signer),
        MKR: new ethers.Contract(config["tokens"]["main"]["MKR"], erc20Abi.interface, signer),
        Market: new ethers.Contract(config["market"]["main"]["address"], MatchingMarketAbi.interface, signer),
        SupportMethods: new ethers.Contract(config["otcSupportMethods"]["main"]["address"], SupportMethodsAbi.interface, signer)
      }
      const readOnly = false
      const options = {
        provider: provider,
        signer: signer,
        contracts: contracts,
        readOnly: readOnly,
        handleLogin: this.handleLogin,
        handleReLogin: this.handleReLogin
      }

      this.setState({ options })
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

  render() {
    var { options } = this.state

    if(options.provdier === null) {
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
