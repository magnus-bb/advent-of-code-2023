type Card = 'A' | 'K' | 'Q' | 'J' | 'T' | '9' | '8' | '7' | '6' | '5' | '4' | '3' | '2'

const ORDERED_CARDS: Card[] = ['J','2', '3', '4', '5', '6', '7', '8', '9', 'T', 'Q','K', 'A'] as const


const enum HandType {
	High,
	OnePair,
	TwoPair,
	ThreeKind,
	House,
	FourKind,
	FiveKind,
}

interface Play {
	hand: string
	bid: number
}

interface PlayWithHandType extends Play {
	type: HandType
}


//* SETUP
const file = Bun.file('input.txt')
const rawInput = await file.text()
const plays: Play[] = rawInput.split('\n').map(hand => hand.split(' ')).map(([hand, bid]) => ({
	hand,
	bid: Number(bid)
}))

//* STEPS
const playsWithType: PlayWithHandType[] = plays.map(play => ({
	...play,
	type: getHandType(play.hand)
}))

const sortedPlays: PlayWithHandType[] = playsWithType.toSorted((a, b) => {
	// If hand types are the same, rank the individual cards in hands instead
	if (a.type === b.type) {
		for (let i = 0; i < a.hand.length; i++) {
			const aCard = a.hand[i] as Card
			const bCard = b.hand[i] as Card

			const aCardRank = ORDERED_CARDS.indexOf(aCard)
			const bCardRank = ORDERED_CARDS.indexOf(bCard)

			// If cards are the same, check next card in hands
			if (aCardRank === bCardRank) continue

			// If cards are different, highest rank num wins
			return aCardRank - bCardRank
		}
	}

	// If hand types are different, highest HandType number wins
	return a.type - b.type
})

const totalWinnings: number = sortedPlays.reduce((acc, curr, index) => {
	const rank = index + 1

	const winnings = curr.bid * rank

	return acc + winnings
}, 0)

console.log(totalWinnings)

// 1 = Five of a kind
// 2
// - Hvis en værdi er 4 = Four of a kind
// - else = House
// 3
// - Hvis en værdi er 3 = Three of a kind
// - else = 2 pairs
// 4 = One pair
// 5 = High card
function getHandType(hand: string): HandType {
	const {regularCardCounts, jokerCount} = cardCounter(hand)
	const len = regularCardCounts.length

	const highestValueWithJoker = regularCardCounts[0] + jokerCount

	switch (len) {
		case 0:
		case 1: {
			return HandType.FiveKind
		}
		case 2: {
			return highestValueWithJoker === 4 ? HandType.FourKind : HandType.House
		}
		case 3: {
			return highestValueWithJoker === 3 ? HandType.ThreeKind : HandType.TwoPair
		}
		case 4: {
			return HandType.OnePair
		}
		default: {
			return HandType.High
		}
	}
}

function cardCounter(hand: string): {regularCardCounts: number[], jokerCount: number} {
	const counts: Record<string, number> = {}
	let jokerCount = 0

	for (const card of hand) {
		if(card === 'J') {
			jokerCount++
		}	else {
			counts[card] = (counts[card] ?? 0) + 1
		}
	}

	const regularCardCounts = Object.values(counts).toSorted((a,b) => b - a)

	return {regularCardCounts, jokerCount}
}