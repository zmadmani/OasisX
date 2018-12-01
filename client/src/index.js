import React from 'react';
import ReactDOM from 'react-dom';
import 'semantic-ui-css/semantic.min.css';

import './index.css';
import App from './containers/App/App';
import registerServiceWorker from './registerServiceWorker';

import { Drizzle, generateStore } from 'drizzle'
import { LoadingContainer } from 'drizzle-react-components'
import loadContract from './utils/loadContract'

import Web3 from 'web3';
const web3 = new Web3(Web3.givenProvider || "http://localhost:9545")

const config = require("../config")
const erc20Abi = require("../abi/standard-token/erc20")
const WEthAbi = require("../abi/standard-token/ds-eth-token")
const MatchingMarketAbi = require("../abi/maker-otc/matching-market");

const WETH = new web3.eth.Contract(WEthAbi.interface, config["tokens"]["main"]["W-ETH"])
const DAI = new web3.eth.Contract(erc20Abi.interface, config["tokens"]["main"]["DAI"])
const MKR = new web3.eth.Contract(erc20Abi.interface, config["tokens"]["main"]["MKR"])
const market = new web3.eth.Contract(MatchingMarketAbi.interface, config["market"]["main"]["address"])

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
		}
	]
}

const drizzleStore = generateStore(options)
const drizzle = new Drizzle(options, drizzleStore)

ReactDOM.render(<App drizzle={drizzle} />, document.getElementById('root'));
registerServiceWorker();