import {default as SDViewer} from "./render.js"

var svg;
var sdv;
var viewBox_y;
var viewBox_x;
// note headX and headY are indexes
var headX = 0;
var headY = 0;

var diagramSizeX = 126;
var diagramSizeY = 180;

export default function SVG(objects, groups, messages) {
    setSVG();
    sdv = new SDViewer(objects, groups, messages);
    //sdv.drawAll();
    sdv.setDiagramDisplaySize(diagramSizeX, diagramSizeY);
    sdv.setDiagramDisplayHead(headX, headY);
    sdv.drawPart();
}

function onDiagramMoved() {
    if(sdv.getMiddleObjX() != -1){
        if(viewBox_x >= sdv.getMiddleObjX()){
            //console.log(viewBox_x);
            updateSvg(sdv.getMiddleObjIndex(), headY);
        }
    }
    if(headX > 0 && viewBox_x <= sdv.getHeadObjX()){
        updateSvg(headX - (diagramSizeX / 2), headY);
    }

    if(sdv.getMiddleMsgY() != -1){
        if(viewBox_y >= sdv.getMiddleMsgY()){
            updateSvg(headX, sdv.getMiddleMsgIndex());
        }
    }
    if(headY > 0 && viewBox_y <= sdv.getHeadMsgY()){
        updateSvg(headX, headY - (diagramSizeY / 2));
    }
    keepElementTop();
}
function updateSvg(x, y) {
    sdv.clearAll();
    headX = x;
    headY = y;
    sdv.setDiagramDisplayHead(x, y);
    sdv.drawPart();
}

function keepElementTop() {
    d3.select(".objects-layout")
        .attr("transform", "translate(0," + (viewBox_y - sdv.getTopY())  + ")");
}

function setSVG(){
    // Set svg zoomable and draggable
    var width = window.innerWidth,
        height = window.innerHeight;
    var curPos_x, curPos_y, mousePos_x, mousePos_y;
    var isMouseDown, oldScale = 1;
    viewBox_x = - 10;
    viewBox_y = - 10;
    svg = d3.select("#drawArea")
                    .append("svg")
                    .attr("width", width)
                    .attr("height", height)
                    .call(d3.behavior.zoom()
                	.scaleExtent([0.1, 10])
                	.on("zoom", function () {
    	                if (oldScale !== d3.event.scale) {
    	                    var scale = oldScale / d3.event.scale;
    	                    oldScale = d3.event.scale;
    	                    viewBox_x = curPos_x - scale * (curPos_x - viewBox_x);
    	                    viewBox_y = Math.max(curPos_y - scale * (curPos_y - viewBox_y), 2 * sdv.getTopY());
    	                    svg.attr("viewBox", viewBox_x + " " + viewBox_y + " " + width / oldScale + " " + height / oldScale);

                            // Keep the hint box a constant size
                            var hintBox = d3.select(".hint-box");
                            if(hintBox[0][0] != null){
                                var attr = hintBox.attr("transform").split(" ");
                                hintBox.attr("transform", attr[0] + " scale(" + (1 / oldScale) + ")");
                            }
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
        viewBox_x = viewBox_x - d3.mouse(this)[0] + mousePos_x;
        viewBox_y = Math.max(viewBox_y - d3.mouse(this)[1] + mousePos_y, 2 * sdv.getTopY());
        svg.attr("viewBox", viewBox_x + " " + viewBox_y + " " + width / oldScale + " " + height / oldScale);
        onDiagramMoved();
    });

    svg.on("mousemove", function () {
        curPos_x = d3.mouse(this)[0];
        curPos_y = d3.mouse(this)[1];
        if (isMouseDown) {
            viewBox_x = viewBox_x - d3.mouse(this)[0] + mousePos_x;
            viewBox_y = Math.max(viewBox_y - d3.mouse(this)[1] + mousePos_y, 2 * sdv.getTopY());
            svg.attr("viewBox", viewBox_x + " " + viewBox_y + " " + width / oldScale + " " + height / oldScale);
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
