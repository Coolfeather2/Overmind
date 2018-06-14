// Abathur is responsible for the evolution of the swarm and directs global production of minerals

import {Colony, getAllColonies} from '../Colony';
import {REAGENTS} from './map_resources';
import {mergeSum, minMax} from '../utilities/utils';
import {profile} from '../profiler/decorator';

const _priorityStock: { [key: string]: number } = {
	XGHO2: 1000,	// For toughness
	XLHO2: 1000, 	// For healing
	XZHO2: 1000, 	// For speed
	XZH2O: 1000, 	// For dismantling
	XKHO2: 1000, 	// For ranged attackers
	XUH2O: 1000, 	// For attacking
	GHO2 : 1000, 	// (-50 % dmg taken)
	LHO2 : 1000, 	// (+200 % heal)
	ZHO2 : 1000, 	// (+200 % fat decr - speed)
	ZH2O : 1000, 	// (+200 % dismantle)
	UH2O : 1000, 	// (+200 % attack)
	KHO2 : 1000, 	// (+200 % ranged attack)
	GO   : 1000, 	// (-30 % dmg taken)
	LO   : 1000, 	// (+100 % heal)
	ZO   : 1000, 	// (+100 % fat decr - speed)
	ZH   : 1000, 	// (+100 % dismantle)
	UH   : 1000, 	// (+100 % attack)
	KO   : 1000, 	// (+100 % ranged attack)
};

const _wantedStock: { [key: string]: number } = {
	UH   : 2000, 	// (+100 % attack)
	KO   : 3000, 	// (+100 % ranged attack)
	XGHO2: 10000, 	// For toughness
	XLHO2: 10000, 	// For healing
	XZHO2: 6000, 	// For speed
	XZH2O: 6000, 	// For dismantling
	XKHO2: 8000, 	// For ranged attackers
	XUH2O: 8000, 	// For attacking
	G    : 4000, 	// For nukes
	XLH2O: 2000, 	// For repair (or build)
	LH   : 2000, 	// (+50 % build and repair)
	XUHO2: 2000, 	// For harvest
	XKH2O: 2000, 	// For carry
	XGH2O: 12000 	// For upgraders
};

export interface Reaction {
	mineralType: string;
	amount: number;
}

// Compute priority and wanted stock
let numColonies = 1; //_.keys(Overmind.colonies).length;
let priorityStock: Reaction[] = [];
for (let resourceType in _priorityStock) {
	let stock = {
		mineralType: resourceType,
		amount     : numColonies * _priorityStock[resourceType]
	};
	priorityStock.push(stock);
}

let wantedStock: Reaction[] = [];
for (let resourceType in _wantedStock) {
	let stock = {
		mineralType: resourceType,
		amount     : numColonies * _wantedStock[resourceType]
	};
	wantedStock.push(stock);
}

@profile
export class Abathur {

	colony: Colony;
	priorityStock: Reaction[];
	wantedStock: Reaction[];
	assets: { [resourceType: string]: number };

	private _globalAssets: { [resourceType: string]: number };

	static settings = {
		minBatchSize: 100,	// anything less than this wastes time
		maxBatchSize: 1000, // manager carry capacity
	};

	constructor(colony: Colony) {
		this.colony = colony;
		this.priorityStock = priorityStock;
		this.wantedStock = wantedStock;
		this.assets = colony.assets;
	}

	/* Summarizes the total of all resources currently in a colony store structure */
	private computeGlobalAssets(): { [resourceType: string]: number } {
		let colonyAssets: { [resourceType: string]: number }[] = [];
		for (let colony of getAllColonies()) {
			colonyAssets.push(colony.assets);
		}
		return mergeSum(colonyAssets);
	}

	get globalAssets(): { [resourceType: string]: number } {
		if (!this._globalAssets) {
			this._globalAssets = this.computeGlobalAssets();
		}
		return this._globalAssets;
	}

	private canBuyIngredientsForReaction(reactionQueue: Reaction[]): boolean {
		// TODO
		return false;
	}

	// hasExcess(mineralType: ResourceConstant): boolean {
	// 	return this.assets[mineralType] > Math.max((_wantedStock[mineralType] || 0),
	// 											   (_priorityStock[mineralType] || 0));
	// }
	//
	// private someColonyHasExcess(mineralType: ResourceConstant): boolean {
	// 	return _.any(getAllColonies(), colony => colony.abathur.hasExcess(mineralType));
	// }

	/* Generate a queue of reactions to produce the most needed compound */
	getReactionQueue(verbose = false): Reaction[] {
		let stocksToCheck = [_priorityStock, _wantedStock];
		for (let stocks of stocksToCheck) {
			for (let resourceType in stocks) {
				let amountOwned = this.assets[resourceType] || 0;
				let amountNeeded = stocks[resourceType];
				if (amountOwned < amountNeeded) { // if there is a shortage of this resource
					return this.buildReactionQueue(<ResourceConstant>resourceType, amountNeeded - amountOwned, verbose);
				}
			}
		}
		return [];
	}

	/* Build a reaction queue for a target compound */
	private buildReactionQueue(mineral: ResourceConstant, amount: number, verbose = false): Reaction[] {
		amount = minMax(amount, Abathur.settings.minBatchSize, Abathur.settings.maxBatchSize);
		if (verbose) console.log(`Abathur@${this.colony.room.print}: building reaction queue for ${amount} ${mineral}`);
		let reactionQueue: Reaction[] = [];
		for (let ingredient of this.ingredientsList(mineral)) {
			let productionAmount = amount;
			if (ingredient != mineral) {
				if (verbose) console.log(`productionAmount: ${productionAmount}, assets: ${this.assets[ingredient]}`);
				productionAmount = Math.max(productionAmount - (this.assets[ingredient] || 0), 0);
			}
			productionAmount = Math.min(productionAmount, Abathur.settings.maxBatchSize);
			reactionQueue.push({mineralType: ingredient, amount: productionAmount});
		}
		if (verbose) console.log(`Pre-trim queue: ${JSON.stringify(reactionQueue)}`);
		reactionQueue = this.trimReactionQueue(reactionQueue);
		if (verbose) console.log(`Post-trim queue: ${JSON.stringify(reactionQueue)}`);
		reactionQueue = _.filter(reactionQueue, rxn => rxn.amount > 0);
		if (verbose) console.log(`Final queue: ${JSON.stringify(reactionQueue)}`);
		return reactionQueue;
	}

	/* Trim a reaction queue, reducing the amounts of precursor compounds which need to be produced */
	private trimReactionQueue(reactionQueue: Reaction[]): Reaction[] {
		// Scan backwards through the queue and reduce the production amount of subsequently baser resources as needed
		reactionQueue.reverse();
		for (let reaction of reactionQueue) {
			let [ing1, ing2] = REAGENTS[reaction.mineralType];
			let precursor1 = _.findIndex(reactionQueue, rxn => rxn.mineralType == ing1);
			let precursor2 = _.findIndex(reactionQueue, rxn => rxn.mineralType == ing2);
			for (let index of [precursor1, precursor2]) {
				if (index != -1) {
					if (reactionQueue[index].amount == 0) {
						reactionQueue[index].amount = 0;
					} else {
						reactionQueue[index].amount = minMax(reaction.amount, Abathur.settings.minBatchSize,
															 reactionQueue[index].amount);
					}
				}
			}
		}
		reactionQueue.reverse();
		return reactionQueue;
	}

	/* Figure out which basic minerals are missing and how much */
	getMissingBasicMinerals(reactionQueue: Reaction[]): { [resourceType: string]: number } {
		let requiredBasicMinerals = this.getRequiredBasicMinerals(reactionQueue);
		let missingBasicMinerals: { [resourceType: string]: number } = {};
		for (let mineralType in requiredBasicMinerals) {
			let amountMissing = requiredBasicMinerals[mineralType] - (this.assets[mineralType] || 0);
			if (amountMissing > 0) {
				missingBasicMinerals[mineralType] = amountMissing;
			}
		}
		return missingBasicMinerals;
	}

	/* Get the required amount of basic minerals for a reaction queue */
	private getRequiredBasicMinerals(reactionQueue: Reaction[]): { [resourceType: string]: number } {
		let requiredBasicMinerals: { [resourceType: string]: number } = {
			[RESOURCE_HYDROGEN] : 0,
			[RESOURCE_OXYGEN]   : 0,
			[RESOURCE_UTRIUM]   : 0,
			[RESOURCE_KEANIUM]  : 0,
			[RESOURCE_LEMERGIUM]: 0,
			[RESOURCE_ZYNTHIUM] : 0,
			[RESOURCE_CATALYST] : 0,
		};
		for (let reaction of reactionQueue) {
			let ingredients = REAGENTS[reaction.mineralType];
			for (let ingredient of ingredients) {
				if (!REAGENTS[ingredient]) { // resource is base mineral
					requiredBasicMinerals[ingredient] += reaction.amount;
				}
			}
		}
		return requiredBasicMinerals;
	}

	/* Recursively generate a list of ingredients required to produce a compound */
	private ingredientsList(mineral: ResourceConstant): ResourceConstant[] {
		if (!REAGENTS[mineral] || _.isEmpty(mineral)) {
			return [];
		} else {
			return this.ingredientsList(REAGENTS[mineral][0])
					   .concat(this.ingredientsList(REAGENTS[mineral][1]),
							   mineral);
		}
	}

}
