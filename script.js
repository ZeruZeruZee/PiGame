
// ファイルからpiを求める
function getPi() {
	return new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		xhr.open('GET', 'pi.txt', true);
		xhr.onload = () => {
			if (xhr.status === 200) {
				const pi = xhr.responseText;
				resolve(pi);
			} else {
				reject(new Error(`Failed to fetch pi.txt. Status: ${xhr.status}`));
			}
		};
		xhr.send();
	});
}

function reverseText(text) {
	return text.split('').reverse().join('');
}

async function main() {
	
	const piDigits = await getPi();
	const synth = new Tone.PolySynth().toDestination();
	const synthCode = new Tone.PolySynth().toDestination();
	synth.set({
		envelope: {
			attack: 0.001,
			decay: 1,
			sustain: 0.5,
			release: 0.5
		},
		volume:-5
	})
	synthCode.set({
		envelope: { //sets the various sound properties for the synth
			attack: 0.01,
			decay: 1,
			sustain: 0.7,
			release: 2
		},
		volume:-20
	})
	const synthError = new Tone.PolySynth().toDestination();
	const resultText 		= document.getElementById('dynamicText');
	const keypadContainer	= document.getElementById('keypad-container');
	const healthBar 		= document.getElementById('healthBar');
	const noteArray = [
		"C4",
		"D4",
		"E4",
		"F4",
		"G4",
		"A4",
		"B4",
		"C5",
		"D5",
		"E5",
	];
	let codeDictionary = {
		C	: ["C2","C4","E4","G4"],
		G	: ["G2","G4","B4","D4"],
		Am	: ["A1","A4","C4","E4"],
		Em	: ["E2","E4","G4","B4"],
		F	: ["F2","F4","A4","C4"],
	};
	const CanonArray = [
		codeDictionary.C,
		codeDictionary.G,
		codeDictionary.Am,
		codeDictionary.Em,
		codeDictionary.F,
		codeDictionary.C,
		codeDictionary.F,
		codeDictionary.G
	]
	// ゲームをプレイしているか(ゲームオーバー中などはfalse)
	let isPlaying = true;
	let health = 100;
	let index = 0;
	let inputtedPi = piDigits.substring(0, index);
	let displayText = reverseText(inputtedPi);
	let missedValue = []
	resultText.innerHTML = `<span style="color: rgb(150, 150, 150);">${reverseText("INPUT 3.14")}</span>`;
	healthBar.style.width = `${health}%`;

	// キーボード入力を受け付ける
	document.addEventListener('keydown', function (event) {
		if (event.key >= '0' && event.key <= '9' && isPlaying) {
			handleInput(event.key);
		}	
	});

	// キーパッド入力を受け付ける
	keypadContainer.addEventListener('mousedown', function (event) {
		if (event.target.classList.contains('key') && isPlaying) {
			const pressedKey = event.target.textContent;
			handleInput(pressedKey);

		}
	});
	let codeIndex = 0;
	// 入力処理の関数
	function handleInput(input) {
		
		const now = Tone.now()
		const keyElements = document.querySelectorAll('.key');
		const keyElement = Array.from(keyElements).find((element) => element.textContent === piDigits[index]);
		

		keyElement.style.backgroundColor = "rgb(248, 238, 211)";
		if (input === piDigits[index]) {
			synth.triggerAttackRelease(noteArray[input], "16n");
			if(index%4==0){
				synthCode.triggerAttackRelease(CanonArray[codeIndex], "2n");
				codeIndex += 1;
				
				if(codeIndex >= CanonArray.length){
					codeIndex = 0;
				}
			}
			index += 1;
			inputtedPi += input;
			if(index %4 == 0){
				inputtedPi += " ";
			}
			if(index == 1){
				index ++;
				inputtedPi += "."
			}
			displayText = reverseText(inputtedPi);
			if(health<100){
				health+=2.5;
				if (health > 100)health = 100;
			}
			

		}else{
			displayText = reverseText(inputtedPi);
			missedValue.push(index);
			displayText = `<span style="color: rgb(150, 150, 150);">${piDigits[index]}</span>${displayText}`;
			health -=25;
			if (health < 0)  health = 0;
			if (health == 0){
				synthError.triggerAttackRelease(["C3","C4"], "4n");
				isPlaying　= false;
				setTimeout(function() {
					gameover(index);
				}, 500);
				
			}else{
				// osc.frequency.value = "C6";
				// ramp to "C2" over 2 seconds
				// osc.frequency.rampTo("C2", 0.5);
				// osc.start().stop("+0.5","+0.1");
				// synthError.triggerAttackRelease("C2", "16n",now)
				// synthError.triggerAttackRelease("C2", "16n",now+0.1)
				synthError.triggerAttackRelease("C3", "16n",now);

				// synthError.triggerAttackRelease(["D4", "F4", "A4", "C5", "E5"],"4n", now);

			}
		}
		setTimeout(() => {
			if (keyElement) {
				keyElement.style.backgroundColor = "";
			}
		}, 100);
		resultText.innerHTML = displayText;
		healthBar.style.width = `${health}%`;
	}
	function playWhile(value,maxValue){
		isPlaying = false;
		let i = 0;
		let code_i = 0;
		let textValue = "";
		
		Tone.Transport.scheduleRepeat((time) => {
			const playNote = piDigits[i];
			if(playNote != "."){
				synth.triggerAttackRelease(noteArray[playNote], "16n",time);
				const keyElements = document.querySelectorAll('.key');
				const keyElement = Array.from(keyElements).find((element) => element.textContent === playNote);
				keyElement.style.backgroundColor = "rgb(248, 238, 211)";
				setTimeout(() => {
				if (keyElement) {
					keyElement.style.backgroundColor = "";
				}
		}, 100);
			}
			if(i%4==0){
				synthCode.triggerAttackRelease(CanonArray[code_i], "2n",time);
				
				code_i += 1;
				if(code_i >= CanonArray.length){
					code_i = 0;
				}
			}
			// 間違えていた場合は赤くする
			if(missedValue.includes(i)){
				textValue = `<span style="color: rgb(255, 0, 0);">${piDigits[i]}</span>`+textValue;
			}else if(i >= value){
				textValue = `<span style="color: rgb(150, 150, 150);">${piDigits[i]}</span>`+textValue;
			}else{
				textValue = piDigits[i]+textValue;
			}

			resultText.innerHTML = textValue;
			// use the callback time to schedule events
			i += 1;

			if(i %4 == 0){
				console.log(textValue);
				textValue = " "+textValue;
			}
			if(i >= maxValue){
				Tone.Transport.stop();
				Tone.Transport.cancel();
				health = 100;
				index = 0;
				inputtedPi = "";
				isPlaying = true;
				codeIndex = 0;
				missedValue = [];
			}
		}, "8n");
		Tone.Transport.start();
	}
	function gameover(value){
		let maxValue = value + 16 - (value % 16);
		playWhile(value,maxValue);
	}
}

document.addEventListener('DOMContentLoaded', () => {
	main()
	
});


