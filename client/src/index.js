import React from 'react';
import ReactDOM from 'react-dom';
import 'semantic-ui-css/semantic.min.css';
import 'react-virtualized/styles.css'

import './index.css';
import App from './containers/App/App';
import registerServiceWorker from './registerServiceWorker';

import { ethers } from 'ethers';

// let provider = new ethers.getDefaultProvider()
window.ethereum.enable()
let provider = new ethers.providers.Web3Provider(window.ethereum)
let signer = provider.getSigner()

const config = require("./config")
const erc20Abi = require("./abi/standard-token/erc20")
const WEthAbi = require("./abi/standard-token/ds-eth-token")
const MatchingMarketAbi = require("./abi/maker-otc/matching-market");
const SupportMethodsAbi = require("./abi/otc-support-methods/otc-support-methods")

// const WETH = new web3.eth.Contract(WEthAbi.interface, config["tokens"]["main"]["W-ETH"])
// const DAI = new web3.eth.Contract(erc20Abi.interface, config["tokens"]["main"]["DAI"])
// const MKR = new web3.eth.Contract(erc20Abi.interface, config["tokens"]["main"]["MKR"])
// const market = new web3.eth.Contract(MatchingMarketAbi.interface, config["market"]["main"]["address"])
// const supportMethods = new web3.eth.Contract(SupportMethodsAbi.interface, config["otcSupportMethods"]["main"]["address"])

const contracts = {
	WETH: new ethers.Contract(config["tokens"]["main"]["W-ETH"], WEthAbi.interface, signer),
	DAI: new ethers.Contract(config["tokens"]["main"]["DAI"], erc20Abi.interface, signer),
	MKR: new ethers.Contract(config["tokens"]["main"]["MKR"], erc20Abi.interface, signer),
	Market: new ethers.Contract(config["market"]["main"]["address"], MatchingMarketAbi.interface, signer),
	SupportMethods: new ethers.Contract(config["otcSupportMethods"]["main"]["address"], SupportMethodsAbi.interface, signer)
}

const options = {
	provider: provider,
	signer: signer,
	contracts: contracts
}

ReactDOM.render(<App options={options} />, document.getElementById('root'));
registerServiceWorker();