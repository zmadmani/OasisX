import { ethers } from 'ethers';

/** ################# HELPER FUNCTIONS ################# **/

// Helper function to calculate the price of an order using BigNumber for all operations
export function getPrice(pay_amt, buy_amt, type) {
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

// Helper function to build the hash keys for the log queries
function buildHashKey(first_addr, second_addr) {
	return ethers.utils.solidityKeccak256(['bytes', 'bytes'], [first_addr, second_addr]);
}

/** ################# Functions for retrieving executed orders ################# **/

// Function to unsubscribe from subscription from subscribeToNewOrders(). Should run for cleanup.
export async function unSubscribeToNewOrders(currencies, contracts) {
    var { Market } = contracts;
    
    var curr_0_addr = contracts[currencies[0]].address;
    var curr_1_addr = contracts[currencies[1]].address;
    
    const hashKey1 = buildHashKey(curr_0_addr, curr_1_addr);
    const hashKey2 = buildHashKey(curr_1_addr, curr_0_addr);
    
    var filter1 = Market.filters.LogTake(null, hashKey1, null, null, null, null);
    var filter2 = Market.filters.LogTake(null, hashKey2, null, null, null, null);
    Market.removeAllListeners(filter1).removeAllListeners(filter2);
}

// Function to subscribe to receive callbacks for new orders that were executed on the given currency pair
// addOrders is a callback function that is given an order object (outuput from eventsToOrders)
export async function subscribeToNewOrders(currencies, contracts, addOrders) {
	var { Market } = contracts;

	var curr_0_addr = contracts[currencies[0]].address;
	var curr_1_addr = contracts[currencies[1]].address;

	const hashKey1 = buildHashKey(curr_0_addr, curr_1_addr);
	const hashKey2 = buildHashKey(curr_1_addr, curr_0_addr);

	var filter1 = Market.filters.LogTake(null, hashKey1, null, null, null, null);
	var filter2 = Market.filters.LogTake(null, hashKey2, null, null, null, null);
	Market.on(filter1, (id, pair, maker, pay_gem, buy_gem, taker, take_amt, give_amt, timestamp, event) => {
	    var order = {
			"id": id,
			"pair": pair,
			"maker": maker,
			"pay_gem": pay_gem,
			"buy_gem": buy_gem,
			"taker": taker,
			"take_amt": take_amt,
			"give_amt": give_amt,
			"timestamp": timestamp
	    };
	    var orders = eventsToOrders([order], currencies, curr_0_addr, curr_1_addr);
	    addOrders(orders);
	});
	Market.on(filter2, (id, pair, maker, pay_gem, buy_gem, taker, take_amt, give_amt, timestamp, event) => {
	    var order = {
			"id": id,
			"pair": pair,
			"maker": maker,
			"pay_gem": pay_gem,
			"buy_gem": buy_gem,
			"taker": taker,
			"take_amt": take_amt,
			"give_amt": give_amt,
			"timestamp": timestamp
	    };
	    var orders = eventsToOrders([order], currencies, curr_0_addr, curr_1_addr);
	    addOrders(orders);
	});
}

// Function that gets the trades of a pair of currencies
// Input:
// 		currencies: [CURR_0, CURR_1]
//		contracts: contracts object from main App
//		provider
//		toBlock (default: latest): latest block to search
//		numBlocks (default: 5760 [1 day]): number of blocks to search going back from toBlock
export async function getPastOrders(currencies, contracts, provider, toBlock=-1, numBlocks=5760) {
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
	const orders = eventsToOrders(events, currencies, curr_0_addr, curr_1_addr);
	return orders;
}