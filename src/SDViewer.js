import {default as SDController} from "./SDController"

// This is a module designed for displaying huge sequence diagrams
var svg;
var sdController;
var viewBoxX;
var viewBoxY;

var diagramSizeX = 252;
var diagramSizeY = 360;

var headX = 0;
var headY = 0;

export default function SDViewer(objects, groups, messages) {
    setSVG();
    sdController = new SDController(objects, groups, messages);

    sdController.setDiagramSize(diagramSizeX, diagramSizeY);
    sdController.setDiagramDisplayHead(headX, headY);
    sdController.drawWindow();
}

SDViewer.prototype.search = function(name){

}

SDViewer.prototype.filter = function(validElements){

}

function onDiagramMoved() {
    if(sdController.getMiddleElementX() != -1){
        if(viewBoxX >= sdController.getMiddleElementX()){
            updateSD(sdController.getMiddleElementIndex(), headY);
        }
    }
    if(headX > 0 && viewBoxX <= sdController.getHeadElementX()){
        var temp = headX - (diagramSizeX / 2);
        if(temp < 0)
            temp = 0;
        updateSD(temp, headY);
    }
    if(sdController.getMiddleMessageY() != -1){
        if(viewBoxY >= sdController.getMiddleMessageY()){
            updateSD(headX, sdController.getMiddleMessageIndex());
        }
    }
    if(headY > 0 && viewBoxY <= sdController.getHeadMessageY()){
        var temp = headY - (diagramSizeY / 2);
        if(temp < 0)
            temp = 0;
        updateSD(headX, temp);
    }

    keepElementTop()
}

function updateSD(x, y) {
    sdController.clearAll();
    headX = x;
    headY = y;
    sdController.setDiagramDisplayHead(x, y);
    sdController.drawWindow();
}

function keepElementTop() {
    d3.select(".objects-layout")
        .attr("transform", "translate(0," + (viewBoxY - sdController.top) + ")");
}

function setSVG(){
    // Set svg zoomable and draggable
    var width = window.innerWidth,
        height = window.innerHeight;
    var curPos_x, curPos_y, mousePos_x, mousePos_y;
    var isMouseDown, oldScale = 1;
    viewBoxX = - 10;
    viewBoxY = - 10;
    svg = d3.select("#drawArea")
                    .append("svg")
                    .attr("width", width)
                    .attr("height", height)
                    .call(d3.behavior.zoom()
                	.scaleExtent([0.2, 10])
                	.on("zoom", function () {
    	                if (oldScale !== d3.event.scale) {
    	                    var scale = oldScale / d3.event.scale;
    	                    oldScale = d3.event.scale;
    	                    viewBoxX = curPos_x - scale * (curPos_x - viewBoxX);
    	                    viewBoxY = Math.max(curPos_y - scale * (curPos_y - viewBoxY), 2 * sdController.top);
    	                    svg.attr("viewBox", viewBoxX + " " + viewBoxY + " " + width / oldScale + " " + height / oldScale);

                            onDiagramMoved();
                        }
    	            }));
    svg.on("mousedown", function () {
        isMouseDown = true;
        mousePos_x = d3.mouse(this)[0];
        mousePos_y = d3.mouse(this)[1];
    });

    svg.on("mouseup", function () {
        isMouseDown = false;
        viewBoxX = viewBoxX - d3.mouse(this)[0] + mousePos_x;
        viewBoxY = Math.max(viewBoxY - d3.mouse(this)[1] + mousePos_y, 2 * sdController.top);
        svg.attr("viewBox", viewBoxX + " " + viewBoxY + " " + width / oldScale + " " + height / oldScale);
        onDiagramMoved();
    });

    svg.on("mousemove", function () {
        curPos_x = d3.mouse(this)[0];
        curPos_y = d3.mouse(this)[1];
        if (isMouseDown) {
            viewBoxX = viewBoxX - d3.mouse(this)[0] + mousePos_x;
            viewBoxY = Math.max(viewBoxY - d3.mouse(this)[1] + mousePos_y, 2 * sdController.top);
            svg.attr("viewBox", viewBoxX + " " + viewBoxY + " " + width / oldScale + " " + height / oldScale);
            onDiagramMoved();
        }
    });

    // Arrow style
    svg.append("svg:defs").selectAll("marker")
        .data(["end"])
        .enter().append("svg:marker")
        .attr("id", String)
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 10)
        .attr("refY", 0)
        .attr("markerWidth", 10)
        .attr("markerHeight", 10)
        .attr("orient", "auto")
        .append("svg:path")
        .attr("d", "M0,-5L10,0L0,5");
}
