const wordCountForm = document.getElementById('word-count-form')
const wordCountInputEl = document.getElementById('word-count-input')
const lyricsContainer = document.getElementById('lyrics-container')
const lyricsEl = document.getElementById('lyrics-el')
const errorMessageEl = document.getElementById('error-message')
const copyBtnEl = document.getElementById('copy-btn')

let songToGet = ''
let lyrics = ''
let numWordsToGet = ''
let songList = []
let songWordCount = 0
let rawLyrics = ''

// // // // // // // // // // //  EVENT LISTENERS  // // // // // // // // // // //

// Get list of all songs by the Smiths as soon as the page loads
// document.addEventListener("DOMContentLoaded", async () => {
// 	await getSongList();
// })

// Clear input and related error messages upon focus on word count input box
// wordCountInputEl.addEventListener('focus', () => {
// 	clearInput()
// })

// wordCountForm.addEventListener('submit', (event) => {
// 	event.preventDefault()
// 	// this is where code for choice radios could go
// 	// numWordsToGet = Number(wordCountInputEl.value.trim())
// 	// // if there are non-digits, too many words, or the number is 0...
// 	// if (/\D/.test(numWordsToGet) || numWordsToGet > 5000 || numWordsToGet == 0) {
// 	// 	errorMessageEl.innerHTML = "<p>Please enter a number between 1 and 5000.</p>"
// 	// }
// 	// else {
// 		generateLoremSmithsum()
// 	// }
// })

copyBtnEl.addEventListener('click', copyLyricsToClipboard)

// // // // // // // // // // //  GENERATE & DISPLAY CONTENT  // // // // // // // // // // //

// async function generateLoremSmithsum() {
// 	try {
// 		resetLyrics() // reset word count and clears previously set of lyrics

// 		do {
// 			await getLyrics()  // get lyrics from source
// 			formatLyrics()  // format for display
// 		}
// 		while (songWordCount < numWordsToGet - 15);

// 		displayLyrics()  // display final lyrics in UI
// 	}
// 	catch (err) {
// 		console.log(err)
// 	}
// }

function displayLyrics() {
	copyBtnEl.style.display = 'unset'
	lyricsEl.innerHTML = ''
	lyricsEl.innerHTML = assembleLyrics();
	lyricsContainer.classList.add('fade-in')
}

// // // // // // // // // // //  DATA SERVICE FUNCTIONS  // // // // // // // // // // //

async function getSongList() {
	const response = await fetch('/.netlify/functions/getSongs')

	// get array of IDs (songList) from getSongs server function
	const result = await response.json()
	if (response.ok) {
		songList = result.songList
		console.log(`songList response ok`);
	} else {
		console.error("Error from function:", result.error);
	}
}

async function getLyrics() {
	do {
		songToGet = pickSongId(songList)  // Get random songId from list
	}
	// filter out Meat is Murder (worst song) & Suffer Little Children (too sad for casual viewing, even for me)
	while (songToGet === '13110' || songToGet === '51221')

	const songUrl = `https://songmeanings.com/songs/view/${songToGet}/`

	// get raw string of songToGet's lyrics
	const response = await fetch(`/.netlify/functions/fetchLyrics?songUrl=${songUrl}`)
	const result = await response.json()
	if (response.ok) {
		rawLyrics = result.rawLyrics
		console.log(`fetchLyrics response ok`);
	} else {
		console.error("Error from fetchLyrics function:", result.error)
	}
	if (rawLyrics.length < 50) {  //  filter out instrumentals
		await getLyrics()  // call getLyrics() again.
	}
}

function copyLyricsToClipboard() {
	let copiedLyrics = document.getElementById('lyrics-el')
	let convertedLyrics = (copiedLyrics.innerHTML).replace(/\<br\>/g, '\n')
	navigator.clipboard.writeText(convertedLyrics)
	alert("lorem smithsum has been copied to your clipboard.")
}

// // // // // // // // // // //   FORMATTING FUNCTIONS  // // // // // // // // // // //

function formatLyrics() {
	//  Get rid of any music symbols & extra spaces
	let junkRemoval = removeJunk()

	// Remove tags
	let taglessLyrics = removeTags(junkRemoval);

	// Update punctuation
	let formattedPunctuation = formatPunctuation(taglessLyrics)

	// Restructure lyrics into paragraphs of varying lengths
	let paragraphString = createParagraphs(formattedPunctuation)

	// refine formatting - // remove $, capitals after commas
	let refinedParagraphs = refineFormatting(paragraphString)
	let nitsPicked = pickingNits(refinedParagraphs)

	let formattedSong = cutToWordCount(nitsPicked)

	lyrics += formattedSong;
}

function removeJunk() {
	const musicNoteFix = /(\s)*(\(♫\)|\(&#x266B;\)|\(&#9835;\))(\s)*/g  // Remove music notes
	const startEndTags = /^(\s*<[^>]+>\s*)+|(\s*<[^>]+>\s*)+$/g;  // Remove any tags or spaces found at start/end
	const spaceAroundTags = /\s*(<[^>]+>)\s*/g  // Remove extra spaces before/after tags
	const spaceBeforePunctuation = /\s([:?.,!]+)/g
	// TODO: Add back in, or delete var
	const spaceAfterPunctuation = /([?.,!]+)\s/g

	return rawLyrics.replace(musicNoteFix, '')
		.replace(startEndTags, '')
		.replace(spaceAroundTags, '$1')
		.replace(spaceBeforePunctuation, '$1')
}

function removeTags(junkRemoval) {
	const verseChorusVerse = /(<br><div class="empty-line"><br><\/div>)(<br>)?(<div class="empty-line"><br><\/div>)?/g
	const breakTag = /\<br\/?\>/g
	const anyTag = /\<[^>]+>/g

	return junkRemoval.replace(verseChorusVerse, '@$')  // Replace verse/chorus tag sequence with @$
		.replace(breakTag, '#')  // Replace single line break tags temporarily with a #
		.replace(anyTag, '');  // Delete any extra tags hanging out.
}

function formatPunctuation(taglessLyrics) {
	const lineNeedsComma = /(?<![:;?.,!"'\)])(["'\)]*#)/g
	const paraNeedsPeriod = /(?<![:?.,!"'\)])([:,]?)(["'\)]*@\$)/g

	return taglessLyrics.replace(lineNeedsComma, ',$1')  // insert commas before all # with no punctuation
		.replace(paraNeedsPeriod, '.$2') // periods (not commas) before all @$
}

function createParagraphs(formattedPunctuation) {
	const paraNeedsPeriod = /(?<![:?.,!"'\)])([;:,]?)(["'\)]*\%)/g
	let paragraphs = []
	let newPara = ''
	let paraLength = 2

	// Remove string of tags creating verse breaks
	let origStructureArray = formattedPunctuation.split('@')

	// switch back and forth between creating 2-sentence and 3-sentence paragraphs
	if (origStructureArray.length > 1) {   // prevents song from going through loop if there aren't separate verses
		do {
			if (paraLength === 2) {
				newPara = origStructureArray[0] + '#' + origStructureArray[1] + `%<br><br>`
				origStructureArray.splice(0, 2)
				paraLength = 3
			}
			else if (paraLength === 3) {
				newPara = origStructureArray[0] + '#' + origStructureArray[1] + '#' + origStructureArray[2] + `%<br><br>`
				origStructureArray.splice(0, 3)
				paraLength = 2
			}
			paragraphs.push(newPara.replace(paraNeedsPeriod, '.$2'))
		}
		while (origStructureArray.length > 3)
	}
	if (origStructureArray.length >= 1) {
		let lastPara = origStructureArray.join('#') + `%<br><br>`
		paragraphs.push(lastPara.replace(paraNeedsPeriod, '.$2'))
	}
	return paragraphs.join('')
}

function refineFormatting(paragraphString) {
	const capsAfterCommas = /([,;])(['\)]?)(#|\s)([\(']?)([A-Z]{1})([a-z]+)/g  // Decapitalize words after commas
	const uppercaseAfterBreak = /(\<br\>)([a-z])/g;
	const uppercaseAfterPeriod = /([!?.])(["'\)]?)(\#|\s)([a-z])/g

	return paragraphString.replace(/\$/g, '')  //Remove $
		.replace(capsAfterCommas, (match, c1, c2, c3, c4, c5, c6) => { return `${c1}${c2}${c3}${c4}${c5.toLowerCase()}${c6}` })
		.replace(uppercaseAfterBreak, (match, c1, c2) => { return `${c1}${c2.toUpperCase()}`; })
		.replace(uppercaseAfterPeriod, (match, c1, c2, c3, c4) => { return `${c1}${c2}${c3}${c4.toUpperCase()}` })
		.replace(/\#|%/g, ' ');
}

function pickingNits(refinedParagraphs) {
	let upperCaseA = /(,\s)(["'\(]?)(A\s)/g //returns word 'a' to lowercase
	let mister = /(\s|\>|["'(])([Mm])([Rr])(\.?)/g // adds period to Mr.
	let needsSpace = /([\.,]+)([^\s\\."'\)])/g 		//  ensures space after punctuation

	// correct most important line in Cemetry Gates
	if (songToGet === '35105') {
		refinedParagraphs = refinedParagraphs
			.replace(/keats/g, 'Keats')
			.replace(/yeats/g, 'Yeats')
			.replace(/weird lover Wilde is on mine/i, 'Whale Blubber Wilde is on mine...')
			.replace(/\(sugar\.\)./i, 'Sugar!')
	}
	// correct weird DJ
	else if (songToGet === '35109') {
		refinedParagraphs = refinedParagraphs.replace(/[Dd]\.(\s?)[Jj]/g, 'DJ')
	}

	else if (songToGet === '13086') {
		refinedParagraphs = refinedParagraphs.replace(/william/g, 'William')
	}
	return refinedParagraphs
		.replace(upperCaseA, (match, c1, c2, c3) => `${c1}${c2}${c3.toLowerCase()}`)
		.replace(/england/g, 'England')
		.replace(mister, (match, c1, c2, c3, c4) => `${c1}${c2.toUpperCase()}${c3}.`)
		.replace(needsSpace, ('$1 $2'))
}

function cutToWordCount(refinedParagraphs) {
	const removeEndTags = /(\s*<[^>]+>\s*)+$/;  // Removes extra break or p tags after last paragraph

	// cut off refinedParagraphs at desired # of words
	let songArray = refinedParagraphs.split(' ');

	let wordsStillNeeded = numWordsToGet - songWordCount;
	// If fewer words than are in song are still needed, slice the words to meet that need.
	if (wordsStillNeeded < songArray.length) {
		songArray = songArray.slice(0, wordsStillNeeded);
	}
	songWordCount += songArray.length;

	return songArray.join(' ');
}

// Do last bits of formatting on entire lyrics string.
function assembleLyrics() {
	let endBreaks = /(\s*<[^>]+>\s*){2}$/
	let endPunctuation = /([:;,!?]*)(["'])?$/

	// Change non-period end punctuation to elipses on last sentence.
	return lyrics.replace(endBreaks, '') // remove break tags after very last line
	.replace(endPunctuation, '...')
}

// // // // // // // // // // // //  HELPER FUNCTIONS   // // // // // // // // // // // //


function clearInput() {
	errorMessageEl.innerHTML = ''
	wordCountInputEl.value = ''
}

function resetLyrics() {
	lyricsContainer.classList.remove('fade-in')
	songWordCount = 0;
	lyrics = '';
}

function pickSongId(songList) {
	let indexToGet = Math.floor(Math.random(0, songList.length) * songList.length)
	return (songList[indexToGet]).substring(6)
}
