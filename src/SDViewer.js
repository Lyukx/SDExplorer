import {default as SDController} from './SDController'
import {LoopDetector} from './LoopDetector'

// This is a module designed for displaying huge sequence diagrams
var svg
var sdController
var viewBoxX
var viewBoxY

var diagramSizeX = 252
var diagramSizeY = 360

var headX = 0
var headY = 0

var width, height
var curPos_x, curPos_y, mousePos_x, mousePos_y
var isMouseDown, oldScale

var displaySet
var elementMap

export default function SDViewer (objects, groups, messages, drawAreaId) {
  setSVG(drawAreaId)
  sdController = new SDController(objects, groups, messages)
    // Save the raw message data in order to resume from compression
  this.rawMessageBeforeComress = messages

  sdController.setDiagramSize(diagramSizeX, diagramSizeY)
  sdController.setDiagramDisplayHead(headX, headY)
  sdController.drawWindow()
  displaySet = sdController.getElementSet()
  elementMap = sdController.getElementMap()
}

SDViewer.prototype.isMessageDisplayed = function (message) {
    // find the from/to relationship
  while (!displaySet.has(message.from)) {
    if (elementMap.get(message.from) == undefined) {
      return false
    }
    var parent = elementMap.get(message.from).parent
    if (parent == -1) {
      break
    }
    message.from = parent
  }
  while (!displaySet.has(message.to)) {
    if (elementMap.get(message.to) == undefined) {
      return false
    }
    var parent = elementMap.get(message.to).parent
    if (parent == -1) {
      break
    }
    message.to = parent
  }

  return !(message.from == message.to || message.from == -1 || message.to == -1)
}

SDViewer.prototype.locate = function (messageId, scaleX, scaleY) {
    // messagePosition is actually messagePosition - 60
  var [elementIndex, messageIndex, elementPosition, messagePosition] = sdController.getIndexByMessageId(messageId)
  if (elementIndex != -1 && messageIndex != -1) {
    moveViewBox(elementIndex, messageIndex, elementPosition, messagePosition, scaleX, scaleY)
    return true
  } else {
    return false
  }
}

SDViewer.prototype.nearby = function (message) {
    // With a folded group A[a,b,c], 'display' should be [...other, A, other...]
    // With a unfolded group A[a,b,c], 'display' should be [...other, A, a, b, c, other...]
  var display = this.getElements()
  var messages = this.getMessages()
  var initialElement = elementMap.get(message.from)
  var initialMessageIndex = messages.indexOf(message)

  var handled = new Set()
  for (var i = 0; i < 100; i++) {

  }
}

SDViewer.prototype.getMessages = function () {
  return sdController.getMessages()
}

SDViewer.prototype.getElements = function () {
  return sdController.getElements()
}

SDViewer.prototype.getElementMap = function () {
  return sdController.getElementMap()
}

SDViewer.prototype.getContext = function () {
  return [headX, headY, viewBoxX, viewBoxY, width / oldScale, height / oldScale]
}

SDViewer.prototype.resume = function (context) {
  moveViewBox(context[0], context[1], context[2], context[3], context[4], context[5])
  oldScale = width / context[4]
}

SDViewer.prototype.compress = function () {
  var rawMessage = sdController.getRawMessages()
  var validMessage = sdController.getMessages()
  var loopDetector = new LoopDetector(validMessage)

  var compressedMessageSet = new Set()
  for (let message of loopDetector.result[1]) {
    compressedMessageSet.add(message.id)
  }
  var resultMessages = []
  for (let message of rawMessage) {
    if (compressedMessageSet.has(message.id)) {
      resultMessages.push(message)
    }
  }
  sdController.setMessages(resultMessages)
  sdController.setLoops(loopDetector.result[0])

  sdController.disableFoldAndUnfold()

  return [loopDetector.result[0], resultMessages]
}

SDViewer.prototype.decompress = function () {
  sdController.setMessages(this.rawMessageBeforeComress)
  d3.select('.loop-layout').remove()
  sdController.enableFoldAndUnfold()
}

SDViewer.prototype.setLoops = function (loops) {
  sdController.setLoops(loops)
}

function onDiagramMoved () {
  if (sdController.getMiddleElementX() != -1) {
    if (viewBoxX >= sdController.getMiddleElementX()) {
      updateSD(sdController.getMiddleElementIndex(), headY)
    }
  }
  if (headX > 0 && viewBoxX <= sdController.getHeadElementX()) {
    var temp = headX - (diagramSizeX / 2)
    if (temp < 0) {
      temp = 0
    }
    updateSD(temp, headY)
  }
  if (sdController.getMiddleMessageY() != -1) {
    if (viewBoxY >= sdController.getMiddleMessageY()) {
      updateSD(headX, sdController.getMiddleMessageIndex())
    }
  }
  if (headY > 0 && viewBoxY <= sdController.getHeadMessageY()) {
    var temp = headY - (diagramSizeY / 2)
    if (temp < 0) {
      temp = 0
    }
    updateSD(headX, temp)
  }

  keepElementTop()
}

function moveViewBox (elementIndex, messageIndex, x, y, scaleX, scaleY) {
  headX = Math.max(elementIndex - diagramSizeX / 2, 0)
  headY = Math.max(messageIndex - diagramSizeY / 2, 0)
  updateSD(headX, headY)
  viewBoxX = x
  viewBoxY = y
  svg.attr('viewBox', viewBoxX + ' ' + viewBoxY + ' ' + scaleX + ' ' + scaleY)

  keepElementTop()
}

function updateSD (x, y) {
  sdController.clearAll()
  headX = x
  headY = y
  sdController.setDiagramDisplayHead(x, y)
  sdController.drawWindow()
}

function keepElementTop () {
  d3.select('.objects-layout')
        .attr('transform', 'translate(0,' + (viewBoxY - sdController.top) + ')')

  d3.select('.baseline-layout')
        .attr('transform', 'translate(0,' + (viewBoxY - sdController.top) + ')')
}

function setSVG (drawAreaId) {
    // Set svg zoomable and draggable
  width = window.innerWidth
  height = window.innerHeight - 100
  curPos_x, curPos_y, mousePos_x, mousePos_y
  isMouseDown, oldScale = 1
  viewBoxX = -10
  viewBoxY = -10
    // Clear drawArea
  d3.select('svg').remove()

  svg = d3.select('#' + drawAreaId)
                    .append('svg')
                    .attr('width', width)
                    .attr('height', height)
                    .call(d3.behavior.zoom()
                	.scaleExtent([0.2, 10])
                	.on('zoom', function () {
    	                if (oldScale !== d3.event.scale) {
    	                    var scale = oldScale / d3.event.scale
    	                    oldScale = d3.event.scale
    	                    viewBoxX = curPos_x - scale * (curPos_x - viewBoxX)
    	                    viewBoxY = Math.max(curPos_y - scale * (curPos_y - viewBoxY), 2 * sdController.top)
    	                    svg.attr('viewBox', viewBoxX + ' ' + viewBoxY + ' ' + width / oldScale + ' ' + height / oldScale)

                            // Keep the hint box a constant size
                      var hintBox = d3.select('.hint-box')
                      if (hintBox[0][0] != null) {
                        var attr = hintBox.attr('transform').split(' ')
                        hintBox.attr('transform', attr[0] + ' scale(' + (1 / oldScale) + ')')
                      }

                      onDiagramMoved()
                    }
    	            }))
    // Disable double-click zoom
  svg.on('dblclick.zoom', null)

  svg.on('mousedown', function () {
    isMouseDown = true
    mousePos_x = d3.mouse(this)[0]
    mousePos_y = d3.mouse(this)[1]
  })

  svg.on('mouseup', function () {
    isMouseDown = false
    viewBoxX = viewBoxX - d3.mouse(this)[0] + mousePos_x
    viewBoxY = Math.max(viewBoxY - d3.mouse(this)[1] + mousePos_y, 2 * sdController.top)
    svg.attr('viewBox', viewBoxX + ' ' + viewBoxY + ' ' + width / oldScale + ' ' + height / oldScale)
    onDiagramMoved()
  })

  svg.on('mousemove', function () {
    curPos_x = d3.mouse(this)[0]
    curPos_y = d3.mouse(this)[1]
    if (isMouseDown) {
      viewBoxX = viewBoxX - d3.mouse(this)[0] + mousePos_x
      viewBoxY = Math.max(viewBoxY - d3.mouse(this)[1] + mousePos_y, 2 * sdController.top)
      svg.attr('viewBox', viewBoxX + ' ' + viewBoxY + ' ' + width / oldScale + ' ' + height / oldScale)
      onDiagramMoved()
    }
  })

    // Arrow style
  svg.append('svg:defs').selectAll('marker')
        .data(['end'])
        .enter().append('svg:marker')
        .attr('id', String)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 10)
        .attr('refY', 0)
        .attr('markerWidth', 10)
        .attr('markerHeight', 10)
        .attr('orient', 'auto')
        .append('svg:path')
        .attr('d', 'M0,-5L10,0L0,5')
}
