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
	ends: [Direction, Direction]

	constructor(ends: [Direction, Direction]) {
		this.ends = ends
	}

	nextDirection(prevDir: Direction): Direction {
		return this.ends.find(end => end !== prevDir) as Direction
	}
}

console.time('Parsing')
const file = Bun.file('input.txt')
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
			return new Pipe([Direction.Down, Direction.Right])
		}
		case '7': {
			return new Pipe([Direction.Down, Direction.Left])
		}
		case 'L': {
			return new Pipe([Direction.Up, Direction.Right])
		}
		case 'J': {
			return new Pipe([Direction.Up, Direction.Left])
		}
		case '|': {
			return new Pipe([Direction.Up, Direction.Down])
		}
		case '-': {
			return new Pipe([Direction.Left, Direction.Right])
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

let stepsTaken = 0

// Start coords are definitely assigned a value here
console.time('Traversing')
traverseFromStart(startCoords!)

const furthestDistance = Math.ceil(stepsTaken / 2)

console.timeEnd('Traversing')

console.log('Distance:\n', furthestDistance)

function traverseFromStart(coords: Coords) {
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

		return traverse(neighbor.direction, neighbor.coords)
	}
}

function traverse(prevDir: Direction, coords: Coords) {
	// If we reach back to the start, stop traversing
	if (coords.x === startCoords!.x && coords.y === startCoords!.y) return

	stepsTaken++

	const pipe = getGridPoint(coords) as Pipe

	const cameFromDirection = getOppositeDirection(prevDir)

	const nextDirection = pipe.nextDirection(cameFromDirection)

	const nextCoords = coords.getNeighbor(nextDirection)

	return traverse(nextDirection, nextCoords)
}

function getGridPoint(coords: Coords) {
	return parsedGrid[coords.y][coords.x]
}
