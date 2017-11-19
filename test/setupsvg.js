// Set svg zoomable and draggable
var width = window.innerWidth,
    height = window.innerHeight;
var curPos_x, curPos_y, mousePos_x, mousePos_y;
var isMouseDown, oldScale = 1;
var viewBox_x = - 10;
var viewBox_y = - 10;
var svg = d3.select("#drawArea")
                .append("svg")
                .attr("width", width)
                .attr("height", height)
                .call(d3.behavior.zoom()
            	.scaleExtent([1, 10])
            	.on("zoom", function () {
	                if (oldScale !== d3.event.scale) {
	                    var scale = oldScale / d3.event.scale;
	                    oldScale = d3.event.scale;
	                    viewBox_x = curPos_x - scale * (curPos_x - viewBox_x);
	                    viewBox_y = curPos_y - scale * (curPos_y - viewBox_y);
	                    svg.attr("viewBox", viewBox_x + " " + viewBox_y + " " + width / oldScale + " " + height / oldScale);
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
    viewBox_y = viewBox_y - d3.mouse(this)[1] + mousePos_y;
    svg.attr("viewBox", viewBox_x + " " + viewBox_y + " " + width / oldScale + " " + height / oldScale);
});

svg.on("mousemove", function () {
    curPos_x = d3.mouse(this)[0];
    curPos_y = d3.mouse(this)[1];
    if (isMouseDown) {
        viewBox_x = viewBox_x - d3.mouse(this)[0] + mousePos_x;
        viewBox_y = viewBox_y - d3.mouse(this)[1] + mousePos_y;
        svg.attr("viewBox", viewBox_x + " " + viewBox_y + " " + width / oldScale + " " + height / oldScale);
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
