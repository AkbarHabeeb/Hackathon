try {
  var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  var recognition = new SpeechRecognition();
}
catch(e) {
  console.error(e);
  $('.no-browser-support').show();
  $('.app').hide();
}

var alphabets_set = new Set(["a for","b for","c for","d for","e for","f for","g for","h for","i for","j for","k for","l for","m for","n for"
                        ,"o for","p for","q for","r for","s for","t for","u for","v for","w for","x for","y for","z for",
                      "a4","b4","c4","d4","e4","f4","g4","h4","i4","j4","k4","l4","m4","n4","o4","p4","q4","r4","s4",
                    "t4","u4","v4","w4","x4","y4","z4","before"]);

var noteTextarea = $('#note-textarea');
var instructions = $('#recording-instructions');
var notesList = $('ul#notes');

var noteContent = '';

recognition.continuous = true;

function ajax_get(url, callback) {
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function() {
      if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
          console.log('responseText:' + xmlhttp.responseText);
          try {
              var data = JSON.parse(xmlhttp.responseText);
          } catch(err) {
              console.log(err.message + " in " + xmlhttp.responseText);
              return;
          }
          callback(data);
      }
  };

  xmlhttp.open("GET", url, true);
  xmlhttp.send();
}

recognition.onresult = function(event) {

  var current = event.resultIndex;

  var transcript = event.results[current][0].transcript;

  var mobileRepeatBug = (current == 1 && transcript == event.results[0][0].transcript);

  if(!mobileRepeatBug) {
    noteContent = transcript.toLowerCase();
    
    if(alphabets_set.has(noteContent))
    {
      ajax_get("http://localhost:3000/api/words/getWord?alphabet="+noteContent, function(data) {
        console.log(noteContent);
        console.log(data);
        noteContent = data.result.alphabet + " "+data.result.word;
        readOutLoud(noteContent);
        noteTextarea.val(noteContent.toLowerCase());
        var html = "<img src=\""+data.result.image_url+"\"/>"
        document.getElementById("img_output").innerHTML = html;
      });
      recognition.stop();
      
      noteContent = "";

    }
    else
    {
      console.log(noteContent);
      noteTextarea.val("Voice is not audible. Please press START again");
      recognition.stop();
    }
  }

};

recognition.onstart = function() {
  instructions.text('Voice recognition activated. Try speaking into the microphone.');
}

recognition.onspeechend = function() {
  instructions.text('You were quiet for a while so voice recognition turned itself off.');
}

recognition.onerror = function(event) {
  if(event.error == 'no-speech') {
    instructions.text('Try Again, No speech detected.');
  };
}

$('#start-record-btn').on('click', function(e) {
  if (noteContent.length)
  {
	noteContent += ' ';
  }
  recognition.start();
});


$('#pause-record-btn').on('click', function(e) {
  recognition.stop();
  instructions.text('Voice recognition paused.');
});

$('#voice-out').on('click', function(e) {
  recognition.stop();
  readOutLoud(noteContent);
});

noteTextarea.on('input', function() {
  noteContent = $(this).val();
})

function readOutLoud(message) {
	var speech = new SpeechSynthesisUtterance();

	speech.text = message;
	speech.volume = 1;
	speech.rate = 0.5;
	speech.pitch = 1;

	window.speechSynthesis.speak(speech);
}