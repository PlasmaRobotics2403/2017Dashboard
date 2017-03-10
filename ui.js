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

Number.prototype.map = function (in_min, in_max, out_min, out_max) { // Map values from one range to another
  return (this - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

// Default Value Setting

// Load Camera Module
cameraURL = "url('http://roborio-2403-frc.local:1182/stream.mjpg')";
function reloadCamera() {
	camera = $('#camera')
	camera.css('background-image', 'none');
	window.stop();
	camera.css('background-image', cameraURL);
}
setTimeout(reloadCamera, 1000);


// Interaction Hooks for Elements

$('#bar-close').click(function() {
	electron_remote.getGlobal('server').kill('SIGINT');
	electron_app.quit();
});

$('#bar-reload').click(function() {
	electron_remote.getGlobal('server').kill('SIGINT');
	electron_app.relaunch();
	electron_app.quit();
});

$('#bar-position').click(function() {
	current_window = electron_remote.getGlobal('mainWindow')
	display_width = electron.screen.getPrimaryDisplay().size.width
	current_window.setBounds({x: 0, y: 0, width: display_width, height: 528}, true)
	//current_window.setPosition(0,0,true)
	//current_window.setSize(display_width, 528, true)
});

$('#bar-developer').click(function() {
	current_window = electron_remote.getGlobal('mainWindow')
	current_window.toggleDevTools();
});

$('#bar-tuning').click(function() {
	$('#panel-main').toggleClass('tuning');
});

$('#camera').click(reloadCamera);

$('#tuning-button-set').click(function() {
	if ($('#tuning-name').val() && $('#tuning-value').val()) {
		NetworkTables.setValue($('#tuning-name').val(), $('#tuning-value').val());
	} else {
		console.log('User attempted to set a NetworkTables value without a valid Key and Value.');
	}
});

$('#tuning-button-get').click(function() {
	if ($('#tuning-name').val()) {
		$('#tuning-value').val(NetworkTables.getValue($('#tuning-name').val()));
	}
});


// Widget Loading and Registry

var widgets = [] // Array to store parsed widget information

// Gauge Widget
setTimeout(function() { $('.widget-gauge').each(function() {

	// Pull data about widget
	var address = $(this).attr('data-address');
	var bottom = $(this).attr('data-bottom');
	var top = $(this).attr('data-top');

	// Fix Network Tables path if incorrectly formatted
	if (!address.startsWith('/')) {
		address = '/' + address;
	}

	// If top and bottom not defined, set at default values
	if (bottom === undefined) {
		bottom = -1;
	}

	if (top === undefined) {
		top = 1;
	}

	// Create inner DIV
	var inner = $('<div class=\'widget-gauge-bar\'></div>'); // Create Numerical bar object

	// Get initial value of Network Tables Field
	var network_value = NetworkTables.getValue(address);

	// Initialize Content based on Network Tables Return
	if (network_value === undefined) {
		inner.css('width', '50%'); // Set Failure Width to 50%
	} else {
		var raw_position = parseFloat(network_value)
		var percent_position = raw_position.map(parseFloat(bottom), parseFloat(top), 0, 100);

		if (percent_position > 100) {
			percent_position = 100;
		} else if (percent_position < 0) {
			percent_position = 0;
		}

		inner.css('width', percent_position + '%')
	}

	// Append inner to DOM objefct
	$(this).append(inner);

	// Create Marker for showing Zero position
	var tick = $('<div class=\'widget-gauge-tick\'></div>'); 

	// Format Marker depending on position of 0 within defined axis
	var num_tick_pos = 0;
	var act_tick_pos = num_tick_pos.map(parseFloat(bottom), parseFloat(top), 0, 100);

	// Append Marker only if it is within the range of the axis
	if (act_tick_pos > 0 && act_tick_pos < 100) {
		tick.css('left', act_tick_pos + '%');
		$(this).append(tick);
	}

	// Assemble Widget Data Array
	var data = {
		object: $(this),
		address: address,
		type: 'gauge',
		lower: parseFloat(bottom),
		upper: parseFloat(top)
	};

	// Push widget to Widget Array
	if (!(address === undefined)) {
		widgets[address] = data;
	}
}); }, 250);

// Field Widget
setTimeout(function() { $('.widget-field').each(function() {

	// Pull data about widget
	var address = $(this).attr('data-address');
	var type = $(this).attr('type');
	var default_value = $(this).attr('data-default');

	// Set placeholder to undefined in case of no value from Network Tables
	$(this).attr('placeholder', 'undefined'); 

	// Get default NetworkTables value
	var network_value = NetworkTables.getValue(address);

	// Check for Boolean Strings in Network Tables Values and Default Value
	if (network_value == 'true') { 
		network_value = true; 
	} else if (network_value == 'false') {
		network_value = false;
	}

	if (default_value == 'true') { 
		default_value = true; 
	} else if (default_value == 'false') {
		default_value = false;
	}

	// Set inital value of field based on Network Tables value
	if (type === 'number') {
		$(this).val(parseFloat(network_value));
	} else if (type === 'checkbox') {
		if (network_value === true || network_value === false) {
			$(this).prop('checked', network_value)
		}
	} else {
		$(this).val(network_value);
	}

	if (network_value === undefined && default_value != undefined) {
		if (type === 'number') {
			$(this).val(parseFloat(default_value));
		} else if (type === 'checkbox') {
			if (default_value === true || default_value === false) {
				$(this).prop('checked', network_value)
			}
		} else {
			$(this).val(network_value);
		}

		switch(type) {
			case 'checkbox':
				NetworkTables.setValue(address, String(default_value));
				break;
			case 'number':
				NetworkTables.setValue(address, String(default_value));
				break;
			case 'text':
				NetworkTables.setValue(address, String(default_value));
				break;
		}
	}

	// Assemble Widget Data Array
	var data = {
		object: $(this),
		address: address,
		type: 'field-' + type
	}

	// Push widget to Widget Array
	if (!(address === undefined) && (type === 'text' || type === 'number' || type === 'checkbox')) {
		widgets[address] = data;
	}

	// Bind event to push values to Network Tables on update
	$(this).change(function() {
		input_type = $(this).attr('type')
		address = $(this).attr('data-address')

		switch(input_type) {
			case 'checkbox':
				NetworkTables.setValue(address, String($(this).prop('checked')));
				break;
			case 'number':
				NetworkTables.setValue(address, String($(this).val()));
				break;
			case 'text':
				NetworkTables.setValue(address, String($(this).val()));
				break;
		}
	});

}); }, 250);

setTimeout(function() { $('.widget-boolean').each(function() {

	// Gather information about widget
	var address = $(this).attr('data-address');

	// Get default NetworkTables value
	var network_value = NetworkTables.getValue(address);

	// Assemble Widget Data Array
	var data = {
		object: $(this),
		address: address,
		type: 'boolean'
	}

	// Register click event to toggle Network Tables Value
	$(this).click(function() {
		address = $(this).attr('data-address');
		network_value = NetworkTables.getValue(address);

		if (network_value === 'true') {
			NetworkTables.setValue(address, 'false');
		} else {
			NetworkTables.setValue(address, 'true');
		}
	})

	// Push to Widget Array
	if (address != undefined) {
		widgets[address] = data;
	}

}); }, 250);


// Handle Updates
function updateWidget(key, value, search_string) {

	search_key = search_string + key;

	if (search_key in widgets) {
		var widgetInformation = widgets[search_key];

		switch(widgetInformation.type){
			case 'gauge':
				var raw_position = parseFloat(value);
				var percent_position = raw_position.map(widgetInformation.lower, widgetInformation.upper, 0, 100);
				
				if (percent_position > 100) {
					percent_position = 100;
				} else if (percent_position < 0) {
					percent_position = 0;
				}

				widgetInformation.object.find('.widget-gauge-bar').css('width', percent_position + '%');
				break;
			
			case 'field-number': 
				widgetInformation.object.val(parseFloat(value));
				break;

			case 'field-text':
				widgetInformation.object.val(String(value));
				break;

			case 'field-checkbox':
				if (value === true || value === false) {
					widgetInformation.object.prop('checked', value);
				}
				break;

			case 'boolean':
				if (value === true) {
					widgetInformation.object.removeClass('true');
				} else if (value === false) {
					widgetInformation.object.addClass('true');
				}
				break;
		}
	}
}


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


		default:
			updateWidget(key, value, '');
			updateWidget(key, value, 'tuning-');
	}

	// Tuning - other network Tables values
	// REMOVE THIS: id_name = 'val' + key.replaceAll('/', '-_-').replaceAll(' ', '_-_')
	if (isNew) {
		if (key.substring(0,17) != '/CameraPublisher/' && key.substring(0,12) != '/LiveWindow/') {
			var container = $('<div></div>'); // Create container object for value tuning block
			container.attr('data-address', key); // Set data-address of container to make it easier to find in the DOM for debugging purposes

			var header = $('<p></p>'); // Create header object, to place inside container
			header.text(key); // Set content of header to match network tables key
			container.append(header); // Append header to container

			var input = $('<input></input>'); // Create Field object
			input.attr('data-address', key); // Set data-address for consistancy with other fields throughout dashboard

			// Type Variable
			type = null;

			// Determine type of input
			if (value === true || value === false) { // If: BOOLEAN
				input.attr('type', 'checkbox');
				input.prop('checked', value);
				type = 'checkbox'
			} else if (!isNaN(value)) { // If: NUMBER
				input.attr('type', 'number');
				input.val(parseFloat(value))
				type = 'number'
			} else { // If: TEXT or ANYTHING ELSE
				input.attr('type', 'text')
				input.val(value)
				type = 'text'
			}

			container.append(input);
			$('#tuning-list').append(container);

			input.change(function() {
				input_type = input.attr('type')
				address = input.attr('data-address')

				switch(input_type) {
					case 'checkbox':
						NetworkTables.setValue(address, String(input.prop('checked')));
						break;
					case 'number':
						NetworkTables.setValue(address, String(input.val()));
						break;
					case 'text':
						NetworkTables.setValue(address, String(input.val()));
						break;
				}
			});

			// Assemble Widget Data Array
			var data = {
				object: input,
				address: key,
				type: 'field-' + type
			}

			// Push widget to Widget Array
			if (!(key === undefined) && (type === 'text' || type === 'number' || type === 'checkbox')) {
				widgets['tuning-' + key] = data;
			}
		}
	}
}