import { quotes } from "./data.js"

const submitBtn = document.getElementById('submit-btn')
const valentineContainer = document.getElementById('valentine-container')

let quote = ''
let image = ''

submitBtn.addEventListener('click', () => {
	generateValentine()
})

async function generateValentine() {
	await resetValentine()  // fade out and reset content vars
	quote = getRandomQuote()
	image = getRandomImage()

	valentineContainer.innerHTML = getValentineHtml();
	valentineContainer.classList.add('fade-in')
}

function getRandomQuote() {
	let indexToGet = Math.floor(Math.random() * quotes.length)
	return quotes[indexToGet]
}

function getRandomImage() {
	let number = Math.floor(Math.random() * 11)
	return `images/all/image${number}.jpg`
}

function getValentineHtml() {
	return `
	<div class="inner-valentine-container">
	<img id="valentine-image" src="${image}">
	<p class="valentine-words top">${quote.lineOne}</p>
	<p class="valentine-words bottom">${quote.lineTwo}</p>
	</div>
	`;
}

async function resetValentine() {
	valentineContainer.classList.replace('fade-in', 'fade-out');

	// I need valentineContainer.innerHTML to wait until after the fade-out.
	await wait(700);
	valentineContainer.innerHTML = '';
	quote = '';
	image = '';
	// remove fade-out
	valentineContainer.classList.remove('fade-out');
}

function wait(ms) {
	return new Promise((resolve => setTimeout(resolve, ms)));
}
