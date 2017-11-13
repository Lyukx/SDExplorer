var ELEMENT_HEIGHT = 40;
var ELEMENT_CH_WIDTH = 10;
var ELEMENT_CH_HEIGHT = 4;

var PADDING = 20;
var PADDING_GROUP = 10;

var ELEMENT_PADDING = ELEMENT_HEIGHT;

var MSG_ACTIVE_WIDTH = 10;
var MSG_HEIGHT = 80;
var MSG_PADDING = MSG_HEIGHT / 8;

var HINT_WIDTH = 300;
var HINT_HEIGHT = 90;

export function generateLayout() {
    // Add layouts into svg
    d3.select("svg")
        .append("g")
        .attr("class", "baseline-layout");

    d3.select("svg")
        .append("g")
        .attr("class", "loop-layout");

    d3.select("svg")
        .append("g")
        .attr("class", "messages-layout");

    d3.select("svg")
        .append("g")
        .attr("class", "objects-layout")
        .attr("transform", "translate(0, 0)");
}

export function drawElement(element){
    var tempG = d3.select(".objects-layout").append("g");
    //TODO Draw a lifeline

    // Draw rectangle
    var rect = tempG.append("rect")
                    .attr({x: 0, y: 0, width: element.width, height: element.height})
                    .style("stroke", "black");
    if(element.isGroup()){
        rect.style("fill", "yellow");
    }
    else{
        rect.style("fill", "white");
    }

    // Write names
    tempG.append("text")
         .text(function(d){ return element.displayName; })
         .attr("transform", "translate(" + element.width / 2 + "," + (element.height / 2 + ELEMENT_CH_HEIGHT) + ")")
         .attr("text-anchor", "middle");

    // Move object to where it should be
    tempG.attr("class", "element")
         .datum(element)
         .attr("transform", "translate(" + element.x + ", " + element.y + ")");

    return tempG;
}

export function unfoldUpdateElements(group, elementController){
    d3.selectAll(".element")
      .each(function(element){
          if(element.isGroup()){
              d3.select(this).select("rect")
                .transition()
                .attr({width: element.width, height:element.height});
              if(element == group){
                  d3.select(this)
                    .transition()
                    .style("fill-opacity", "0")
                    .attr("transform", "translate(" + element.x + ", " + element.y + ")");
                /*
                  d3.select("#baseLine" + element.id)
                    .transition()
                    .attr("transform", "translate(" + element.x + ", " + element.y + ")")
                    .style("opacity", 0);
                */
              }
              else{
                  d3.select(this)
                    .transition()
                    .attr("transform", "translate(" + element.x + ", " + element.y + ")");
                /*
                  d3.select("#baseLine" + element.id)
                    .transition()
                    .attr("transform", "translate(" + element.x + ", " + element.y + ")");
                */
              }
          }
          else{
              d3.select(this)
                .transition()
                .attr("transform", "translate(" + element.x + ", " + element.y + ")");
            /*
              d3.select("#baseLine" + element.id)
                .transition()
                .attr("transform", "translate(" + element.x + ", " + element.y + ")");
            */
          }
    });

    elementController.getDisplay().forEach(function(element){
        ELEMENT_PADDING = Math.max(ELEMENT_PADDING, element.height);
    });

    var elementMap = elementController.getElementMap();
    for(var i = 0; i < group.children.length; i++){
        var elementId = group.children[i];
        var thisElement = elementMap.get(elementId);
        var temp = drawElement(thisElement);
        temp.attr("transform", "translate(" + group.x + ", " + (group.y + PADDING_GROUP) + ")");
        temp.transition()
            .attr("transform", "translate(" + thisElement.x + ", " + thisElement.y + ")");
        /*
        d3.select("#baseLine" + elementId)
            .transition()
            .attr("transform", "translate(" + thisElement.x + ", " + thisElement.y + ")");
        */
    }
}

export function foldUpdateElements(group, elementController) {
    d3.selectAll(".element-rectangle")
        .each(function(element){
            if(group.children.indexOf(element.id) != -1){
                d3.select("#baseLine" + element.id).remove();
                d3.select(this).remove();
            }
            else if(element.isGroup()){
                d3.select(this).select("rect")
                    .transition()
                    .attr({width: element.width, height:element.height});

                ELEMENT_PADDING = Math.max(ELEMENT_PADDING, element.height);

                if(element == group){
                    d3.select(this)
                        .transition()
                        .style("fill-opacity", "1")
                        .attr("transform", "translate(" + element.x + ", " + element.y + ")");
                    /*
                    d3.select("#baseLine" + element.id)
                        .transition()
                        .style("opacity", 1)
                        .attr("transform", "translate(" + element.x + ", " + element.y + ")");
                    */
                }
                else{
                    d3.select(this)
                        .transition()
                        .attr("transform", "translate(" + element.x + ", " + element.y + ")");
                    /*
                    d3.select("#baseLine" + element.id)
                        .transition()
                        .attr("transform", "translate(" + element.x + ", " + element.y + ")");
                    */
                }
            }
            else{
                d3.select(this)
                    .transition()
                    .attr("transform", "translate(" + element.x + ", " + element.y + ")");
                /*
                d3.select("#baseLine" + element.id)
                    .transition()
                    .attr("transform", "translate(" + element.x + ", " + element.y + ")");
                */
            }
        });

    ELEMENT_PADDING = ELEMENT_HEIGHT;
    elementController.getDisplay().forEach(function(element){
        ELEMENT_PADDING = Math.max(ELEMENT_PADDING, element.height);
    });
}
