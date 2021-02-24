/**
*Copyright 2017-2021 Mark Butler
*
*This file is part of Hexagon Library.
*
*Hexagon Library is free software: you can redistribute it and/or modify it under the terms of the GNU Lesser General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.  You must provide attribution.
*
*Hexagon Library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
*
*You should have received a copy of the GNU Lesser General Public License along with Hexagon Library. If not, see http://www.gnu.org/licenses/

module.exports = {
	Point: Point,
	HexagonGridCalculator: HexagonGridCalculator,
	HexagonMapCalculator: HexagonMapCalculator,
	LineOfSight: LineOfSight
};
*/

function getEdgePointType(x,y){

	var type = '';
	var facingNumber = 0;
	var checkX = x + 0.5;
	checkX /= 2;
	var hexagonPointX = Math.floor(checkX);
	checkX = hexagonPointX % 2;
	hexagonPointX *= 2;
	if(checkX == 0){
		type = "odd";
	}
	else{
		type = "even";
	}

	var checkY = y + 1;
	if(type == "even") checkY += 2;
	checkY /= 4;
	var hexagonPointY = Math.floor(checkY);
	hexagonPointY *= 4;
	if(type == "even") hexagonPointY -= 2;

	var diffX = x - hexagonPointX;
	var diffY = y - hexagonPointY;

	if(diffX == 0 && diffY == -1) facingNumber = 1;
	if(diffX == 0.5 && diffY == -0.5) facingNumber = 2;
	if(diffX == 0.5 && diffY == 0.5) facingNumber = 3;
	if(diffX == 0 && diffY == 1) facingNumber = 4;
	if(diffX == -0.5 && diffY == 0.5) facingNumber = 5;
	if(diffX == -0.5 && diffY == -0.5) facingNumber = 6;

	return facingNumber;
}

/**
* Point
*
* The x, y coordinates are used to calculate line of sight, range, bearing and unit facing.
*
* @class Point
* @constructor
*/
function Point() {

	this.x = 0;
	this.y = 0;

	if ( Point.arguments.length == 1
			&& Point.arguments[0].constructor == Point ) {

		this.x = Point.arguments[0].x;
		this.y = Point.arguments[0].y;
	}

	if ( Point.arguments.length == 2
			&& Point.arguments[0].constructor == Number
			&& Point.arguments[1].constructor == Number ) {

		this.x = Point.arguments[0];
		this.y = Point.arguments[1];
	}
}

/**
* method to see if two points are the same
*
* @method Point.equals
* @memberof Point
* @param point {Point} another point
* @return {boolean} true/false
*/
Point.prototype.equals = function(point) {
		var isEqual;
		isEqual = false;

		if (this.x == point.getX() && this.y == point.getY()) {
			isEqual = true;
		}

		return isEqual;
}

/**
* method to get x coordinate of a Point
*
* @method Point.getX
* @return {integer} x coordinate
*/
Point.prototype.getX = function() {
	return this.x;
}

/**
* method to get y coordinate of a Point
*
* @method Point.getY
* @return {integer} y coordinate
*/
Point.prototype.getY = function() {

	return this.y;
}

/**
* method to set x, y coordinate of a Point
*
* @method Point.setXY
* @param x {integer} x coordinate
* @param y {integer} y coordinate
*/
Point.prototype.setXY = function(x, y) {

	this.x = x;
	this.y = y;
}

/**
* HexagonMapCalculator is an object that parses the screen's pixel coordinates into hexagon coordinates
*
* @class HexagonMapCalculator
* @constructor
*/
function HexagonMapCalculator(mapData) {

	var hexagonWidth, hexagonHeight;

	// x, y on map measured from upper left corner of visible map
	var mapPixel;
	// x, y on map measured from hexagon grid origin
	var gridPixel;
	// x, y from grid origin to upper left corner of map
	var offsetPixel;

	// points on the map calculated from mouse coordinates
	var hexagonPoint;
	var gridPoint;
	var edgePoint;
	var vertexPoint;

	// screen coordinates
	this.mapPixel = new Point();
	this.gridPixel = new Point();
	this.offsetPixel = new Point();

	// hexagon grid coordinates
	this.hexagonPoint = new Point();
	this.gridPoint = new Point();
	this.edgePoint = new Point();
	this.vertexPoint = new Point();

	if(mapData.hexagonGridDimentions != null){
		this.hexagonGridDimentions = mapData.hexagonGridDimentions;
		this.hexagonWidth = this.hexagonGridDimentions.hexagonWidth;
		this.hexagonHeight = this.hexagonGridDimentions.hexagonHeight;
		this.offsetPixel.x = this.hexagonGridDimentions.hexagonGridOffsetX;
		this.offsetPixel.y = this.hexagonGridDimentions.hexagonGridOffsetY;
	}
}

/**
* method to set the map x, y from the grid point coordinate
*
* @method calculateGridPixelAndMapPixelXY
*
*/
HexagonMapCalculator.prototype.calculateGridPixelAndMapPixelXY = function(gridPointX, gridPointY) {

	var halfHexagonColumnWidth = 3 * this.hexagonWidth / 8;
	var halfHexagonHeight = this.hexagonHeight / 2;
	var oneFourthHexagonHeight = this.hexagonHeight / 4;

	this.gridPixel.x = halfHexagonColumnWidth * gridPointX;
	this.gridPixel.y = oneFourthHexagonHeight * gridPointY;

	this.mapPixel.x = this.gridPixel.x - this.offsetPixel.x;
	this.mapPixel.y = this.gridPixel.y - this.offsetPixel.y;
}

/**
* method to calculate the gridPoint and hexagonPoint
*
* @method calculateGridPointAndHexagonPoint
*
*/
HexagonMapCalculator.prototype.calculateGridPointAndHexagonPoint = function() {

	var x, y;
	var TAU = Math.PI * 2;

	// horizontal spacing between hexagon centers
	var horizontalSpacing = 3 * this.hexagonWidth / 4;
	// add distance from (0,0) center to left edge of hexagon(0,0) to start column count
	var columnOffset = this.hexagonWidth / 2;

	var column = Math.floor((this.gridPixel.x + columnOffset) / horizontalSpacing);
	var row;
	var distanceFromLeftEdgeOfHexagon = (this.gridPixel.x + columnOffset) - (column * horizontalSpacing);

	var hexsideWidth = this.hexagonWidth / 4;
	var halfHexagonHeight = this.hexagonHeight / 2;
	var oneFourthHexagonHeight = this.hexagonHeight / 4;

	var distanceFromTopEdgeOfHexagon;

	if (distanceFromLeftEdgeOfHexagon < hexsideWidth) {		//	it's a / or \ hexside
		x = (2 * column) - 1;
		row = Math.floor(this.gridPixel.y / halfHexagonHeight);
		y = (2 * row) + 1;
		distanceFromTopEdgeOfHexagon = this.gridPixel.y - (row * halfHexagonHeight);
	}
	else {
	// it's a center or lower hexside
	x = 2 * (column);
	row = Math.floor( (this.gridPixel.y + oneFourthHexagonHeight) / halfHexagonHeight );
	y = (2 * row);
	distanceFromTopEdgeOfHexagon = this.gridPixel.y + oneFourthHexagonHeight - (row * halfHexagonHeight);
	}

	this.gridPoint.setXY(x, y);
	var hexagonGridCalculator = new HexagonGridCalculator();
	hexagonGridCalculator.setPoint(this.gridPoint);

	switch (hexagonGridCalculator.getGridPointType()) {
		case 0:
			this.hexagonPoint.setXY(x, y);
			this.edgePoint.setXY(x,y);
			this.tangent = 0;
			this.degrees = 0;
			break;

		case 4:
			if (distanceFromTopEdgeOfHexagon < oneFourthHexagonHeight) {
				this.hexagonPoint.setXY(x, y - 2);
				this.edgePoint.setXY(x, y - 1);			
			}
			else {
				this.hexagonPoint.setXY(x, y + 2);
				this.edgePoint.setXY(x, y + 1);
			}
				this.tangent = 0;
				this.degrees = 0;
				break;

			case 5:
				// check the tangent of the hexside line with tangent of the map point
				//
				// the hexside line tangent is opposite / adjacent = this.hexsideWidth / this.halfHexagonHeight
				// the map point tangent is opposite / adjacent =	this.distanceFromLeftEdgeOfHexagon / this.distanceFromTopEdgeOfHexagon
				//
				// is map point tangent <	line tangent ?
				// (this.distanceFromLeftEdgeOfHexagon / this.distanceFromTopEdgeOfHexagon) < (this.hexsideWidth / this.halfHexagonHeight)
				//
				// multiply both sides by this.halfHexagonHeight
				// (this.distanceFromLeftEdgeOfHexagon / this.distanceFromTopEdgeOfHexagon) * this.halfHexagonHeight	< (this.hexsideWidth )
				//
				// multiply both sides by this.distanceFromTopEdgeOfHexagon
				// (this.distanceFromLeftEdgeOfHexagon * this.halfHexagonHeight ) < (this.distanceFromTopEdgeOfHexagon * this.hexsideWidth)
				//
				if (distanceFromLeftEdgeOfHexagon * halfHexagonHeight < distanceFromTopEdgeOfHexagon * hexsideWidth) {
				//	______
				//	|\ |  |
				//	| \|  |
				//	|* |\ |
				//	|__|_\|
				//
					this.hexagonPoint.setXY(x - 1, y + 1);
					this.edgePoint.setXY(x - 0.5, y + 0.5);
				}
				else {
				//	______
				//	|\ |  |
				//	| \|* |
				//	|  |\ |
				//	|__|_\|
				//
					this.hexagonPoint.setXY(x + 1, y - 1);
					this.edgePoint.setXY(x + 0.5, y - 0.5);
				}
				if(distanceFromLeftEdgeOfHexagon > 0) {
					this.tangent = distanceFromTopEdgeOfHexagon / distanceFromLeftEdgeOfHexagon;
					this.degrees = Math.floor(Math.atan(this.tangent) * (360 / TAU));
				}
				else {
					this.tangent = 0;
					this.degrees = 0;
				}
				break;

			case 6:
				// check the tangent of the hexside line with tangent of the map point
				//
				// see above
				//
				//	 check from right side now
				var distanceFromRightEdgeOfHexagon = hexsideWidth - distanceFromLeftEdgeOfHexagon;
				if (distanceFromRightEdgeOfHexagon * halfHexagonHeight < distanceFromTopEdgeOfHexagon * hexsideWidth) {
				//	______
				//	|  | /|
				//	|  |/ |
				//	| /| *|
				//	|/_|_ |
				//
					this.hexagonPoint.setXY(x + 1, y + 1);
					this.edgePoint.setXY(x + 0.5, y + 0.5);
				}
				else {
				//	______
				//	|  | /|
				//	|* |/ |
				//	| /|  |
				//	|/_|_ |
				//
					this.hexagonPoint.setXY(x - 1, y - 1);
					this.edgePoint.setXY(x - 0.5, y - 0.5);
				}
				if(distanceFromRightEdgeOfHexagon > 0){
					this.tangent = distanceFromTopEdgeOfHexagon / distanceFromRightEdgeOfHexagon;
					this.degrees = Math.floor(Math.atan(this.tangent) * (360 / TAU));
				}
				else{
					this.tangent = 0;
					this.degrees = 0;
				}
				break;
	}
}

/**
* method to calculate the Vertex
*
* @method calculateVertexPoint
*
*/
HexagonMapCalculator.prototype.calculateVertexPoint = function() {

	this.vertexPoint.x = 0;
	this.vertexPoint.y = 0;
	this.vertexType = "";
	this.vertexTypeNumber = 0;

	var horizontalSpacing = 3 * this.hexagonWidth / 4;
	var vertexColumn = horizontalSpacing / 6;
	var vertexColumnAdjust = vertexColumn / 2;
	var column = Math.floor((this.gridPixel.x + vertexColumnAdjust)/ vertexColumn);
	this.vertexPoint.x = column;

	var oneFourthHexagonHeight = this.hexagonHeight / 4;
	var vertexHeightAdjust = oneFourthHexagonHeight / 2;
	this.vertexPoint.y = (Math.floor((this.gridPixel.y + vertexHeightAdjust) / oneFourthHexagonHeight)) * 3;

	this.calculateVertexType();
}

/**
* method to calculate the vertex type
*
* @method calculateVertexType
*/
HexagonMapCalculator.prototype.calculateVertexType = function() {

	this.vertexTypeNumber = (((this.vertexPoint.x % 12) / 2) + 1) * 10;
	this.vertexTypeNumber += ((this.vertexPoint.y % 12) ) + 1;
	this.vertexType = "";
	switch(this.vertexTypeNumber){
		case 27:
		case 51:
			this.vertexType = "left corner";
			break;
		case 31:
		case 67:
			this.vertexType = "right corner";
			break;
		case 20:
		case 44:
			this.vertexType = "edge";
			break;
		case 30:
		case 54:
			this.vertexType = "edge";
			break;
		case 24:
		case 60:
			this.vertexType = "edge";
			break;
		case 14:
		case 50:
			this.vertexType = "edge";
			break;
		case 40:
		case 64:
			this.vertexType = "edge";
			break;
		case 34:
		case 70:
			this.vertexType = "edge";
			break;
	}
}

/**
* method to get edgePoint
*
* @method getEdgePoint
* @return {Point}
*/
HexagonMapCalculator.prototype.getEdgePoint = function () {
	return this.edgePoint;
}

/**
* method to get Degrees
*
* @method getDegrees
* @return {int}
*/
HexagonMapCalculator.prototype.getDegrees = function () {
	return this.degrees;
}

/**
* method to get GridPixel
*
* @method getGridPixel
* @return {Point}
*/
HexagonMapCalculator.prototype.getGridPixel = function() {
	return this.gridPixel;
}

/**
* method to get GridPoint
*
* @method getGridPoint
* @return {Point}
*/
HexagonMapCalculator.prototype.getGridPoint = function() {
	return this.gridPoint;
}

/**
* method to get Hexagon Point
*
* @method getHexagonPoint
* @return {Point} hexagon
*/
HexagonMapCalculator.prototype.getHexagonPoint = function() {
	return this.hexagonPoint;
}

/**
* method to get HexagonHeight
*
* @method getHexagonHeight
* @return {int} hexagon height
*/
HexagonMapCalculator.prototype.getHexagonHeight = function() {
	return this.hexagonGridDimentions.hexagonHeight;
}

/**
* method to get HexagonWidth
*
* @method getHexagonWidth
* @return {int} hexagon width
*/
HexagonMapCalculator.prototype.getHexagonWidth = function() {
	return this.hexagonGridDimentions.hexagonWidth;
}

/**
* method to get MapPixel
*
* @method getMapPixel
* @return {Point} mapPixel
*/
HexagonMapCalculator.prototype.getMapPixel = function() {
	return this.mapPixel;
}

/**
* method to get mapPixelHexagonCornerPoint
*
* @method getMapPixelCorner
* @param {integer} direction
* @return {Point} mapPixel
*/
HexagonMapCalculator.prototype.getMapPixelHexagonCornerPoint = function(direction) {

	var hexsideWidth = this.hexagonWidth / 4;
	var halfHexagonHeight = this.hexagonHeight / 2;

	var point = new Point();

		switch(direction) {

			case 1:
				point.x = this.mapPixel.x + hexsideWidth;
				point.y = this.mapPixel.y - halfHexagonHeight;
				break;

			case 2:
				point.x = this.mapPixel.x + (2 * hexsideWidth);
				point.y = this.mapPixel.y;
				break;

				case 3:
				point.x = this.mapPixel.x + hexsideWidth;
				point.y = this.mapPixel.y + halfHexagonHeight;
				break;

				case 4:
				point.x = this.mapPixel.x - hexsideWidth;
				point.y = this.mapPixel.y + halfHexagonHeight;
				break;

				case 5:
				point.x = this.mapPixel.x - (2 * hexsideWidth);
				point.y = this.mapPixel.y;
				break;

				case 6:
				point.x = this.mapPixel.x - hexsideWidth;
				point.y = this.mapPixel.y - halfHexagonHeight;
				break;
		}
		return point;
	}

/**
* method to get tangent
*
* @method getTangent
* @return {number} tangent
*/
HexagonMapCalculator.prototype.getTangent = function() {
	return this.tangent;
}

/**
* method to get vertex point
*
* @method getVertexPoint
* @return {Point} vertexPoint
*/
HexagonMapCalculator.prototype.getVertexPoint = function() {
	return this.vertexPoint;
}

/**
 * method to get vertex type
 * 
 * @method getVertexType
 * @return {string} vertexType
 * 
 */
HexagonMapCalculator.prototype.getVertexType = function(){
	return this.vertexType;
}

/**
 * method to get vertex type number
 * 
 * @method getVertexTypeNumber
 * @return {integer} vertexTypeNumber
 * 
 */
HexagonMapCalculator.prototype.getVertexTypeNumber = function(){
	return this.vertexTypeNumber;
}

/**
* method to set the hexagon grid dimentions
*
* @method setHexagonGridDimentions
* @param {integer} x hexagon coordinate
* @param {integer} y hexagon coordinate
*/
HexagonMapCalculator.prototype.setHexagonGridDimentions = function(hexagonGridDimentions) {
	this.hexagonWidth = hexagonGridDimentions.hexagonWidth;
	this.hexagonHeight = hexagonGridDimentions.hexagonHeight;
	this.offsetPixel.x = hexagonGridDimentions.offsetPixelX;
	this.offsetPixel.y = hexagonGridDimentions.offsetPixelY;
}


/**
* method to set the edge point x, y
*
* @method setEdgePointXY
* @param {integer} x coordinate
* @param {integer} y coordinate
*/
HexagonMapCalculator.prototype.setEdgePointXY = function (x, y) {
	this.gridPoint.setXY(x, y);
	var hexagonGridCalculator = new HexagonGridCalculator();
	hexagonGridCalculator.setPoint(this.gridPoint);
	this.hexagonPoint.setXY(hexagonGridCalculator.getReferenceHexagonPoint().getX(), hexagonGridCalculator.getReferenceHexagonPoint().getY());
	this.calculateGridPixelAndMapPixelXY(x, y);
}

/**
* method to set the map x, y from the grid point coordinate
*
* @method setGridPixelXY
*
*/
HexagonMapCalculator.prototype.setGridPixelXY = function(x,y) {

	var halfHexagonColumnWidth = 3 * this.hexagonWidth / 8;
	var oneFourthHexagonHeight = this.hexagonHeight / 4;

	this.gridPixel.x = halfHexagonColumnWidth * x;
	this.gridPixel.y = oneFourthHexagonHeight * y;

	this.mapPixel.x = this.gridPixel.x - this.offsetPixel.x;
	this.mapPixel.y = this.gridPixel.y - this.offsetPixel.y;
}
/**
* method to set the grid point x, y
*
* @method setGridPointXY
* @param {integer} x coordinate
* @param {integer} y coordinate
*/
HexagonMapCalculator.prototype.setGridPointXY = function(x, y){
	this.gridPoint.setXY(x, y);
	var hexagonGridCalculator = new HexagonGridCalculator();
	hexagonGridCalculator.setPoint(this.gridPoint);
	this.hexagonPoint.setXY(hexagonGridCalculator.getReferenceHexagonPoint().getX(), hexagonGridCalculator.getReferenceHexagonPoint().getY());
	this.calculateGridPixelAndMapPixelXY(x, y);
}

/**
* method to set the hexagon x, y
*
* @method setHexagonXY
* @param {integer} x hexagon coordinate
* @param {integer} y hexagon coordinate
*/
HexagonMapCalculator.prototype.setHexagonXY = function(x, y) {
	this.hexagonPoint.setXY(x, y);
	this.gridPoint.setXY(x, y);
	this.calculateGridPixelAndMapPixelXY(x, y);
}

/**
* method to set the hexagon point	x, y
*
* @method setHexagonPointXY
* @param {integer} x hexagon coordinate
* @param {integer} y hexagon coordinate
*/
HexagonMapCalculator.prototype.setHexagonPointXY = function(x, y) {
	this.hexagonPoint.setXY(x, y);
	this.gridPoint.setXY(x, y);
	this.calculateGridPixelAndMapPixelXY(x, y);
}

/**
* method to set the hexagon width and height
*
* @method setHexagonWidthAndHeight
* @param {integer} width
* @param {integer} height
*/

HexagonMapCalculator.prototype.setHexagonWidthAndHeight = function(width, height) {
	this.hexagonWidth = width;
	this.hexagonHeight = height;
}

/**
* method to set the setMapPixelXY
*
* @method setMapPixelXY
* @param {integer} x
* @param {integer} y
*/
HexagonMapCalculator.prototype.setMapPixelXY = function(x, y) {

	this.mapPixel.x = x;
	this.mapPixel.y = y;

	// adjust for origin
	this.gridPixel.x = this.mapPixel.x + this.offsetPixel.x;
	this.gridPixel.y = this.mapPixel.y + this.offsetPixel.y;

	this.calculateGridPointAndHexagonPoint();
	this.calculateVertexPoint();
}

/**
* method to set the offset pixel
*
* @method setOffsetPixel
* @param {integer} x
* @param {integer} y
*/
HexagonMapCalculator.prototype.setOffsetPixel = function(x,y) {
	this.offsetPixel = new Point(x,y);
}

/**
* method to set the vertex
*
* @method setVertexPointWithHexagonXYandDirection
* @param {integer} x
* @param {integer} y
* @param {integer} direction
*/
HexagonMapCalculator.prototype.setVertexPointWithHexagonXYandDirection = function(x, y, direction) {
	this.setHexagonPointXY(x,y);
	var vertexPoint = this.getMapPixelHexagonCornerPoint(direction);
}

/**
* method to set the vertex point
*
* @method setVertexPointWithHexagonXYandDirection
* @param {integer} x
* @param {integer} y
*/
HexagonMapCalculator.prototype.setVertexPointXY = function(x, y) {
	var horizontalSpacing = 3 * this.hexagonWidth / 4;
	var vertexColumnSize = horizontalSpacing / 6;
	var vertexRowSize = this.hexagonHeight / 12;

	this.vertexPoint.x = x;
	this.vertexPoint.y = y;

	this.calculateVertexType();

	// calculate gridPixel
	this.gridPixel.x = vertexColumnSize * x;
	this.gridPixel.y = vertexRowSize * y;

	this.mapPixel.x = this.gridPixel.x - this.offsetPixel.x;
	this.mapPixel.y = this.gridPixel.y - this.offsetPixel.y;

	this.gridPoint.x = (x/3).toFixed(1);
	this.gridPoint.y = (y/3).toFixed(1)
}

/**
*Copyright 2018 Mark Butler
*
*This file is part of Hexagon Library.
*
*Hexagon Library is free software: you can redistribute it and/or modify it under the terms of the GNU Lesser General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
*
*Hexagon Library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
*
*You should have received a copy of the GNU Lesser General Public License along with Hexagon Library. If not, see http://www.gnu.org/licenses/.
*/

/*
function getGridPointTypeNumberFromString(s) {
	var gridPointTypeNumber = 0;

	var gridPointTypeStringArray = [];
	gridPointTypeStringArray[0] = "center";
	gridPointTypeStringArray[1] = "upper";
	gridPointTypeStringArray[2] = "upperRight";
	gridPointTypeStringArray[3] = "lowerRight";
	gridPointTypeStringArray[4] = "bottom";
	gridPointTypeStringArray[5] = "lowerLeft";
	gridPointTypeStringArray[6] = "upperLeft";

	for( var i = 0; i < gridPointTypeStringArray.length; i++ ) {
		if( gridPointTypeStringArray[i] == s ) {
			gridPointTypeNumber = i;
			break;
		}
	}
	return i;
}
*/

/**
* HexagonGridCalculator
*
* HexagonGridCalculator calculates the name of a hexagon coordinate system point
*	 and determines if it is a hexside or a hexagon center
*
* @class HexagonGridCalculator
* @constructor
*/
function HexagonGridCalculator() {
	var gridPoint;
	var gridPointType;
	var referenceHexagonPoint;

	this.gridPoint = new Point();
	this.name = "";
	this.referenceHexagonPoint = new Point();
}

/**
* method to calculate the name
*
* @method calculateReferenceHexagonPoint
*
*/
HexagonGridCalculator.prototype.calculateReferenceHexagonPoint = function() {

 	switch (this.gridPointType) {
		case 0:
			this.referenceHexagonPoint.setXY(this.x, this.y);
			break;

		case 4:
			this.referenceHexagonPoint.setXY(this.x, this.y - 2);
			break;

		case 5:
			this.referenceHexagonPoint.setXY(this.x + 1, this.y - 1);
			break;

			case 6:
			this.referenceHexagonPoint.setXY(this.x + 1, this.y + 1);
			break;
	}
}

/**
* method to calculate the gridPoint type
*
* @method calculateGridPointType
*
*/
HexagonGridCalculator.prototype.calculateGridPointType = function() {

	this.gridPointType = null;
	var modX = this.x % 4;
	var modY = this.y % 4;
	// 8 cases
	switch (modX) {
		case 0:
			switch (modY) {
				case 0:
					this.gridPointType = 0;
					break;
				case 2:
					this.gridPointType = 4;
					break;
			}
			break;

		case 1:
			switch (modY) {
				case 1:
					this.gridPointType = 6;
					break;
				case 3:
					this.gridPointType = 5;
					break;
			}
			break;

		case 2:
			switch (modY) {
				case 0:
					this.gridPointType = 4;
					break;
				case 2:
					this.gridPointType = 0;
					break;
			}
			break;

		case 3:
			switch (modY) {
				case 1:
					this.gridPointType = 5;
					break;
				case 3:
					this.gridPointType = 6;
					break;
			}
			break;
		}
	//if( this.gridPointType == null )
	//{
		//console.log("bad HexagonGridCalculator construct");
	//}
}

/**
* method to calculate the adjacent hexagon point
*
* @method getAdjacentHexagonpoint
*
* @param direction {integer} N = 1, NE = 2, SE = 3, S = 4, SW = 5, NW = 6
* @return {Point} point
*/
HexagonGridCalculator.prototype.getAdjacentHexagonPoint = function(direction) {
	// range :	HEXSIDE_DISTANCE = 1, HEXAGON_DISTANCE = 2
	return this.getAdjacentPoint(direction, 2);
}

/**
* method to calculate the adjacent grid point
*
* @method getAdjacentGridPoint
*
* @param direction {integer} N = 1, NE = 2, SE = 3, S = 4, SW = 5, NW = 6
* @return {Point} point
*/
HexagonGridCalculator.prototype.getAdjacentGridPoint = function(direction) {
	// range :	HEXSIDE_DISTANCE = 1, HEXAGON_DISTANCE = 2
	return this.getAdjacentPoint(direction, 1);
}

/**
* method to calculate the adjacent point
*
* @method getAdjacentPoint
*
* @param direction {integer} N = 1, NE = 2, SE = 3, S = 4, SW = 5, NW = 6
* @param range {integer} HEXSIDE_DISTANCE = 1, HEXAGON_DISTANCE = 2
* @return {Point} point
*/
HexagonGridCalculator.prototype.getAdjacentPoint = function(direction, range) {
	// range :	HEXSIDE_DISTANCE = 1, HEXAGON_DISTANCE = 2

	var pointXadjustment = new Array( 0,	0,	1,	1,	0, -1, -1 );
	var pointYadjustment = new Array( 0, -2, -1,	1,	2,	1, -1 );

	var pointX, pointY;
	pointX = this.x + pointXadjustment[direction] * range;
	pointY = this.y + pointYadjustment[direction] * range;

	var point = new Point(pointX, pointY);

	return point;
}

/**
* method to get GridPoint
*
* @method getGridPoint
* @return {GridPoint} gridPoint
*/
HexagonGridCalculator.prototype.getGridPoint = function() {
	return this.gridPoint;
}

/**
* method to get gridPointType
*
* @method getGridPointType
* @return {integer} gridPointType
*/
HexagonGridCalculator.prototype.getGridPointType = function() {
	return this.gridPointType;
}

/**
* method to get gridPointType CONSTANT
*
* @method getPointTypeConstant
* @return {integer} pointType CONSTANT name
*/
HexagonGridCalculator.prototype.getGridPointTypeConstant = function() {

	var gridPointTypeConstant = new Array("CENTER_HEXAGON", "UPPER_HEXSIDE", "UPPER_RIGHT_HEXSIDE", "LOWER_RIGHT_HEXSIDE", "LOWER_HEXSIDE", "LOWER_LEFT_HEXSIDE", "UPPER_LEFT_HEXSIDE");

	return gridPointTypeConstant[this.gridPointType];
}

/**
* method to get type as a string
*
* [0] "center"
* [1] "top"
* [2] "upperRight"
* [3] "lowerLeft"
* [4] "bottom"
* [5] "lowerLeft"
* [6] "upperRight"
*
* @method getGridPointTypeName
* @return {String} name of gridPointType type
*/
HexagonGridCalculator.prototype.getGridPointTypeName = function() {
	var gridPointTypeName = new Array("center", "top", "upperRight", "lowerRight", "bottom", "lowerLeft", "upperLeft");
	return gridPointTypeName[this.gridPointType];
}

/**
* method to get of reference hexagon
*
* @method getReferenceHexagon
* @return {Point}	of reference coordinate
*/
HexagonGridCalculator.prototype.getReferenceHexagonPoint = function() {
	return this.referenceHexagonPoint;
}

/**
* method to get x coordinate of gridPoint
*
* @method getX
* @return {integer} x coordinate
*/
HexagonGridCalculator.prototype.getX = function() {
	return this.x;
}

/**
* method to get y coordinate of gridPoint
*
* @method getY
* @return {integer} y coordinate
*/
HexagonGridCalculator.prototype.getY = function() {
	return this.y;
}

/**
* method to check if gridPoint is a center type
*
* @method isCenter
* @return {boolean}
*/
HexagonGridCalculator.prototype.isCenter = function() {
	var isCenter = false;

	if( this.gridPointType == 0 ) {
		isCenter = true;
	}
	return isCenter;
}

/**
* method to check if gridPoint is a hexside type
*
* @method isHexside
* @return {boolean}
*/
HexagonGridCalculator.prototype.isHexside = function() {
	var isHexside = true;

	if(this.gridPointType == 0) {
		isHexside = false;
	}
	return isHexside;
}

/**
* method to set the gridPoint via point
*
* @method setPoint
* @param point {point} point
*/
HexagonGridCalculator.prototype.setPoint = function(point) {
	var x = point.getX();
	var y = point.getY();
	this.setXY(x,y);
}

/**
* method to set the gridPoint x, y
*
* @method setXY
* @param x {integer} x
* @param y {integer} y
*/
HexagonGridCalculator.prototype.setXY = function(x, y) {
	this.x = x;
	this.y = y;

	this.calculateGridPointType();
	this.calculateReferenceHexagonPoint();
}

/**
*Copyright 2017 Mark Butler
*
*This file is part of Hexagon Library.
*
*Line of Sight Calculator Library is free software: you can redistribute it and/or modify it under the terms of the GNU Lesser General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
*
*Line of Sight Calculator Library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
*
*You should have received a copy of the GNU Lesser General Public License along with Line of Sight Calculator Library. If not, see http://www.gnu.org/licenses/
*/

/**
* Line of Sight Calculator
*
*/

/**
* LineOfSight is an object that calculates Line of Sight.
*
* The line of Sight provides range, bearing, and facing.
*
* The line of Sight also contains an array of the hexagons and hexsides on the path of the line of sight.
*
* @class LineOfSight
* @constructor
*/
function LineOfSight()
{
	this.originX = 0;
	this.originY = 0;
	this.endPointX = 0;
	this.endPointY = 0;
	this.hexagonRange = 0;
	//this.range = 0;
	this.bearing = 0;
	this.bearingNumber = 0;
	this.facing = 0;
	this.bearingNumberArray = [];
	this.blocked = false;
	this.isCornerExpanded = true;
	this.isMiddleHexsideIncluded = false;
	this.losArray = [];

	// a "los bearing number" is either a 30 degree line or an area between (2) 30 degree lines on a compass
	// even numbers are 30 degree lines: 0=0, 2=30, 4=60, 6=90, 8=120, 10=150, 12=180, 14=210, 16=240, 18=270, 20=300, 22=330
	// North is 0;	East is 6;	South is 12;	West is 18
	// odd numbers are areas between lines:	for example: 5 is the area between 60 degrees line and 90 degrees line
	this.bearingNumberArray = [
		 0,	1,	2,	3,	4,	5,	6,
		12, 11, 10,	9,	8,	7,	6,
		12, 13, 14, 15, 16, 17, 18,
		 0, 23, 22, 21, 20, 19, 18];
}

/**
* @method calculateBearing
*
*/
LineOfSight.prototype.calculateBearing = function()
{
	var delta_x, delta_y;
	var absolute_x, absolute_y;
	var coordinate_x, coordinate_y;
	var quadrant;
	var TAU = Math.PI * 2;

	//	step 1. find the delta
	delta_x = this.endPointX - this.originX;
	delta_y = this.endPointY - this.originY;

	absolute_x = Math.abs(delta_x);
	absolute_y = Math.abs(delta_y);

	// to do:	add variables hexagonWidth, hexagonHeight
	// the y-axis is skewed by a factor close to sqrt(3)
	// it is actually (hexagonHeight/2) / (hexagonWidth/4)
	//var yAxis = (hexagonHeight/2) / (hexagonWidth/4);
	var yAxisScale = Math.sqrt(3);
	coordinate_x = absolute_x * yAxisScale;
	coordinate_y = absolute_y;

	this.tangent = coordinate_x / coordinate_y;
	this.bearing = Math.floor(Math.atan(this.tangent) * (360 / TAU)) + 1;

	// adjust for quadrant
		//	step 4. find the quadrant
		if( delta_x >= 0 ) 	{
			if( delta_y < 0)	quadrant = 1;
			else							quadrant = 2;
		}
		else {
			if( delta_y > 0)	quadrant = 3;
			else							quadrant = 4;
		}

		switch(quadrant) {
			case 1:
				break;
			case 2:
				this.bearing = (90 - this.bearing) + 90;
				break;
			case 3:
				this.bearing += 180;
				break;
			case 4:
				this.bearing = (90 - this.bearing) + 270;
				break;
		}
		if(this.bearingNumber == 0) this.bearing = 0;
		if(this.bearingNumber == 6) this.bearing = 90;
		if(this.bearingNumber == 12) this.bearing = 180;
		if(this.bearingNumber == 18) this.bearing = 270;

}
/**
* @method calculateBearingNumber
*
*/
LineOfSight.prototype.calculateBearingNumber = function()
{
	var delta_x, delta_y;
	var absolute_x, absolute_y;
	var x3times, sector, quadrant;

	//	step 1. find the delta
	delta_x = this.endPointX - this.originX;
	delta_y = this.endPointY - this.originY;

	//	step 2. check if at the origin
	if( delta_x == 0 && delta_y == 0 ) {
		this.bearingNumber = -1;
	} else {
	//	step 3. find the sector

		absolute_x = Math.abs(delta_x);
		absolute_y = Math.abs(delta_y);
		x3times = 3 * absolute_x;
		if( delta_x == 0 )										sector = 1;
			else {
				if(delta_y == 0)									sector = 7;
				else {
				if( absolute_x == absolute_y)			sector = 5;
				else {
					if(absolute_x > absolute_y)			sector = 6;
					else {
						if( x3times == absolute_y)		sector = 3;
						else {
							if( x3times > absolute_y)		sector = 4;
							else												sector = 2;
							}
						}
					}
			}
		}

		//	step 4. find the quadrant
		if( delta_x >= 0 ) 	{
			if( delta_y < 0)	quadrant = 1;
			else							quadrant = 2;
		}
		else {
			if( delta_y > 0)	quadrant = 3;
			else							quadrant = 4;
		}

		this.bearingNumber = this.bearingNumberArray[((quadrant - 1) * 7) + sector - 1];
	}
}

/**
* @method calculateFacing
*
* direction	N = 1, NE = 2, SE = 3, S = 4, SW = 5, NW = 6
*/
LineOfSight.prototype.calculateFacing = function()
{

	this.facing = Math.floor((this.bearingNumber + 1)/ 4) + 1;
}

/**
* @method calculateLosArray
*/
LineOfSight.prototype.calculateLosArray = function()
{
	this.losArray = [];
	var hexagonLosArray = [];

	var b, x, y, x2, y2, i, pointX, pointY;
	var offset1, offset2;

	var stepX = [ 0,  2,  2,  4,  2,  2,  0, -2, -2, -4, -2, -2,  0];
	var stepY = [-4, -6, -2,  0,  2,  6,  4,  6,  2,  0, -2, -6, -4];

	// check to make sure orgin and endpoint are hexagons
	var hgc = new HexagonGridCalculator();
	hgc.setXY(this.originX,this.originY);
	var isOriginHexagon = hgc.isCenter();
	hgc.setXY(this.endPointX,this.endPointY);
	var isEndPointHexagon = hgc.isCenter();

	if(isOriginHexagon && isEndPointHexagon){
		b = this.getBearingNumber();

		if (b >= 0) {

			// for even bearing numbers
			if ((b % 2) == 0) {

				i =	Math.floor(b / 2) ;
				x = this.originX;
				y = this.originY;

				var origin = new Point(x, y);
				this.losArray.push(origin);
				do {
					// if corner
					if (this.bearingIsCornerType() && this.isCornerExpanded) {
						// corner types are: 2,	6, 10, 14, 18,	22
						// i values are:		 1,	3,	5,	7,	9,	11
						// add 2 near corner hexsides
						pointX = ( x + ( x + stepX[i-1] ) ) / 2;
						pointY = ( y + ( y + stepY[i-1] ) ) / 2;

						var nearLeftHexside = new Point(pointX, pointY);
						this.losArray.push(nearLeftHexside);

						pointX = ( x + ( x + stepX[i+1] ) ) / 2;
						pointY = ( y + ( y + stepY[i+1] ) ) / 2;

						var nearRightHexside = new Point(pointX, pointY);
						this.losArray.push(nearRightHexside);

						pointX = x + stepX[i-1];
						pointY = y + stepY[i-1];

						var leftHexagon = new Point(pointX, pointY);
						this.losArray.push(leftHexagon);
					} // end if corner

					var checkMiddleHexside = true;
					if(this.bearingIsCornerType() && this.isMiddleHexsideIncluded == false){
						checkMiddleHexside = false
					}
					if(checkMiddleHexside){
					// middle hexside for straight and corner
						pointX = ( x + (x + stepX[i]) ) / 2;
						pointY = ( y + (y + stepY[i]) ) / 2;

						var middleHexside = new Point(pointX, pointY);
						this.losArray.push(middleHexside);
					}

					// if corner again
					if ( this.bearingIsCornerType() && this.isCornerExpanded	) {
						// corner types are: 2,	6, 10, 14, 18,	22
						// i values are:		 1,	3,	5,	7,	9,	11

						pointX = x + stepX[i+1];
						pointY = y + stepY[i+1];

						var rightHexagon = new Point(pointX, pointY);
						this.losArray.push(rightHexagon);

						// add 2 far corner hexsides
						pointX = ( x + ( x + stepX[i] + stepX[i-1] ) ) / 2;
						pointY = ( y + ( y + stepY[i] + stepY[i-1] ) ) / 2;

						var farLeftHexside = new Point(pointX, pointY);
						this.losArray.push(farLeftHexside);

						pointX = ( x + ( x + stepX[i] + stepX[i+1] ) ) / 2;
						pointY = ( y + ( y + stepY[i] + stepY[i+1] ) ) / 2;

						var farRightHexside = new Point(pointX, pointY);
						this.losArray.push(farRightHexside);
					} // end if corner

					// then do hexagon
					x = x + stepX[i];
					y = y + stepY[i];

					var nextHexagon = new Point(x, y);
					this.losArray.push(nextHexagon);
				// end do loop
				} while ( ( x != this.endPointX ) || ( y != this.endPointY ));

				// end if even bearing number check
				} else {

				// for odd bearing numbers zigzag
				i = Math.floor( b / 4 ) * 2 ;
				x = this.originX;
				y = this.originY;

				var origin = new Point(x, y);
				this.losArray.push(origin);

				do {
					x1 = x + stepX[i];
					y1 = y + stepY[i];
					x2 = x + stepX[i+2];
					y2 = y + stepY[i+2];

					offset1 = Math.abs( this.originX*this.endPointY - this.originX*y1 - this.endPointX*this.originY + this.endPointX*y1 + x1*this.originY - x1*this.endPointY );
					offset2 = Math.abs( this.originX*this.endPointY - this.originX*y2 - this.endPointX*this.originY + this.endPointX*y2 + x2*this.originY - x2*this.endPointY );

					if ( offset1 != offset2 ) {
						if ( offset1 < offset2 ) {
							pointX = ( x + x1 ) / 2;
							pointY = ( y + y1 ) / 2;
							x = x1;
							y = y1;
						} else {
							pointX = ( x + x2 ) / 2;
							pointY = ( y + y2 ) / 2;
							x = x2;
							y = y2;
						}

						var hexside = new Point(pointX, pointY);
						this.losArray.push(hexside);

							var nextHexagon = new Point(x, y);
							this.losArray.push(nextHexagon);
						} else {

						// offset1 == offset2
						// double hexagon traverse
						// first of near hexagons
						var leftHexagon = new Point(x1, y1);

						// second of near hexagon
						var rightHexagon = new Point(x2, y2);
						// wait till hexside to push

						// find the first near hexside
						var leftHexsideX = (x + x1) / 2;
						var leftHexsideY = (y + y1) / 2;
						var leftHexsideOffset = Math.abs( this.originX*this.endPointY - this.originX*leftHexsideY - this.endPointX*this.originY + this.endPointX*leftHexsideY + leftHexsideX*this.originY - leftHexsideX*this.endPointY );

						// find the second near hexside
						var rightHexsideX = (x + x2) / 2;
						var rightHexsideY = (y + y2) / 2;
						var rightHexsideOffset = Math.abs( this.originX*this.endPointY - this.originX*rightHexsideY - this.endPointX*this.originY + this.endPointX*rightHexsideY + rightHexsideX*this.originY - rightHexsideX*this.endPointY );

						var nearHexside = new Point();
						// select closest
						if( leftHexsideOffset < rightHexsideOffset ) {
							nearHexside.setXY(leftHexsideX, leftHexsideY);
						} else {
							nearHexside.setXY(rightHexsideX, rightHexsideY);
						}

						// find middle hexside
						pointX =	x + ((stepX[i] + stepX[i+2]) / 2 );
						hexsideY =	y + ((stepY[i] + stepY[i+2]) / 2 );
						var middleHexside = new Point(pointX, hexsideY);

						// find hexagon which is at range of 2
						x = x + stepX[i] + stepX[i+2];
						y = y + stepY[i] + stepY[i+2];
						var endHexagon = new Point(x, y);

						// x,y have changed to far hexagon
						// find the first far hexside
						var farLeftHexsideX = (x + x1) / 2;
						var farLeftHexsideY = (y + y1) / 2;
						var farLeftHexsideOffset = Math.abs( this.originX*this.endPointY - this.originX*farLeftHexsideY - this.endPointX*this.originY + this.endPointX*farLeftHexsideY + farLeftHexsideX*this.originY - farLeftHexsideX*this.endPointY );

						// find the second far hexside
						var farRightHexsideX = (x + x2) / 2;
						var farRightHexsideY = (y + y2) / 2;
						var farRightHexsideOffset = Math.abs( this.originX*this.endPointY - this.originX*farRightHexsideY - this.endPointX*this.originY + this.endPointX*farRightHexsideY + farRightHexsideX*this.originY - farRightHexsideX*this.endPointY );

						var farHexside = new Point();
						// select closest
						if( farLeftHexsideOffset < farRightHexsideOffset ) {
							farHexside.setXY(farLeftHexsideX, farLeftHexsideY);
						}	else {
							farHexside.setXY(farRightHexsideX, farRightHexsideY);
						}

						this.losArray.push(nearHexside);
						this.losArray.push(leftHexagon);
						this.losArray.push(middleHexside);
						this.losArray.push(rightHexagon);
						this.losArray.push(farHexside);
						this.losArray.push(endHexagon);
					} // end if offset1 == offset2
				// end do loop
				} while ((x != this.endPointX) || (y != this.endPointY));
			} // end if odd bearing number
		} // end if bearing number is valid
	}
}

/**
* @method calculateRange
*
*/
LineOfSight.prototype.calculateRange = function()
{
	// see programming note below to understand why this works

	var absX = Math.abs( this.endPointX - this.originX );
	var absY = Math.abs( this.endPointY - this.originY );
	if (absX > absY) {
		this.hexagonRange = absX / 2;
		this.range = absX;
	} else {
		this.hexagonRange =  (absX + absY) / 4;
		this.range = (absX + absY) / 2;
	}
}

// Notes on the range algorithm
//																	there are 2 cases to check the hexagon 
//y axis														case 1:
//.								 x3,y3								x3,y3 is above the 30 degree line, and it's range can be calculated
//.								.										 draw a 30 degree line from (x3,y3) to the y axis at (x2,y2)
//.						.												 get the range from (x1,y1) to (x2,y2) and add the range from (x2,y2) to (x3,y3)
//.				.														 the range (x1,y1) to (x2,y2) is:	 (y2-y1)/4
//.		 .																the range (x3,y3) to (x2,y2) is:	 (x3-x2)/2
//. .																			 we do not know the value of x2,y2, but since the 30 degree line has a
//. x2 y2																	 useful feature: at any point on this line, (x3-x2) = (y3-y2), so y2 = y3 - x3 + x2
//.												.								and x2 = x1
//.										.
//.			30 degree. line from origin		 substitute for x2 and y2
//.						.														total range = ((y3 - x3 + x1) - y1)/4	+	(x3 - x1)/2
//.				.			 x4,y4																= ( y3 - x3 + x1 + 2x3 - 2x1 ) / 4
//.		 .																							 = ( (x3-x1) + (y3-y1) ) / 4
//. .
//...................x axis				 case 2:
//x1, y1																x4,y4 is below the 30 degree line, and it's range can be calculated
//																					total range = (x4-x1) / 2
//
//

/**
* @method getBearing
* @return { integer } bearing
*/
LineOfSight.prototype.getBearing = function()
{
	return this.bearing;
}

/**
* @method getBearingNumber
* @return { integer } bearingNumber 0 .. 23
*/
LineOfSight.prototype.getBearingNumber = function()
{
	return this.bearingNumber;
}

/**
* @method getFacing
* @return { integer } facing
* direction	N = 1, NE = 2, SE = 3, S = 4, SW = 5, NW = 6
*/
LineOfSight.prototype.getFacing = function()
{
	return this.facing;
}

/**
* @method getLosList
* @return { Array } array
*/
LineOfSight.prototype.getLosList = function()
{
	return this.losArray();
}

/**
* @method getLosArray
* @return { Array } array
*/
LineOfSight.prototype.getLosArray = function()
{
	return this.losArray;
}

/**
* @method getLosStepArray
* @return { Array } array
*/
LineOfSight.prototype.getLosStepArray = function() {
		// find max step number and init losStepArray with empty array
		var losStepArray = [];
		// check if losArray has entries
		var lastIndex = this.losArray.length-1;
		if(lastIndex > -1){
		var los = new LineOfSight();
		los.setOriginAndEndPointXY(this.losArray[0].getX(), this.losArray[0].getY(), this.losArray[lastIndex].getX(), this.losArray[lastIndex].getY());
		var maxStepNumber = los.getGridRange();
		for(i = 0; i <= maxStepNumber;i++){
			losStepArray[i] = [];
		}

		for( var i = 0; i < this.losArray.length; i++ ) {
			los.setOriginAndEndPointXY(this.losArray[0].getX(), this.losArray[0].getY(), this.losArray[i].getX(), this.losArray[i].getY());
			var stepNumber = los.getGridRange();
			var point = new Point(this.losArray[i].getX(), this.losArray[i].getY());
			losStepArray[stepNumber].push(point);
		}
	}
	return losStepArray;
}

/**
* @method getHexagonLosArray
* @return { Array } array
*/
LineOfSight.prototype.getHexagonLosArray = function() {
	var hexagonLosArray = [];
	var hgc = new HexagonGridCalculator();
	for(var i = 0; i < this.losArray.length; i++){
		hgc.setPoint(this.losArray[i]);
		if(hgc.isCenter()){
			hexagonLosArray.push(this.losArray[i]);
		}
	}
	return hexagonLosArray;
}

/**
* @method getHexagonRange
* @return { integer } HexagonRange
*/
LineOfSight.prototype.getHexagonRange = function() {
	return this.hexagonRange;
}

/**
* @method getGridRange
* @return { integer }
*/
LineOfSight.prototype.getGridRange = function() {
	return this.range;
}

/**
* @method getRange
* @return { integer }
*/
LineOfSight.prototype.getRange = function() {
	return this.range;
}

/**
* @method getStepNumber
* @return { integer }
*/
LineOfSight.prototype.getStepNumber = function(gridPoint1, gridPoint2) {
	var range;
	var absX = Math.abs(gridPoint1.x - gridPoint2.x);
	var absY = Math.abs(gridPoint1.y - gridPoint2.y);
	if (absX > absY) {
		range = absX;
	} else {
		range = (absX + absY) / 2;
	}	
	return range;
}

/**
* @method isStaightType
* @return { boolean } true/false
*/
LineOfSight.prototype.isStaightType = function() {
	var isStraight = false;

	// 0, 4, 8, 12, 16, 20
	if ((this.bearingNumber % 4) == 0) 	{
		isStraight = true;
	}
	return isStraight;
}

/**
* @method bearingIsCornerType
* @return { boolean } true/false
*/
LineOfSight.prototype.bearingIsCornerType = function() {
	var isCorner = false;

	// 2, 6, 10, 14, 18, 22
	if ((this.bearingNumber % 4) == 2) {
		isCorner = true;
	}
	return isCorner;
}

/**
* @method isZigZagType
* @return { boolean } true/false
*/
LineOfSight.prototype.isZigZagType = function() {
	var isZigZag = false;

	// 1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23
	if ((this.bearingNumber % 2) == 1) {
		isZigZag = true;
	}
	return isZigZag;
}

/**
* method to set the isCornerExpanded flag
*
* @method setIsCornerExpanded
* @param {boolean} true/false
*/
LineOfSight.prototype.setIsCornerExpanded= function( value ) {
	this.isCornerExpanded = value;

}

/**
* method to set the isMiddleHexsideIncluded flag
*
* @method setIsMiddleHexsideIncluded
* @param {boolean} true/false
*/
LineOfSight.prototype.setIsMiddleHexsideIncluded= function( value ) {
	this.isMiddleHexsideIncluded = value;

}

/**
* method to set the origin and endpoint
*
* @method setOriginAndEndPoint
* @param {Point} originHexagon
* @param {Point} endpointHexagon
*/
LineOfSight.prototype.setOriginAndEndPoint = function(originHexagon, endpointHexagon) {
	this.originX = originHexagon.getX();
	this.originY = originHexagon.getY();
	this.endPointX = endpointHexagon.getX();
	this.endPointY = endpointHexagon.getY();
	this.calculateRange();
	this.calculateBearing();
	this.calculateBearingNumber();
	this.calculateFacing();
	this.calculateLosArray();
}

/**
* method to set the origin and endpoint
*
* @method setOriginAndEndPointXY
* @param {integer} x1
* @param {integer} y1
* @param {integer} x2
* @param {integer} y2
*/
LineOfSight.prototype.setOriginAndEndPointXY = function( x1, y1, x2, y2 ) {
	this.originX = x1;
	this.originY = y1;
	this.endPointX = x2;
	this.endPointY = y2;
	this.calculateRange();
	this.calculateBearing();
	this.calculateBearingNumber();
	this.calculateFacing();
	this.calculateLosArray();
}
