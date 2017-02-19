// Dashboard Javascript - Written by Members of FRC Team 2403, although based heavily on code by FRC Team 1418

//Imports
const electron = require('electron')
const electron_remote = electron.remote
const electron_app = electron_remote.app


// Default Value Setting

// Load Camera Module
cameraURL = "url('roborio-2403-frc.local:5800/?action=stream')"
function reloadCamera() {
	camera = $('#camera')
	camera.css('background-image', 'none')
	camera.css('background-image', cameraURL)
}
setTimeout(reloadCamera, 1000)


// Interaction Hooks for Elements

$('#bar-close').click(function() {
	electron_app.quit()
});

$('#bar-tuning').click(function() {
	$('#panel-main').toggleClass('tuning')
});

$('#camera').click(reloadCamera);



// Network Tables 