// Copyright 2011 David Galles, University of San Francisco. All rights reserved.
//
// Redistribution and use in source and binary forms, with or without modification, are
// permitted provided that the following conditions are met:
//
// 1. Redistributions of source code must retain the above copyright notice, this list of
// conditions and the following disclaimer.
//
// 2. Redistributions in binary form must reproduce the above copyright notice, this list
// of conditions and the following disclaimer in the documentation and/or other materials
// provided with the distribution.
//
// THIS SOFTWARE IS PROVIDED BY David Galles ``AS IS'' AND ANY EXPRESS OR IMPLIED
// WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
// FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> OR
// CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
// CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
// SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
// ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
// NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF
// ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
// The views and conclusions contained in the software and documentation are those of the
// authors and should not be interpreted as representing official policies, either expressed
// or implied, of the University of San Francisco

const MIN_BUCKET_CAPACITY = 2;


const DIRECTORY_X_START = 200;
const DIRECTORY_Y_START = 40;

const DIRECTORY_WIDTH = 30;
const DIRECTORY_HEIGHT = 25;

const SPACING = 250;

const BUCKET_X_START = DIRECTORY_X_START + DIRECTORY_WIDTH + SPACING;
const BUCKET_Y_START = DIRECTORY_Y_START;

const BUCKET_WIDTH_PER_ENTRY = 50;
const BUCKET_HEIGHT = DIRECTORY_HEIGHT - 5;

const COLOR_BLUE = "#0000FF";
const COLOR_BLACK = "#000000";

function EH(am, w, h)
{
	this.init(am, w, h);
}

EH.prototype = new Algorithm();
EH.prototype.constructor = EH;
EH.superclass = Algorithm.prototype;

EH.prototype.init = function(am, w, h)
{
	// Call the unit function of our "superclass", which adds a couple of
	// listeners, and sets up the undo stack
	EH.superclass.init.call(this, am, w, h);
	
	this.addControls();
	
	// Useful for memory management
	this.nextIndex = 0;

	this.setup();
}

EH.prototype.setup = function () 
{
	this.BUCKET_CAPACITY = MIN_BUCKET_CAPACITY;

	this.explainLabel = this.nextIndex++;

	this.commands = [];
	this.cmd("CreateLabel", this.explainLabel, "initial state", 30, 30, 0);

	this.animationManager.StartNewAnimation(this.commands);
	this.animationManager.skipForward();
	this.animationManager.clearHistory();
}


EH.prototype.addControls =  function()
{
	this.controls = [];

	this.insertField = addControlToAlgorithmBar("Text", "");
	this.insertField.onkeydown = this.returnSubmit(this.insertField,  
																						this.insertCallback.bind(this), // callback to make when return is pressed
																						4,                     // integer, max number of characters allowed in field
																						true);                        // boolean, true of only digits can be entered.
	this.controls.push(this.insertField);

	this.insertButton = addControlToAlgorithmBar("Button", "Insert");
	this.insertButton.onclick = this.insertCallback.bind(this);
	this.controls.push(this.insertButton);

	this.deleteField = addControlToAlgorithmBar("Text", "");
	this.deleteField.onkeydown = this.returnSubmit(this.deleteField, 
		this.deleteCallback.bind(this), 4, true);
	this.controls.push(this.deleteField);
	
	this.deleteButton = addControlToAlgorithmBar("Button", "Delete");
	this.deleteButton.onclick = this.deleteCallback.bind(this);
	this.controls.push(this.deleteButton);

	this.clearButton = addControlToAlgorithmBar("Button", "Clear");
	this.clearButton.onclick = this.clearCallback.bind(this);
	this.controls.push(this.clearButton);

	this.bucketCapacityButtons = addRadioButtonGroupToAlgorithmBar(
		[
			"Entries per bucket: 2",		// MIN_BUCKET_CAPACITY
			"Entries per bucket: 3",
	 		"Entries per bucket: 4"
		], 
		"Entries per bucket");
	
	this.bucketCapacityButtons[0].checked = true;		// Default bucket capacity = 2
	
	for (i = 0; i < this.bucketCapacityButtons.length; i++) {
		this.bucketCapacityButtons[i].onclick = 
					this.bucketCapacityChangedHandler.bind(this, i + MIN_BUCKET_CAPACITY);
		this.controls.push(this.bucketCapacityButtons[i]);
	}
}


EH.prototype.reset = function()
{
	// Reset all of your data structures to *exactly* the state they have immediately after the init
	// function is called.  This method is called whenever an "undo" is performed.  Your data
	// structures are completely cleaned, and then all of the actions *up to but not including* the
	// last action are then redone.  If you implement all of your actions through the "implementAction"
	// method below, then all of this work is done for you in the Animation "superclass"
	
	this.nextIndex = 1;
	this.directory = null;
}

EH.prototype.disableUI = function(event)
{
	for (var i = 0; i < this.controls.length; i++)
	{
		this.controls[i].disabled = true;
	}
}

EH.prototype.enableUI = function(event)
{
	for (var i = 0; i < this.controls.length; i++)
	{
		this.controls[i].disabled = false;
	}
}

EH.prototype.bucketCapacityChangedHandler = function(newCapacity, event) 
{
	if (this.BUCKET_CAPACITY != newCapacity)
	{
		this.implementAction(this.changeBucketCapacity.bind(this), newCapacity);
	}
}

EH.prototype.changeBucketCapacity = function(newCapacity)
{
	this.commands = [];
	this.bucketCapacityButtons[newCapacity - MIN_BUCKET_CAPACITY].checked = true;
	this.setExplain(`Now storing ${newCapacity} entries per bucket`);
	this.insertField.value = "";
	this.clearAllGraphics();

	this.BUCKET_CAPACITY = newCapacity;
	this.directory = null;
	this.nextIndex = 1;

	return this.commands;
}

EH.prototype.clearAllGraphics = function() 
{
	if (!this.directory) return;

	for (const bucket of this.directory) {
		this.cmd("Delete", bucket.graphicId);
	}
	for (const dirEntry of this.directoryGraphics) {
		this.cmd("Delete", dirEntry[0]);
		this.cmd("Delete", dirEntry[1]);
	}
	this.cmd("Delete", this.globalDepthGraphicId);
}


EH.prototype.setExplain = function(text) {
	this.cmd("SetText", this.explainLabel, text);
}

EH.prototype.getBucketWidth = function() {
	return BUCKET_WIDTH_PER_ENTRY * this.BUCKET_CAPACITY;
}

EH.prototype.insertCallback = function(event)
{
	// Get value to insert from textfield (created in addControls above)
	var insertedValue = this.insertField.value;
	if (insertedValue === "") return;

	// Clear text field after operation
	this.insertField.value = "";
	// Do the actual work. The function implementAction is defined in the algorithm superclass
	this.implementAction(this.insert.bind(this), insertedValue);
}


EH.prototype.insert = function(value)
{
	this.commands = [];
	if (!this.directory) {		// Initialize the directory on 1st insertion
		this.initDirectory();
	}

	this.insertRecursive(value);
	return this.commands;
}

EH.prototype.insertRecursive = function(value)
{
	this.setExplain(`Inserting element: ${value}.\nBinary ${parseInt(value).toString(2)}`);

	const toggleHighlight = (dir, buc, v) => {
		this.cmd("SetHighlight", dir, v);
		this.cmd("SetEdgeHighlight", dir, buc, v);
		this.cmd("SetHighlight", buc, v);
		this.cmd("Step");
	}

	const bucketIndex = this.getBucketIndex(value);
	const bucket = this.directory[bucketIndex];
	const dirEntryId = this.directoryGraphics[bucketIndex][0];
	
	// Turn on highlights
	toggleHighlight(dirEntryId, bucket.graphicId, 1);

	if (bucket.isFull()) {
		console.log("oops full!");
		this.setExplain("Bucket is full");
		toggleHighlight(dirEntryId, bucket.graphicId, 0);
		
		if (bucket.localDepth === this.globalDepth) {
			this.doubleDirectory();
		}
		const newBucket = this.split(bucket);
		this.redistributePointers(bucketIndex, newBucket);

		console.log("retry insert" + String(value));
		this.insertRecursive(value); 	// Retry insertion after split
		return;
	}

	bucket.insert(value);
	this.cmd("SetText", bucket.graphicId, value, bucket.data.length-1);
	this.cmd("Step");

	// Turn off the highlights
	toggleHighlight(dirEntryId, bucket.graphicId, 0);
	this.cmd("SetText", this.explainLabel, "");
}

/* 
 * ===========================================
 *     Helper functions for Insertion
 * ===========================================
 */

EH.prototype.getBucketIndex = function(value) {
	const mask = (1 << this.globalDepth) - 1; // Create a mask for the relevant bits
	return value & mask; // Apply the mask to get the index
}

EH.prototype.doubleDirectory = function() {
	this.setExplain('Double directory...');
	
	const currLength = this.directory.length;
	// Double the logic-side directory
	for (let i = 0; i < currLength; i++) {
		this.directory.push(this.directory[i]);
	}
	// Double the graphic-side directory
	for (let i = 0; i < currLength; i++) {
		const dirEntryId = this.nextIndex++;
		const dirEntryBucketNumber = this.nextIndex++;
		this.directoryGraphics.push( [dirEntryId, dirEntryBucketNumber] );

		this.cmd("CreateRectangle", dirEntryId,
			"", DIRECTORY_WIDTH, DIRECTORY_HEIGHT, DIRECTORY_X_START, DIRECTORY_Y_START + (i+currLength)*DIRECTORY_HEIGHT);
		this.cmd("CreateLabel", dirEntryBucketNumber, "", 
			DIRECTORY_X_START-DIRECTORY_WIDTH, DIRECTORY_Y_START + (i+currLength)*DIRECTORY_HEIGHT);
		
		// Duplicate the pointer
		const curBucketId =	this.directory[i].graphicId;
		this.cmd("Connect", dirEntryId, curBucketId);
	}
	// Update the directory's binary bucket number
	for (let i = 0; i < currLength*2; i++) {
		const label = this.directoryGraphics[i][1];
		this.cmd("SetText", label, parseInt(i).toString(2).padStart(this.globalDepth+1, "0"));	// Prefix 0
	}
	this.cmd("Step");

	// Update the global depth
	this.globalDepth++;
	this.cmd("SetHighlight", this.globalDepthGraphicId, 1);
	this.cmd("SetText", this.globalDepthGraphicId, `d = ${this.globalDepth}`);
	this.cmd("Step");
	this.cmd("SetHighlight", this.globalDepthGraphicId, 0);
	this.cmd("Step");
}

EH.prototype.split = function(bucket) {
	bucket.localDepth++;
	const newBucket = new Bucket(this.nextIndex++, bucket.localDepth, this.BUCKET_CAPACITY);
	const middleBit = 1 << (bucket.localDepth-1);

	this.setExplain("Split bucket...");

	this.cmd("CreateLinkedList", newBucket.graphicId, "",
		this.getBucketWidth(), BUCKET_HEIGHT, 0, 0,
		0.1,	// % of the linkedlist element width taken up by the outgoing pointer
		0, 		// false = horizontal list
		1, 		// pointer to appear at the right of the element
		this.BUCKET_CAPACITY
	);
	this.cmd("SetNull", newBucket.graphicId, 1);

	// Put the split image next to the old bucket
	this.cmd("SetPosition", newBucket.graphicId, bucket.x + this.getBucketWidth() + 25, bucket.y);
	this.cmd("SetHighlight", bucket.graphicId, 1);
	this.cmd("SetHighlight", newBucket.graphicId, 1);
	this.cmd("Step");

	/* Helper: Animate the movement of bucket.data[i] to newBucket */
	const animateMove = (idx) => {
		this.cmd("SetTextColor", bucket.graphicId, COLOR_BLUE, idx);		// Color blue the old entry
		this.cmd("Step");
		this.cmd("SetText", newBucket.graphicId, bucket.data[idx], newBucket.data.length-1);		// Add new entry
		this.cmd("SetText", bucket.graphicId, "", idx);				// Delete old entry
		this.cmd("SetTextColor", bucket.graphicId, COLOR_BLACK, idx)		// Turn off color blue
		this.cmd("SetTextColor", newBucket.graphicId, COLOR_BLUE, newBucket.data.length-1);		// Color blue new entry
		this.cmd("Step");
		this.cmd("SetTextColor", newBucket.graphicId, COLOR_BLACK, newBucket.data.length-1)		// Turn off color blue
	}
	
	// Redistribute data entries
	const newData = [];

	for (let i = 0; i < bucket.data.length; i++) {
		const val = bucket.data[i];
		if ((val & middleBit) === 0) { // Check the (localDepth)th bit
			newData.push(val);
		} else {
			newBucket.data.push(val);
			animateMove(i);
		}
	}

	this.cmd("Step");
	// Since entries may have moved, "compress" the entries in the old bucket
	if (newBucket.data.length === 0) {
		this.setExplain("No entries redistributed!")
	} 
	else {
		for (let i = 0; i < newData.length; i++) {
			this.cmd("SetText", bucket.graphicId, newData[i], i);
		}
		for (let j = newData.length; j < bucket.capacity; j++) {
			this.cmd("SetText", bucket.graphicId, "", j);
		}
		this.cmd("Step");
	}

	this.cmd("SetHighlight", bucket.graphicId, 0);
	this.cmd("SetHighlight", newBucket.graphicId, 0);
	this.cmd("Step");

	bucket.data = newData;

	return newBucket;
}

EH.prototype.redistributePointers = function(oldBucketIndex, newBucket) 
{
	this.setExplain("Redistribute pointers...");
	const oldBucket = this.directory[oldBucketIndex];

	// Logic-side: update directory
	const bucketCurrentLocalDepth = oldBucket.localDepth;
	const mask = (1 << bucketCurrentLocalDepth) - 1;  // Last (bucketCurrentLocalDepth) bits

	const oldBucketBits = oldBucketIndex & ((1<<(bucketCurrentLocalDepth-1))-1);  // Last (bucketCurrentLocalDepth-1) bits of the index number
	var newBucketBits = 1<<(bucketCurrentLocalDepth-1);
	newBucketBits += oldBucketBits; // Prepend 1 to oldBucketBits

	var changedIndices = [];
	for (let i = 0; i < this.directory.length; i++) {
		if ((i & mask) === oldBucketBits) {
			this.directory[i] = this.directory[oldBucketIndex];
		}
		if ((i & mask) === newBucketBits) {
			this.directory[i] = newBucket;
			changedIndices.push(i);
			console.log(i.toString(2).padStart(4, "0"));
		}
	}

	// Graphic-side: Animate the pointer redistribution

	for (const i of changedIndices) {		// Highlight edges to be disconnected
		const dirEntryId = this.directoryGraphics[i][0];
		this.cmd("SetHighlight", dirEntryId, 1);
		this.cmd("SetEdgeHighlight", dirEntryId, oldBucket.graphicId, 1);
		this.cmd("Step");
	}
	for (const i of changedIndices) {		// Disconnect & Connect to new bucket 
		const dirEntryId = this.directoryGraphics[i][0];
		this.cmd("Disconnect", dirEntryId, oldBucket.graphicId);
		this.cmd("Connect", dirEntryId, newBucket.graphicId);
		this.cmd("SetEdgeHighlight", dirEntryId, newBucket.graphicId, 1);
		this.cmd("Step");
	}

	// Move the new bucket to a "nicer" position, 
	// next to the first directory entry pointing to it.
	const firstEntry = changedIndices[0];
	newBucket.x = BUCKET_X_START;
			// TODO make it slightly off with DIRECTORY_HEIGHT+3 ?
	newBucket.y = BUCKET_Y_START + firstEntry * (DIRECTORY_HEIGHT);	
	this.cmd("Move", newBucket.graphicId, newBucket.x, newBucket.y);
	this.cmd("Step");
	
	// Turn off highlighting
	for (const i of changedIndices) {
		const dirEntryId = this.directoryGraphics[i][0];
		this.cmd("SetHighlight", dirEntryId, 0);
		this.cmd("SetEdgeHighlight", dirEntryId, newBucket.graphicId, 0);
	}
	this.cmd("Step");
}

EH.prototype.initDirectory = function() {
	this.globalDepth = 0;
	this.directory = [];
	this.directoryGraphics = [];

	// Create the global depth label
	this.globalDepthGraphicId = this.nextIndex++;
	this.cmd("CreateLabel", this.globalDepthGraphicId, "d = 0",
		DIRECTORY_X_START, DIRECTORY_Y_START - DIRECTORY_HEIGHT*0.75);

	// Create one empty bucket
	const bucket = new Bucket(this.nextIndex++, 0, this.BUCKET_CAPACITY);
	this.directory.push(bucket);
	this.cmd("CreateLinkedList", bucket.graphicId, "",
		this.getBucketWidth(), BUCKET_HEIGHT, BUCKET_X_START, BUCKET_Y_START, 
		0.1, 	// % of the linkedlist element width taken up by the outgoing pointer
		0, 	// false = horizontal list
		1, 	// pointer to appear at the right of the element
		this.BUCKET_CAPACITY);	// number of labels in this element
	
		// Remember the coordinates (will be used to position the split bucket during a split)
	bucket.x = BUCKET_X_START;
	bucket.y = BUCKET_Y_START;
	// Put a slash at the end, since no overflow page
	this.cmd("SetNull", bucket.graphicId, 1);

	// Create one directory entry
	const dirEntryId = this.nextIndex++;
	const dirEntryBucketNumber = this.nextIndex++;

	// Each entry is a pair of [directory rectangle ID, bucket number label ID]
	this.directoryGraphics.push( [dirEntryId, dirEntryBucketNumber] );

	this.cmd("CreateRectangle", dirEntryId,
		"", DIRECTORY_WIDTH, DIRECTORY_HEIGHT, DIRECTORY_X_START, DIRECTORY_Y_START);
	this.cmd("CreateLabel", dirEntryBucketNumber, "", 
		DIRECTORY_X_START-DIRECTORY_WIDTH, DIRECTORY_Y_START);

	// Directory points to the bucket
	this.cmd("Connect", dirEntryId, bucket.graphicId);
	this.cmd("Step");
}

/* 
 * =================================================
 *     End: 		Helper functions for Insertion 
 * =================================================
 */


EH.prototype.deleteCallback = function(event)
{
	var deletedValue = this.deleteField.value;
	if (deletedValue === "") return;
	
	this.deleteField.value = "";
	this.implementAction(this.delete.bind(this), deletedValue);
}

EH.prototype.delete = function(value) 
{
	this.commands = [];
	if (!this.directory) return this.commands;

	const bucketIndex = this.getBucketIndex(value);
	const bucket = this.directory[bucketIndex];
	
	if (!bucket.data.includes(value)) {
		this.setExplain(`Element ${value} not found`);
		return this.commands;
	}
	
	this.setExplain(`Deleting ${value}...`);
	return this.commands;		// TODO	
}


EH.prototype.clearCallback = function(event)
{
	this.implementAction(this.clear.bind(this), "");
}

EH.prototype.clear = function() 
{
	this.commands = [];
	this.clearAllGraphics();
	this.directory = null;
	this.nextIndex = 1;
	return this.commands;
}


var currentAlg;

function init()
{
	var animManag = initCanvas();
	currentAlg = new EH(animManag, canvas.width, canvas.height);
	
}