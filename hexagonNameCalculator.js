// copyright (c) 2016 Mark Butler

/**
* HexagonNameCalculator
* It's purpose is to provide a hexagon name.
* It can convert it's x,y coordinate into a hexagon name
* It can convert it's hexagon name into a x,y coordinate
*
* @class HexagonNameCalculator
* @constructor
*/

function HexagonNameCalculator(map) {
	this.map = map;
	this.x = 0;								// the coordinate for the hexagon
	this.y = 0;
	this.name = '';						//  name of hexagon, like 1208 note: this is a string type,  4 char string
	this.displayName = '';		// name of hexagon if using a viewport.  viewport is a rectangle on map.
														//  if the hexagon is within the viewport, the name is displayed

	this.mapViewPort = map.mapViewPort;
}

/**
* method to get display hexagon name
*
* @method getDisplayName
* @return {string} display hexagon name
*/
HexagonNameCalculator.prototype.getDisplayName = function() {
	return this.displayName;
}

/**
* method to get hexagonPoint
*
* @method getHexagonPoint
* @return {point} Point
*/
HexagonNameCalculator.prototype.getHexagonPoint = function() {
	var hexagonPoint = new Point(this.x, this.y);
	return hexagonPoint;
}

/**
* method to get hexagon name
*
* @method getName
* @return {string} hexagon name
*/
HexagonNameCalculator.prototype.getName = function() {
	return this.name;
}

/**
* method to get x coordinate
*
* @method getX
* @return {integer} x coordinate
*/
HexagonNameCalculator.prototype.getX = function() {
	return this.x;
}

/**
* method to get y coordinate
*
* @method getY
* @return {integer} y coordinate
*/
HexagonNameCalculator.prototype.getY = function() {
    return this.y;
}

/**
* method to set the mapViewPort
*
* @method setMapViewPort
* @param mapViewPort {mapViewPort} mapViewPort
*/

HexagonNameCalculator.prototype.setMapViewPort = function(mapViewPort) {
// set the hexagon name and calculate the x, y
	this.map.mapViewPort = mapViewPort;
}

/**
* method to set the x coordinate and the y coordinate of the hexagon
*
* @method setHexagonPoint
* @param {point} hexagon point
*/
HexagonNameCalculator.prototype.setHexagonPoint = function(hexagonPoint) {
// set the hexagon x,y
	var x = hexagonPoint.getX();
	var y = hexagonPoint.getY();
	this.setXY(x,y);
}

/**
* method to set the x coordinate and the y coordinate of the hexagon
*
* @method setName
* @param name {string} name
*/
HexagonNameCalculator.prototype.setName = function(name) {
// set the hexagon name and calculate the x, y
	// this works only with a 0101 wargame numbering system
	//   other wargame numbering systems will have to have a separate HexagonNameCalculator constructor

	this.name = name;

	var columnString = name.substr(0,2);
	var rowString = name.substr(2,2);

	if (isNaN(parseInt(columnString, 10)) == false && isNaN(parseInt(rowString, 10)) == false) {

 		var columnNumber = parseInt(columnString, 10);
		var rowNumber =  parseInt(rowString, 10);

		if( columnNumber < 0 || rowNumber < 0 ) {
			this.x = 0;
			this.y = 0;
		}

		this.y = 4 * rowNumber + 4;
		if ( columnNumber % 2 == 0 ) this.y += 2;
		this.x = 2 * columnNumber + 2;
	}
}

/**
* method to set the x coordinate and the y coordinate of the hexagon
*
* @method setXY
* @param x {integer} x coordinate
* @param y {integer} y coordinate
*/

HexagonNameCalculator.prototype.setXY = function(x, y) {
//  set the x, y and then calculate the name
// this works only with a 0101 wargame numbering system
//   other wargame numbering systems will have to have a separate HexagonNameCalculator constructor

	this.x = x;
	this.y = y;

	this.name = "";
	var columnNumber;
	var rowNumber;
	columnNumber = (x / 2) - 1;
	rowNumber = Math.floor(y / 4 ) - 1;

	if ( columnNumber < 0 ) {
		this.name = columnNumber.toString();
	}
	if ( columnNumber >= 0 && columnNumber < 10 ) {
		this.name = "0" + columnNumber.toString();
	}
	if ( columnNumber >= 10 ) {
		this.name += columnNumber.toString();
	}

	if ( rowNumber < 0 ) {
		this.name += rowNumber.toString();
	}
	if ( rowNumber >= 0 && rowNumber < 10 ) this.name += "0" + rowNumber.toString();
	if ( rowNumber >= 10 ) this.name += rowNumber.toString();

	if((this.map.mapViewPort == undefined) == false){
		//"mapViewPort":{"displayMinX":4,"displayMinY":8,"displayMaxX":12,"displayMaxY":24,"imageMinX":0,"imageMinY":0,"imageMaxX":14,"imageMaxY":26},
		if(this.map.mapViewPort.displayMinX <= x && this.map.mapViewPort.displayMinY <= y && x <= this.map.mapViewPort.displayMaxX && y <= this.map.mapViewPort.displayMaxY) {
			this.displayName = this.name;
		} else {
			this.displayName = '';
		}
	}
	else {
		this.displayName = this.name;
	}
}
