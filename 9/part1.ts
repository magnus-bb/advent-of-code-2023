//* SETUP
const file = Bun.file('input.txt')
const rawInput = await file.text()

const sequences = rawInput
	.split('\n')
	.map(row => row.split(' ').map(val => Number(val)))

console.log(
	sequences.reduce((acc, curr) => {
		return acc + calcNextNumber(curr)
	}, 0)
)

function calcNextNumber(sequence: number[]): number {
	const sequenceDifferentials: number[][] = addDifferentialArrays([sequence])

	for (let i = sequenceDifferentials.length - 2; i >= 0; i--) {
		const currSeq = sequenceDifferentials[i]
		const diffSeq = sequenceDifferentials[i + 1]

		const lastCurrNum = currSeq.at(-1) as number
		const lastDiffNum = diffSeq.at(-1) as number

		currSeq.push(lastCurrNum + lastDiffNum)
	}

	return sequenceDifferentials[0].at(-1) as number
}

function addDifferentialArrays(sequences: number[][]): number[][] {
	const lastSeq = sequences.at(-1) as number[]

	const diffArray: number[] = []

	lastSeq.forEach((num, i, arr) => {
		const prev = i === 0 ? null : arr[i - 1]

		if (prev === null) return

		diffArray.push(num - prev)
	})

	const combinedDiffArrays = [...sequences, diffArray]

	if (diffArray.every(num => num === 0)) return combinedDiffArrays

	return addDifferentialArrays(combinedDiffArrays)
}
