import { expect } from 'chai';
import { DirectiveOutpost } from '../src/directives/colony/outpost';
import { DirectiveColonize } from '../src/directives/colony/colonize';
import { DirectiveIncubate } from '../src/directives/colony/incubate';

// Feel free to extend or break these out!

/* Test Directive outpost, incubate, colonize responds properly when room it is in is one of the following:
 * Not Owned
 * Not Reserved
 * Owned by Anyone
 * Reserved by Anyone
 * -> Owned by Assimilated
 * -> Reserved by Assimilated
 */

describe('Directive DirectiveColonize()', () => {
	it('Not Owned', () => {
	});
	it('Not Reserved', () => {
	});
	it('Owned by Anyone', () => {
	});
	it('Reserved by Anyone', () => {
	});
	it('Owned by Assimilated Overmind', () => {
	});
	it('Reserved by Assmilated Overmind', () => {
	});
});

describe('Directive DirectiveIncubate()', () => {
	it('Not Owned', () => {
	});
	it('Not Reserved', () => {
	});
	it('Owned by Anyone', () => {
	});
	it('Reserved by Anyone', () => {
	});
	it('Owned by Assimilated Overmind', () => {
	});
	it('Reserved by Assmilated Overmind', () => {
	});
});

describe('Directive DirectiveOutpost()', () => {
	it('Not Owned', () => {
	});
	it('Not Reserved', () => {
	});
	it('Owned by Anyone', () => {
	});
	it('Reserved by Anyone', () => {
	});
	it('Owned by Assimilated Overmind', () => {
	});
	it('Reserved by Assmilated Overmind', () => {
	});
});


/* Test the Stategist responds properly when choosing a outpost and the room is one of the following:
 * Too close to existing colony
 * Close to existing colony
 * Hostile/Avoid room nearby
 * -> Assimilated nearby
 * Nothing nearby
 * Has unowned mineral
 * Has catalyst mineral
 */

describe('Strategist getBestExpansionRoomFor() ', () => {
	it('Too close to colony', () => {
	});
	it('Close to colony', () => {
	});
	it('Hostile/Avoid nearby', () => {
	});
	it('Assimilated nearby', () => {
	});
	it('Nothing Nearby', () => {
	});
	it('Has unowned Mineral', () => {
	});
	it('Has catalyst Mineral', () => {
	});
});

/* Test the Overseer responds properly computing possible outposts:
 * No Controller
 * Already a outpost
 * Already a colony
 * Already Owned by Anyone
 * Already Reserved 
 * Reserved by Muon
 * 
 */

describe('Overseer computePossibleOutposts()', () => {
	it('No Controller', () => {
	});
	it('Already a Outpost', () => {
	});
	it('Already a Colony', () => {
	});
	it('Already Owned by Anyone', () => {
	});
	it('Already Reserved by Anyone', () => {
	});
	it('Reserved by Muon', () => {
	});
});
