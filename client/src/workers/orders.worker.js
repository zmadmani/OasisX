// Worker.js
import { ethers } from 'ethers';

// // Load ABI and Config file
const config = require("../config");
const erc20Abi = require("../abi/standard-token/erc20");
const WEthAbi = require("../abi/standard-token/ds-eth-token");
const MatchingMarketAbi = require("../abi/maker-otc/matching-market");
const SupportMethodsAbi = require("../abi/otc-support-methods/otc-support-methods");

self.addEventListener("message", async (event) => { // eslint-disable-line no-restricted-globals
	let res = await getPastOrders(event.data.currencies, event.data.toBlock, event.data.numBlocks);
	self.postMessage(res); // eslint-disable-line no-restricted-globals
});

// Helper function to calculate the price of an order using BigNumber for all operations
function getPrice(pay_amt, buy_amt, type) {
	// Convert amounts to BigNumbers
	pay_amt = ethers.utils.bigNumberify(pay_amt);
	buy_amt = ethers.utils.bigNumberify(buy_amt);

	// If amounts are sufficiently small, just ignore and return false
	if(pay_amt.lte(ethers.utils.bigNumberify("1000")) || buy_amt.lte(ethers.utils.bigNumberify("1000"))) {
		return false;
	}

	var one = ethers.utils.bigNumberify(ethers.utils.parseUnits("1", "ether"));
	var price = 0;

	// Use the order type to decide operation for calculation and return values
	if(type === "BUY") {
		price = parseFloat(ethers.utils.formatUnits(one.mul(pay_amt).div(buy_amt).toString(), 'ether'));
		return [price, buy_amt, pay_amt];
	} else {
		price = parseFloat(ethers.utils.formatUnits(one.mul(buy_amt).div(pay_amt).toString(), 'ether'));
		return [price, pay_amt, buy_amt];
	}
}

// Helper function to determine the type of an order (BUY or SELL)
function getType(order, currencies, curr_0_addr, curr_1_addr) {
	// Extract what is being bought and what is being sold
	var buy_addr = order["buy_gem"].toUpperCase();
	var pay_addr = order["pay_gem"].toUpperCase();

	// Compare to curr_0 and curr_1 to decide if this is a BUY or a SELL
	if(buy_addr === curr_0_addr.toUpperCase() && pay_addr === curr_1_addr.toUpperCase()) {
		return "SELL";
	} else if(buy_addr === curr_1_addr.toUpperCase() && pay_addr === curr_0_addr.toUpperCase()) {
		return "BUY";
	} else {
		return null;
	}
}

// Helper function to build the hash keys for the log queries
function buildHashKey(first_addr, second_addr) {
	return ethers.utils.solidityKeccak256(['bytes', 'bytes'], [first_addr, second_addr]);
}

// Helper function to convert raw orders into processed orders
function eventsToOrders(events, currencies, curr_0_addr, curr_1_addr) {
	var orders = [];
	for(var i = 0; i < events.length; i++) {
		var order = events[i];
		var type = getType(order, currencies, curr_0_addr, curr_1_addr);
		var pay_amt = order["give_amt"].toString();
		var buy_amt = order["take_amt"].toString();
		var offer = getPrice(pay_amt, buy_amt, type);
		if(offer) {
			var timestamp = new Date(order["timestamp"] * 1000);
			timestamp = timestamp.toLocaleTimeString(undefined, {hour: 'numeric', minute: '2-digit'}) + " " + timestamp.toLocaleDateString(undefined, {day: 'numeric', month: 'numeric', year: '2-digit'});
			order = {
				"raw_timestamp": order["timestamp"] * 1000,
				"timestamp": timestamp,
				"type": type,
				"price": offer[0],
				"curr_0": offer[1],
				"curr_1": offer[2],
				"taker": order["taker"],
				"maker": order["maker"]
			};
			orders.push(order);
		}
	}
	orders.reverse();
	return orders;
}

// Helper method to retrieve an object of all the initialized contracts.
function getContracts(contract_initializer) {
	return {
	  WETH: new ethers.Contract(config["tokens"]["main"]["W-ETH"], WEthAbi.interface, contract_initializer),
	  DAI: new ethers.Contract(config["tokens"]["main"]["DAI"], erc20Abi.interface, contract_initializer),
	  MKR: new ethers.Contract(config["tokens"]["main"]["MKR"], erc20Abi.interface, contract_initializer),
	  Market: new ethers.Contract(config["market"]["main"]["address"], MatchingMarketAbi.interface, contract_initializer),
	  SupportMethods: new ethers.Contract(config["otcSupportMethods"]["main"]["address"], SupportMethodsAbi.interface, contract_initializer)
	};
}

export async function test(currencies) {
	return currencies;
}

// Function that gets the trades of a pair of currencies
// Input:
// 		currencies: [CURR_0, CURR_1]
//		contracts: contracts object from main App
//		provider
//		toBlock (default: latest): latest block to search
//		numBlocks (default: 5760 [1 day]): number of blocks to search going back from toBlock
export async function getPastOrders(currencies, toBlock=-1, numBlocks=5760) {
	let provider = new ethers.getDefaultProvider();

	// Since this is readOnly, the contracts are initialized with the provider
	let contracts = getContracts(provider);
	
	const { Market } = contracts;

	// Calculate toBlock and fromBlock
	const latestBlock = await provider.getBlockNumber();
	toBlock = toBlock === -1 ? latestBlock : toBlock;
	const fromBlock = toBlock - numBlocks;

	// Get the addresses for the currencies in question
	const curr_0_addr = contracts[currencies[0]].address;
	const curr_1_addr = contracts[currencies[1]].address;

	// Build a log filter for each permutation of currencies (0-1 and 1-0)
	const hashKey01 = buildHashKey(curr_0_addr, curr_1_addr);
	const filter01 = Market.filters.LogTake(null, hashKey01, null, null, null, null);
	filter01.fromBlock = fromBlock;

	const hashKey10 = buildHashKey(curr_1_addr, curr_0_addr);
	const filter10 = Market.filters.LogTake(null, hashKey10, null, null, null, null);
	filter10.fromBlock = fromBlock;

	// Wait for all of the events to load
	let [events01, events10] = await Promise.all([provider.getLogs(filter01), provider.getLogs(filter10)]);

	// Decode the data from all of the logs
	events01 = events01.map((item) => {
	  const parsed = Market.interface.events.LogTake.decode(item.data, item.topics);
	  return parsed;
	});
	events10 = events10.map((item) => {
	  const parsed = Market.interface.events.LogTake.decode(item.data, item.topics);
	  return parsed;
	});

	// Concatenate all of the events and Sort by timestamp
	const events = events01.concat(events10);
	events.sort(function(first, second) {
	  return parseInt(first.timestamp.toString()) - parseInt(second.timestamp.toString());
	});

	// Parse the events into a more usable Order format and return
	let orders = eventsToOrders(events, currencies, curr_0_addr, curr_1_addr);

	orders = orders.map((item) => {
		item["curr_0"] = item["curr_0"].toString();
		item["curr_1"] = item["curr_1"].toString();
		return item;
	})

	return orders;
}