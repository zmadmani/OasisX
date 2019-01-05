import React from 'react';
import ReactDOM from 'react-dom';
import 'semantic-ui-css/semantic.min.css';

import './index.css';
import App from './containers/App/App';
import registerServiceWorker from './registerServiceWorker';

import { Drizzle, generateStore } from 'drizzle'

import Web3 from 'web3';
const web3 = new Web3(Web3.givenProvider || "http://localhost:9545")
// web3.currentProvider.enable()

const config = require("./config")
const erc20Abi = require("./abi/standard-token/erc20")
const WEthAbi = require("./abi/standard-token/ds-eth-token")
const MatchingMarketAbi = require("./abi/maker-otc/matching-market");
const SupportMethodsAbi = require("./abi/otc-support-methods/otc-support-methods")

const WETH = new web3.eth.Contract(WEthAbi.interface, config["tokens"]["main"]["W-ETH"])
const DAI = new web3.eth.Contract(erc20Abi.interface, config["tokens"]["main"]["DAI"])
const MKR = new web3.eth.Contract(erc20Abi.interface, config["tokens"]["main"]["MKR"])
const market = new web3.eth.Contract(MatchingMarketAbi.interface, config["market"]["main"]["address"])
const supportMethods = new web3.eth.Contract(SupportMethodsAbi.interface, config["otcSupportMethods"]["main"]["address"])

const options = {
	contracts: [
		{
			contractName: 'WETH',
			web3Contract: WETH
		},
		{
			contractName: 'DAI',
			web3Contract: DAI
		},
		{
			contractName: 'MKR',
			web3Contract: MKR
		},
		{
			contractName: 'Market',
			web3Contract: market
		},
		{
			contractName: 'SupportMethods',
			web3Contract: supportMethods
		}
	],
	events: {
		Market: ['LogTake']
	},
	polls: {
		accounts: 3000,
		blocks: 3000
	},
	syncAlways: false
}

const drizzleStore = generateStore(options)
const drizzle = new Drizzle(options, drizzleStore)

ReactDOM.render(<App drizzle={drizzle} />, document.getElementById('root'));
registerServiceWorker();