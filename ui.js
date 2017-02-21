// Dashboard Javascript - Written by Members of FRC Team 2403, although based heavily on code by FRC Team 1418

//Imports
const electron = require('electron');
const electron_remote = electron.remote;
const electron_app = electron_remote.app;
const BrowserWindow = electron_remote.BrowserWindow;


// Better Prototypes & Helper Functions

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(escapeRegExp(search), 'g'), replacement);
};


// Default Value Setting

// Load Camera Module
cameraURL = "url('roborio-2403-frc.local:5800/?action=stream')";
function reloadCamera() {
	camera = $('#camera')
	camera.css('background-image', 'none');
	camera.css('background-image', cameraURL);
}
setTimeout(reloadCamera, 1000);


// Interaction Hooks for Elements

$('#bar-close').click(function() {
	electron_app.quit();
});

$('#bar-reload').click(function() {
	electron_app.relaunch();
	electron_app.quit();
});

$('#bar-position').click(function() {
	current_window = electron_remote.getGlobal('mainWindow')
	console.log(current_window.id)
	display_width = electron.screen.getPrimaryDisplay().size.width
	current_window.setBounds({x: 0, y: 0, width: display_width, height: 528}, true)
	//current_window.setPosition(0,0,true)
	//current_window.setSize(display_width, 528, true)
});

$('#bar-tuning').click(function() {
	$('#panel-main').toggleClass('tuning');
});

$('#camera').click(reloadCamera);

$('#tuning-button-set').click(function() {
	if ($('#tuning-name').val() && $('#tuning-value').val()) {
		NetworkTables.setValue($('#tuning-name').val, value = $('#tuning-value').val());
	} else {
		console.log('User attempted to set a NetworkTables value without a valid Key and Value.');
	}
});

$('#tuning-button-get').click(function() {
	if ($('#tuning-name').val()) {
		$('#tuning-value').val(NetworkTables.getValue($('#tuning-name').val()));
	}
});


// Network Tables 

// Initalize Network Tables
NetworkTables.addRobotConnectionListener(onRobotConnection, true); // Called when robot connects or disconnects
NetworkTables.addGlobalListener(onKeyValueChanged, true); // Called when any NetworkTables key changes value.

// Handle Network Tables Events

function onRobotConnection(connected) {
	$('#bar-connection').html(connected ? 'CONNECTED' : 'DISCONNECTED');
	if (connected) {
		$('#bar-connection').addClass('connected');
	} else {
		$('#bar-connection').removeClass('connected');
	}
}

function onKeyValueChanged(key, value, isNew) {
	if (value == 'true') { // Convert value to boolean equivalent if appropriate
		value = true; 
	} else if (value == 'false') {
		value = false;
	}

	// Switch statement to update appropriate UI elements based on key updated.
	switch (key) {

		// Case to run dashboard countdown timer during match
		case '/SmartDashboard/time_running':
			var s = 135;
			if (value) {
				timer = $('#bar-timer')
				timer.removeClass('warning').removeClass('ending')

				// Function below adjusts time left every second
				var countdown = setInterval(function() {
					s--; // Subtract one second
					// Minutes (m) is equal to the total seconds divided by sixty with the decimal removed.
					var m = Math.floor(s / 60);
					// Create seconds number that will actually be displayed after minutes are subtracted
					var visualS = (s % 60);

					// Add leading zero if seconds is one digit long, for proper time formatting.
					visualS = visualS < 10 ? '0' + visualS : visualS;

					if (s < 0) {
						// Stop countdown when timer reaches zero
						clearTimeout(countdown);
						return;
					} else if (s <= 15) {
						// Flash timer at red if less than 15 seconds left
						timer.addClass('ending').removeClass('warning')
						if (s % 2 === 0) {
							timer.css('opacity', '1') // Set opacity to 1 to make timer visible
						} else {
							timer.css('opacity', '0.2') // Set opacity to 0.2 to make timer mostly invisible
						}
					} else if (s <= 30) {
						// Set timer to RED
						timer.addClass('ending').removeClass('warning')
					} else if (s <= 60) {
						// Set timer to ORANGE
						timer.addClass('warning').removeClass('ending')
					}
					ui.timer.innerHTML = m + ':' + visualS;
				}, 1000);
			} else {
				s = 135;
			}
			NetworkTables.setValue(key, false);
			break;


		// Robot Data Output


		// Gear Vision Angle
		case '/vision/gearElevatorAngle':
			break;
		
		
		// Gear Vision Distance
		case '/vision/gearElevatorDistance':
			break;


		// Shooter Angle
		case '/vision/shooterAngle':
			break;


		// Shooter Distance
		case '/vision/shooterDistance':
			break;


		// Shooter Velocity
		case '/vision/shooterVelocity':
			break;

	}

	// Tuning - other network Tables values
	id_name = 'val' + key.replaceAll('/', '-_-').replaceAll(' ', '_-_')
	if (isNew) {
		if (key.substring(0,17) != '/CameraPublisher/'){
			var div = document.createElement('div'); // Create container <div>
			div.id = id_name; // Set container id to id_name variable based on NetworkTables path
			document.getElementById('tuning-list').appendChild(div); // Append div to Tuning List

			var p = document.createElement('p'); // Create header <p>
			p.innerHTML = key; // Fill header with NetworkTablesID
			div.appendChild(p); // Append header to container

			var input = document.createElement('input') // Create field <input>
			input.name = id_name; // Set field name  to id_name variable
			input.value = value; // Set field value to NetworkTables value

			// Determine type of input
			if (value === true || value === false) { // Is it a boolean value?
				input.type = 'checkbox';
				input.checked = value; // value property doesn't work on checkboxes, we'll need to use the checked property instead
			} else if (!isNaN(value)) { // Is the value not not a number? Great!
				input.type = 'number';
			} else { // Just use a text if there's no better manipulation method
				input.type = 'text';
			}

			// Create listener for input value being modified
			input.onchange = function() {
				switch (input.type) { // Figure out how to pass data based on data type
					case 'checkbox':
						// For booleans, send bool of whether or not checkbox is checked
						NetworkTables.setValue(key, input.checked);
						break;
					case 'number':
						// For number values, send value of input as an int.
						NetworkTables.setValue(key, parseInt(input.value));
						break;
					case 'text':
						// For normal text values, just send the value.
						NetworkTables.setValue(key, input.value);
						break;
				}
			}

			div.appendChild(input) // Append field to container

		}
	} else {
		var input = $('#' + id_name + ' > input')

		if (input) {
			if (input.type === 'checkbox') {
				input.checked = value
			} else {
				input.value = value;
			}
		} else {
			console.log('ERROR: Variable ' + key + ' not new, but not present in Tuning List.')
		}
	}
}
