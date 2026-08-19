import { quotes } from "./data.js"

const submitBtn = document.getElementById('submit-btn')
const valentineContainer = document.getElementById('valentine-container')
const valentineImage = document.getElementById('valentine-image')

let quote = ''
let image = ''

submitBtn.addEventListener('click', () => {
	generateValentine()
})

function generateValentine() {
	quote = getRandomQuote()
	image = getRandomImage()
	const valContents = getValentineHtml(quote)

	valentineContainer.innerHTML = valContents
	valentineContainer.style.display = 'flex';
	valentineContainer.classList.add('fade-in')
}

function getRandomQuote() {
	let indexToGet = Math.floor(Math.random(0, quotes.length) * quotes.length)
	return quotes[indexToGet]
}

function getRandomImage() {
	let number = Math.floor(Math.random(0, 9) * 9)
	return `images/all/image${number}.jpg`
}

function getValentineHtml(quote) {
	return `
		<div class="inner-valentine-container">
			<img id="valentine-image" src="${image}">
			<p class="valentine-words top">${quote.lineOne}</p>
			<p class="valentine-words bottom">${quote.lineTwo}</p>
		</div>
		`
}
