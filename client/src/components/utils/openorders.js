import { ethers } from 'ethers';

// Helper function to process raw events into order objects
function processOpenOrders(rawOrders, type) {
	var n = rawOrders["ids"].length
	var orders = []
	for(var i = 0; i < n; i++) {
		if(rawOrders["ids"][i].toString() !== "0") { // && rawOrders["owners"][i] === account
			var id = rawOrders["ids"][i].toString()
			var maker = rawOrders["owners"][i]
			var pay_amount = ethers.utils.formatUnits(rawOrders["payAmts"][i].toString(), 'ether')
			var buy_amount = ethers.utils.formatUnits(rawOrders["buyAmts"][i].toString(), 'ether') 
			var price = 0
			var order = {}
			if(type === "BUY") {
				price = Math.round(pay_amount / buy_amount * 1000) / 1000
				buy_amount = Math.round(buy_amount * 1000) / 1000
				pay_amount = Math.round(pay_amount * 1000) / 1000
				order = {
					"price": price,
					"curr_0_amt": buy_amount,
					"curr_1_amt": pay_amount,
					"id": id,
					"type": type,
					"maker": maker
				}
			} else {
				price = Math.round(buy_amount / pay_amount * 1000) / 1000
				buy_amount = Math.round(buy_amount * 1000) / 1000
				pay_amount = Math.round(pay_amount * 1000) / 1000
				order = {
					"price": price,
					"curr_0_amt": pay_amount,
					"curr_1_amt": buy_amount,
					"id": id,
					"type": type,
					"maker": maker
				}
			}
			orders.push(order)
		}
	}
	return orders
}

// Function that gets a list of open orders for a pair of currencies and a type (BUY or SELL)
export async function getOpenOrders(type, currencies, contracts) {
	const { Market } = contracts;

	if(currencies.length === 2) {
		const token_addr_0 = contracts[currencies[0]].address;
		const token_addr_1 = contracts[currencies[1]].address;

		let pay_token = null;
		let buy_token = null;

		if(type === "BUY") {
			pay_token = token_addr_1;
			buy_token = token_addr_0;
		} else {
			pay_token = token_addr_0;
			buy_token = token_addr_1;
		}

		const rawOrders = await contracts.SupportMethods.getOffers(Market.address, pay_token, buy_token);
		let orders = [];
		if(rawOrders) {
			orders = processOpenOrders(rawOrders, type);
		}
		return orders;
	}

	return [];
}