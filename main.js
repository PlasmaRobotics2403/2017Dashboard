'use strict';

const electron = require('electron');

// Module to control application life.
const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

// Define global reference to the python server (which we'll start next).
let server;

// Start python server. 
if (process.platform === 'win32') {
	// If on Windows, use the batch command (py -3 ./server.py).
	server = require('child_process').spawn('py', ['-3', '-m', 'pynetworktables2js', '--robot','roborio-2403-frc.local']);
} else {
	// Modded to support pyenv / virtualenv and it's python shims over the standard python (which would normally be 2.7 most of the time)
	// If on unix-like/other OSes, use bash command (python ./server.py).
	server = require('child_process').spawn('python', ['-m', 'pynetworktables2js', '--robot','roborio-2403-frc.local']);
}

function createWindow() {

	console.log('\nTornado Server Initialized:  Creating Dashboard Window...\n')

	// Create the browser window.
	mainWindow = new BrowserWindow({
		width: 1366,
		height: 528,
		show: false,
		frame: false,
	});

	// Move window to top (left) of screen.
	mainWindow.setPosition(0, 0);

	// Load window.
	mainWindow.loadURL('http://localhost:8888');

	// Once the python server is ready, load window contents.
	mainWindow.once('ready-to-show', function() {
		mainWindow.show();
	});

    // Remove menu
    mainWindow.setMenu(null);

	// Emitted when the window is closed.
	mainWindow.on('closed', function() {
		// Dereference the window object, usually you would store windows
		// in an array if your app supports multi windows, this is the time
		// when you should delete the corresponding element.
		mainWindow = null;
	});

	return mainWindow;
}

// This function will be called upon app-ready.  After waiting for approximately
// 1.5 seconds, this will initialize the driver station window.  This should give
// proper time for the python tornado server to load and display the dashboard page.
function waitForServer() {
	console.log('\n\nWaiting for Python Tornado Server to finish loading...\n')
	setTimeout(function() {
		mainWindow = createWindow();
		global.mainWindow = mainWindow;
		mainWindow.setBounds({x: 0, y: 0, width: electron.screen.getPrimaryDisplay().size.width, height: 528}, true)
	}, 1500)
}

// This method will be called when Electron has finished
// initialization and is ready to create the dashboard window.
// Window Creation will be delayed for python server initialization times
app.on('ready', function() {
	waitForServer();
	global.powerBlocker = electron.powerSaveBlocker.start('prevent-display-sleep');

});

// Quit when all windows are closed.
app.on('window-all-closed', function() {
	// On OS X it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q.
    // Not like we're creating a consumer application though.
    // Let's just kill it anyway.

    // If you want to restore the standard behavior, uncomment the next line.
    // if (process.platform !== 'darwin')

    app.quit();
});

app.on('quit', function() {
    console.log('\nApplication quit. Killing Tornado Server.');
	electron.powerSaveBlocker.stop(global.powerBlocker)

    // Kill tornado server child process.
    server.kill('SIGINT');
});

app.on('activate', function() {
	// On OS X it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (mainWindow === null) {
		createWindow();
	}
});
