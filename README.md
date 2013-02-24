#Harissa

	Video Porridge

	Probably the most inefficient way to do frame-by-frame video remixing

###Prerequisites
 - node.js
 - imagemagick
 - mplayer2
 - mencoder
  
###How it works

 - You give it a video file
 - It extracts the images into frames on the server
 - It runs the the frame remixer on the client for each frame
 - It merges the remixed frames back together as a video
 
###Caveats
	I've only tested this on Ubuntu 12.04, node v0.08.20, and Chromium 22

	Lots of things are still manual.

	If you actually want to use this and need help, contact me!
	
###### *Made with love by Max Irwin (http://binarymax.com)*