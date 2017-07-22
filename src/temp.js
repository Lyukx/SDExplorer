var from = total.get(message.from);
var to = total.get(message.to);
// left active bar
var x1 = from.x + from.width / 2 - MSG_ACTIVE_WIDTH / 2;
var y1 = message.position + MSG_PADDING;
var h1 = message.scale * MSG_HEIGHT - 2 * MSG_PADDING;

// left side of the right active bar
var x2 = to.x + to.width / 2 - MSG_ACTIVE_WIDTH / 2;
var y2 = y1 + MSG_PADDING;
var h2 = h1 - 2 * MSG_PADDING;

var tempG = d3.select("svg").append("g");
// Draw left active bar if needed
if(!mainThread.has(message.from)){
    tempG.append("rect")
        .attr("class", "leftActiveBlock")
        .attr({x: 0, y: 0, width: MSG_ACTIVE_WIDTH, height: h1})
        .attr("transform", "translate(" + x1 + "," + y1 + ")")
        .style("stroke", "black")
        .style("fill", "#CCC");
}

// Draw call line
tempG.append("line")
        .attr("class", "callLine")
        .style("stroke", "black")
        .attr("x1", (message.from < message.to) ? x1 + MSG_ACTIVE_WIDTH : x1)
        .attr("y1", y2)
        .attr("x2", (message.from < message.to) ? x2 : x2 + MSG_ACTIVE_WIDTH)
        .attr("y2", y2)
        .attr("marker-end", "url(#end)");

// Draw callback line
tempG.append("line")
        .attr("class", "callBackLine")
        .style("stroke", "black")
        .style("stroke-dasharray", "5, 5, 5")
        .attr("x1", (message.from < message.to) ? x2 : x2 + MSG_ACTIVE_WIDTH)
        .attr("y1", y2 + h2)
        .attr("x2", (message.from < message.to) ? x1 + MSG_ACTIVE_WIDTH : x1)
        .attr("y2", y2 + h2)
        .attr("marker-end", "url(#end)");

// Draw right active block
tempG.append("rect")
        .attr("class", "rightActiveBlock")
        .attr({x: 0, y: 0, width: MSG_ACTIVE_WIDTH, height: h2})
        .attr("transform", "translate(" + x2 + "," + y2 + ")")
        .style("stroke", "black")
        .style("fill", "#CCC");

tempG.append("class", "message")
        .datum(message);
