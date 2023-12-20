type DirectionStrength = -1 | 0 | 1

interface DirectionCoords {
	x: DirectionStrength
	y: DirectionStrength
}

const enum Direction {
	Up = 'up',
	Down = 'down',
	Left = 'left',
	Right = 'right',
}

function getOppositeDirection(direction: Direction): Direction {
	switch (direction) {
		case Direction.Up:
			return Direction.Down
		case Direction.Down:
			return Direction.Up
		case Direction.Left:
			return Direction.Right
		case Direction.Right:
			return Direction.Left
	}
}

function getOrthogonalDirection(
	curr: Direction,
	chirality: Direction.Left | Direction.Right
): Direction {
	switch (curr) {
		case Direction.Up:
			return chirality
		case Direction.Down:
			return chirality === Direction.Left ? Direction.Right : Direction.Left
		case Direction.Left:
			return chirality === Direction.Left ? Direction.Down : Direction.Up
		case Direction.Right:
			return chirality === Direction.Left ? Direction.Up : Direction.Down
	}
}

function getChirality(curr: Direction, next: Direction): -1 | 1 | 0 {
	if (curr === next) return 0

	if (curr === Direction.Up) {
		switch (next) {
			case Direction.Right:
				return 1
			case Direction.Left:
				return -1
			default:
				return 0
		}
	}

	if (curr === Direction.Down) {
		switch (next) {
			case Direction.Right:
				return -1
			case Direction.Left:
				return 1
			default:
				return 0
		}
	}

	if (curr === Direction.Left) {
		switch (next) {
			case Direction.Up:
				return 1
			case Direction.Down:
				return -1
			default:
				return 0
		}
	}

	if (curr === Direction.Right) {
		switch (next) {
			case Direction.Up:
				return -1
			case Direction.Down:
				return 1
			default:
				return 0
		}
	}
	return 0
}

class Coords {
	constructor(public readonly x: number, public readonly y: number) {}

	getNeighbor(direction: Direction) {
		switch (direction) {
			case Direction.Up:
				return new Coords(this.x, this.y - 1)
			case Direction.Down:
				return new Coords(this.x, this.y + 1)
			case Direction.Left:
				return new Coords(this.x - 1, this.y)
			case Direction.Right:
				return new Coords(this.x + 1, this.y)
		}
	}
}

class Pipe {
	mainLoop: boolean = false

	constructor(public ends: [Direction, Direction], public coords: Coords) {}

	nextDirection(prevDir: Direction): Direction {
		return this.ends.find(end => end !== prevDir) as Direction
	}
}

console.time('Parsing')
const file = Bun.file('input1.txt')
const rawInput = await file.text()

const rawGrid = rawInput.split('\n').map(row => row.split(''))

let startCoords: Coords | null = null

const parsedGrid: (Pipe | null)[][] = rawGrid.map((row, y) => {
	return row.map((_, x) => {
		return parseChar(new Coords(x, y))
	})
})
console.timeEnd('Parsing')

function parseChar(coords: Coords): Pipe | null {
	const char = rawGrid[coords.y][coords.x]

	switch (char) {
		case 'S': {
			startCoords = coords
			return null // we get back to this one later
		}
		case '.': {
			return null
		}
		case 'F': {
			return new Pipe([Direction.Down, Direction.Right], coords)
		}
		case '7': {
			return new Pipe([Direction.Down, Direction.Left], coords)
		}
		case 'L': {
			return new Pipe([Direction.Up, Direction.Right], coords)
		}
		case 'J': {
			return new Pipe([Direction.Up, Direction.Left], coords)
		}
		case '|': {
			return new Pipe([Direction.Up, Direction.Down], coords)
		}
		case '-': {
			return new Pipe([Direction.Left, Direction.Right], coords)
		}
		default:
			return null
	}
}

function coordsAreValid(grid: unknown[][], coords: Coords): boolean {
	const { x, y } = coords

	const xMax = grid[0].length - 1
	const yMax = grid.length - 1

	if (0 <= x && x <= xMax && 0 <= y && y <= yMax) return true

	return false
}

//* Traverse pipes

let rightTurns = 0
const insideCoords = new Set<string>()
// Start coords are definitely assigned a value here
traverseFromStart(startCoords!, initialTraversalFunc)

const chirality = rightTurns > 0 ? Direction.Right : Direction.Left

traverseFromStart(startCoords!, markInsideLoopFunc)

insideCoords.delete(`${startCoords!.x}${startCoords!.y}`)
console.log(insideCoords.size)


function traverseFromStart(
	coords: Coords,
	func: (pipe: Pipe, prev: Direction, nextDir: Direction) => void
) {
	const neighbors = [
		{ direction: Direction.Up, coords: coords.getNeighbor(Direction.Up) },
		{ direction: Direction.Down, coords: coords.getNeighbor(Direction.Down) },
		{ direction: Direction.Left, coords: coords.getNeighbor(Direction.Left) },
		{ direction: Direction.Right, coords: coords.getNeighbor(Direction.Right) },
	]

	for (const neighbor of neighbors) {
		if (!coordsAreValid(parsedGrid, neighbor.coords)) continue

		const potentialPipe = getGridPoint(neighbor.coords)

		if (!potentialPipe) continue

		const pipe = potentialPipe

		// We have to check if an end of the pipe is actually is connected to the starting point before we can traverse it
		const cameFromDirection = getOppositeDirection(neighbor.direction)

		if (!pipe.ends.includes(cameFromDirection)) continue

		return traverse(neighbor.direction, neighbor.coords, func)
	}
}

function traverse(
	prevDir: Direction,
	coords: Coords,
	func: (pipe: Pipe, prev: Direction, nextDir: Direction) => void
) {
	// If we reach back to the start, stop traversing
	if (coords.x === startCoords!.x && coords.y === startCoords!.y) return

	const pipe = getGridPoint(coords) as Pipe

	const cameFromDirection = getOppositeDirection(prevDir)

	const nextDirection = pipe.nextDirection(cameFromDirection)

	const nextCoords = coords.getNeighbor(nextDirection)

	func(pipe, prevDir, nextDirection)

	return traverse(nextDirection, nextCoords, func)
}

function initialTraversalFunc(
	pipe: Pipe,
	prevDir: Direction,
	nextDir: Direction
) {
	pipe.mainLoop = true
	rightTurns += getChirality(prevDir, nextDir)
}

function markInsideLoopFunc(
	pipe: Pipe,
	prevDir: Direction,
	nextDir: Direction
) {
	const firstCheckDir = getOrthogonalDirection(prevDir, chirality)

	if (pipe.ends.includes(firstCheckDir)) return

	const firstCheckCoords = pipe.coords.getNeighbor(firstCheckDir)
	
	directionalMarking(firstCheckDir, firstCheckCoords)
	
	// Her vi skal tjekke 2 retninger ved hjørner
	if (prevDir !== nextDir) {
		// const secondCheckDir = getOrthogonalDirection(nextDir, chirality)
		// const secondCheckCoords = pipe.coords.getNeighbor(secondCheckDir)
		
		// directionalMarking(secondCheckDir, secondCheckCoords)

		const secondCheckCoords = pipe.coords.getNeighbor(prevDir)
		
		directionalMarking(prevDir, secondCheckCoords)
	}
}

function directionalMarking(checkDir: Direction, coords: Coords) {
	const potentialPipe = getGridPoint(coords)

	const isNotMainLoopPipe = !potentialPipe?.mainLoop

	if (!isNotMainLoopPipe) return

	insideCoords.add(`${coords.x}${coords.y}`)

	const nextCoords = coords.getNeighbor(checkDir)

	directionalMarking(checkDir, nextCoords)
}

function getGridPoint(coords: Coords) {
	return parsedGrid[coords.y][coords.x]
}
