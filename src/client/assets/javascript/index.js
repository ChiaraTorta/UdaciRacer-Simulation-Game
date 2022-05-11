// PROVIDED CODE BELOW (LINES 1 - 80) DO NOT REMOVE

// The store will hold all information needed globally
let store = {
	track_id: undefined,
	player_id: undefined,
	race_id: undefined,
}

// We need our javascript to wait until the DOM is loaded
document.addEventListener("DOMContentLoaded", function() {
	onPageLoad()
	setupClickHandlers()
})

async function onPageLoad() {
	try {
		const tracks = await getTracks()
		const trackCardsHtml = renderTrackCards(tracks)
		renderAt('#tracks', trackCardsHtml)

		const racers = await getRacers()
		const racerCarsHtml = renderRacerCars(racers)
		renderAt('#racers', racerCarsHtml)
	} catch(error) {
		console.log("Problem getting tracks and racers ::", error.message)
		console.error(error)
	}
}

function setupClickHandlers() {
	document.addEventListener('click', function(event) {
		const { target } = event

		// Race track form field
		// Use closest instead of matches assures that click events inside the track card are also handled
		if (target.closest('.card.track')) {
			handleSelectTrack(target)
		}

		// Podracer form field
		if (target.closest('.card.podracer')) {
			handleSelectPodRacer(target)
		}

		// Submit create race form
		if (target.matches('#submit-create-race')) {
			event.preventDefault()
	
			// start race
			handleCreateRace()
		}

	}, false)
}

async function delay(ms) {
	try {
		return await new Promise(resolve => setTimeout(resolve, ms));
	} catch(error) {
		console.log("an error shouldn't be possible here")
		console.log(error)
	}
}
// ^ PROVIDED CODE ^ DO NOT REMOVE

// This async function controls the flow of the race, add the logic and error handling
async function handleCreateRace() {
	try {
		// Get player_id and track_id from the store
		const { player_id, track_id} = store
		
		// render starting UI
		renderAt('#race', renderRaceStartView(`Track ${track_id}`))

		// invoke the API call to create the race, then save the result
		const race = await createRace(player_id, track_id)

		// update the store with the race id
		// For the API to work properly, the race id should be race id - 1
		store.race_id = race.ID - 1
		const { race_id } = store;

		// The race has been created, now start the countdown
		// call the async function runCountdown
		await runCountdown()

		// call the async function startRace
		await startRace(race_id)
		console.log('The race has started!')

		// add click event to accelerate once the run has started
		document.getElementById('gas-peddle').addEventListener('click', function() {
			handleAccelerate()
		}, false)
		
		// call the async function runRace
		await runRace(race_id)
		
	} catch (error) {
		console.log(error.message);
	}
}

function runRace(raceID) {
	return new Promise(resolve => {
		const raceInterval = setInterval(async () => {
			try {
				const raceInfo = await getRace(raceID)
				if (raceInfo.status === 'in-progress') {
					console.log(`The race is in progress!`)
					renderAt('#leaderBoard', raceProgress(raceInfo.positions))
				}
				if (raceInfo.status === 'finished') {
					console.log(`The race has finished!`)
					clearInterval(raceInterval)
					renderAt('#race', resultsView(raceInfo.positions))
					resolve(raceInfo)
				}
			} catch (error) {
				console.log(error.message);
			}
		}, 500, raceID)
	})
}

async function runCountdown() {
	try {
		// wait for the DOM to load
		await delay(1000)
		console.log('The countdown is running')
		let timer = 3

		return new Promise(resolve => {
			// run this DOM manipulation to decrement the countdown for the user
			let countdown = setInterval(() => {
				document.getElementById('big-numbers').innerHTML = --timer
			}, 1000)

			// if the countdown is done, clear the interval, resolve the promise, and return
			setTimeout(()=> {
				clearInterval(countdown)
				console.log('The countdown is done')
				resolve()
				return
			}, 3000)
		})
	} catch(error) {
		console.log(error);
	}
}

function handleSelectPodRacer(target) {
	// if the target is inside the track card, update target
	if (!target.id) {
		target = target.closest('.card.podracer')
	}

	console.log("selected a pod", target.id)

	// remove class selected from all racer options
	const selected = document.querySelector('#racers .selected')
	if(selected) {
		selected.classList.remove('selected')
	}

	// add class selected to current target
	target.classList.add('selected')

	// save the selected racer to the store
	store.player_id = parseInt(target.id)
}

function handleSelectTrack(target) {
	// if the target is inside the track card, update target
	if (!target.id) {
		target = target.closest('.card.track')
	}
	console.log("selected a track", target.id)

	// remove class selected from all track options
	const selected = document.querySelector('#tracks .selected')
	if(selected) {
		selected.classList.remove('selected')
	}

	// add class selected to current target
	target.classList.add('selected')

	// save the selected track id to the store
	store.track_id = parseInt(target.id)
}

function handleAccelerate() {
	console.log("accelerate button clicked")
	// Invoke the API call to accelerate
	accelerate(store.race_id)
}

// HTML VIEWS ------------------------------------------------
// Provided code - do not remove

function renderRacerCars(racers) {
	if (!racers.length) {
		return `
			<h4>Loading Racers...</4>
		`
	}

	const results = racers.map(renderRacerCard).join('')

	return `
		<ul id="racers">
			${results}
		</ul>
	`
}

function renderRacerCard(racer) {
	const { id, driver_name, top_speed, acceleration, handling } = racer

	return `
		<li class="card podracer" id="${id}">
			<h3>${driver_name}</h3>
			<p>${top_speed}</p>
			<p>${acceleration}</p>
			<p>${handling}</p>
		</li>
	`
}

function renderTrackCards(tracks) {
	if (!tracks.length) {
		return `
			<h4>Loading Tracks...</4>
		`
	}

	const results = tracks.map(renderTrackCard).join('')

	return `
		<ul id="tracks">
			${results}
		</ul>
	`
}

function renderTrackCard(track) {
	const { id, name } = track

	return `
		<li id="${id}" class="card track">
			<h3>${name}</h3>
		</li>
	`
}

function renderCountdown(count) {
	return `
		<h2>Race Starts In...</h2>
		<p id="big-numbers">${count}</p>
	`
}

function renderRaceStartView(track, racers) {
	return `
		<header>
			<h1>Race: ${track.name}</h1>
		</header>
		<main id="two-columns">
			<section id="leaderBoard">
				${renderCountdown(3)}
			</section>

			<section id="accelerate">
				<h2>Directions</h2>
				<p>Click the button as fast as you can to make your racer go faster!</p>
				<button id="gas-peddle">Click Me To Win!</button>
			</section>
		</main>
		<footer></footer>
	`
}

function resultsView(positions) {
	positions.sort((a, b) => (a.final_position > b.final_position) ? 1 : -1)

	return `
		<header>
			<h1>Race Results</h1>
		</header>
		<main>
			${raceProgress(positions)}
			<a href="/race">Start a new race</a>
		</main>
	`
}

function raceProgress(positions) {
	let userPlayer = positions.find(e => e.id === store.player_id)
	userPlayer.driver_name += " (you)"

	positions = positions.sort((a, b) => (a.segment > b.segment) ? -1 : 1)
	let count = 1

	const results = positions.map(p => {
		return `
			<tr>
				<td>
					<h3>${count++} - ${p.driver_name}</h3>
				</td>
			</tr>
		`
	})

	return `
		<main>
			<h3>Leaderboard</h3>
			<section id="leaderBoard">
				${results}
			</section>
		</main>
	`
}

function renderAt(element, html) {
	const node = document.querySelector(element)

	node.innerHTML = html
}

// ^ Provided code ^ do not remove


// API CALLS ------------------------------------------------

const SERVER = 'http://localhost:8000'

function defaultFetchOpts() {
	return {
		mode: 'cors',
		headers: {
			'Content-Type': 'application/json',
			'Access-Control-Allow-Origin' : SERVER,
		},
	}
}

function getTracks() {
	return fetch(`${SERVER}/api/tracks`)
 	   	.then(response => response.json())
		.catch(error => console.error(error))
}

function getRacers() {
	return fetch(`${SERVER}/api/cars`)
 		.then(response => response.json())
		.catch(error => console.error(error))
}

function createRace(player_id, track_id) {
	player_id = parseInt(player_id)
	track_id = parseInt(track_id)
	const body = { player_id, track_id }
	
	return fetch(`${SERVER}/api/races`, {
		method: 'POST',
		...defaultFetchOpts(),
		dataType: 'jsonp',
		body: JSON.stringify(body)
	})
	.then(res => res.json())
	.then(race => {
		console.log('The race was created', race)
		return race
	})
	.catch(err => console.log("Problem with createRace request::", err))
}

function getRace(id) {
	return fetch(`${SERVER}/api/races/${id}`)
		.then(response => response.json())
		.catch(error => console.error(error))
}

function startRace(id) {
	return fetch(`${SERVER}/api/races/${id}/start`, {
		method: 'POST',
		...defaultFetchOpts(),
	})
	.catch(err => console.log("Problem with startRace request::", err))
}

function accelerate(id) {
	fetch(`${SERVER}/api/races/${id}/accelerate`, {
		method: 'POST',
		defaultFetchOpts
	  })
	.catch(error => console.log(error))
}
