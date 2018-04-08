import {Message} from './message'

var MSG_HEIGHT = 80
var MSG_PADDING = MSG_HEIGHT / 4

var validMessages // The valid messages (those be displayed)
var originMessages // Total messages (Saved in a map form: [id => message])
var totalMessages // Total messages (from / to may be changed by grouping objects)

var rawValidMessages // Used for compress

var mainThreadSet

export default function MessageController (messages, mainThreads, displaySet, elementMap) {
  validMessages = []
  originMessages = new Map()
  totalMessages = []
  for (let message of messages) {
        // Filter invalid messages
    var thisMessage = new Message(message)
    totalMessages.push(thisMessage)
    if (!thisMessage.isReturn()) {
      originMessages.set(thisMessage.id, {from: thisMessage.from, to: thisMessage.to})
    }
  }

    // if the message is from/to elements in a grouped group, change the from/to attribute
  for (let message of totalMessages) {
    if (message.to == -1) { // skip return message
      continue
    }
    while (!displaySet.has(message.from)) {
      if (elementMap.get(message.from) == undefined) { // invalid messages
        message.from = -1
        break
      }
      var parent = elementMap.get(message.from).parent
      if (parent == -1) {
        break
      }
      message.from = parent
    }
    while (!displaySet.has(message.to)) {
      if (elementMap.get(message.to) == undefined) { // invalid messages
        message.to = -1
        break
      }
      var parent = elementMap.get(message.to).parent
      if (parent == -1) {
        break
      }
      message.to = parent
    }
  }

  mainThreadSet = mainThreads
  updateStatus()

  this.validMessages = validMessages
}

MessageController.prototype.foldUpdateStatus = function (group) {
  for (let message of totalMessages) {
    if (message.to == -1) { // skip return message
      continue
    }
    if (group.children.indexOf(message.from) != -1) {
      message.from = group.id
    }
    if (group.children.indexOf(message.to) != -1) {
      message.to = group.id
    }
  }
  updateStatus()
}

MessageController.prototype.getRawMessages = function () {
  return rawValidMessages
}

MessageController.prototype.unfoldUpdateStatus = function (display, elementMap) {
  for (let message of totalMessages) {
    if (message.to == -1 || message.from == -1) { // skip return message & invalid messages
      continue
    }
    if (!display.has(message.from)) {
      message.from = originMessages.get(message.id).from
      while (!display.has(message.from)) {
        var parent = elementMap.get(message.from).parent
        if (parent == -1) {
          break
        }
        message.from = parent
      }
    }
    if (!display.has(message.to)) {
      message.to = originMessages.get(message.id).to
      while (!display.has(message.to)) {
        var parent = elementMap.get(message.to).parent
        if (parent == -1) {
          break
        }
        message.to = parent
      }
    }
        // console.log("" + message.from + " -> " + message.to + " : " + message.message);
  }
  return updateStatus()
}

function updateStatus () {
    // Remove invalid messages in total message
  rawValidMessages = []
  var validMessageSet = new Set() // id
  for (var i = 0; i < totalMessages.length; i++) {
    var thisMsg = totalMessages[i]
    if (thisMsg.isReturn()) {
      if (validMessageSet.has(thisMsg.id)) {
        rawValidMessages.push(thisMsg)
      }
    } else if (thisMsg.to != thisMsg.from && thisMsg.from != -1 && thisMsg.to != -1) {
      rawValidMessages.push(thisMsg)
      validMessageSet.add(thisMsg.id)
    } else {
      thisMsg.valid = false
    }
  }

    // Decide the position and scale of messages
  validMessages.length = 0
  var enabledMessages = []
  var activeStack = new ActiveStack()
  var messageMap = new Map() // id => message

  var position = MSG_HEIGHT / 4

  for (var i = 0; i < rawValidMessages.length; i++) {
    var thisMessage = rawValidMessages[i]
    if (!thisMessage.isReturn()) {
      messageMap.set(thisMessage.id, [thisMessage, i])
      position += MSG_HEIGHT / 2
      thisMessage.position = position

      activeStack.push(thisMessage)
      thisMessage.fromOffset = activeStack.getOffset(thisMessage.from)
      thisMessage.toOffset = activeStack.getOffset(thisMessage.to)

      if (!thisMessage.valid) {
        enabledMessages.push(thisMessage)
      }
      thisMessage.valid = true
      validMessages.push(thisMessage)
    } else {
      var returnedMessage = messageMap.get(thisMessage.id)[0]
      var distance = i - messageMap.get(thisMessage.id)[1]
      position += MSG_HEIGHT / 2
      returnedMessage.scale = (distance + 1) / 2

            // Here we have an assume that every time the stack pops, we get the message returned
            // It works in single-thread sequence diagram, but this return method actually doesn't work in multi-thread scenario
      activeStack.pop()
    }
  }

    // It is possible that not all messages are returned while drawing partial sequence diagrams
  var count = rawValidMessages.length
  while (!activeStack.isEmpty()) {
    var message = activeStack.pop()
    var distance = count - messageMap.get(message.id)[1]
    position += MSG_HEIGHT / 2
    message.scale = (distance + 1) / 2
    count++
  }
  return enabledMessages
}

// Decide the validations/scales/positions/stackOffsets of messages
// 2017.12.1 tend to use return message, so the call stack based method is no use
// However, this part still has its value to support the lack-return sequence diagram, so it is remained.
/*
function updateStatus(){
    var activeStack = new ActiveStack();

    var position = MSG_HEIGHT / 4;
    var feedBack = 0; // A

    var enabledMessages = []; // After unfold operation there might be newly enabled messages
    validMessages = [];

    for(var i = 0; i < totalMessages.length; i++){
        var thisMsg = totalMessages[i];
        // Invalid message
        if(thisMsg.to == thisMsg.from || thisMsg.from == -1 || thisMsg.to == -1){
            thisMsg.valid = false;
        }

        // Message from main thread
        else if(mainThreadSet.has(thisMsg.from)){
            position += (activeStack.stack.length + 1) * MSG_HEIGHT / 2;
            thisMsg.position = position;
            // clear the call stack
            activeStack = new ActiveStack();

            // Add message into active stack
            activeStack.push(thisMsg);
            thisMsg.fromOffset = activeStack.getOffset(thisMsg.from);
            thisMsg.toOffset = activeStack.getOffset(thisMsg.to);

            //Check enabled
            if(!thisMsg.valid){
                enabledMessages.push(thisMsg);
            }
            thisMsg.valid = true;
            thisMsg.scale = 1;
            validMessages.push(thisMsg);
        }

        // Message from active block
        else if(activeStack.hasActive(thisMsg.from)){
            if(!thisMsg.valid){
                enabledMessages.push(thisMsg);
            }
            thisMsg.valid = true;
            thisMsg.scale = 1;
            validMessages.push(thisMsg);
            // Decide the position
            var feedBack = 0;
            // After loop the peek of the stack is the last valid message in the call chain
            while(activeStack.peek().to != thisMsg.from){
                var top = activeStack.pop();
                feedBack += 1;
            }
            position += (feedBack + 1) * MSG_HEIGHT / 2;
            thisMsg.position = position;
            // Modify the scale of messages in the call chain
            activeStack.stack.forEach(function(msg){
                msg.scale += 1;
            });
            // Add the message into active set & stack
            activeStack.push(thisMsg);
            thisMsg.fromOffset = activeStack.getOffset(thisMsg.from);
            thisMsg.toOffset = activeStack.getOffset(thisMsg.to);
        }

        // Message come from non-active or not-main-thread objects
        else{
            thisMsg.valid = false;
        }
    }
    return enabledMessages;
}
*/
function ActiveStack () {
  this.stack = []
  this.offset = new Map()
  for (let mainThread of mainThreadSet) {
    this.offset.set(mainThread, 0)
  }
}

ActiveStack.prototype.push = function (message) {
  this.stack.push(message)

  if (this.offset.has(message.to)) {
    this.offset.set(message.to, this.offset.get(message.to) + 1)
  } else {
    this.offset.set(message.to, 0)
  }
}

ActiveStack.prototype.pop = function () {
  var message = this.stack.pop()
  var temp = this.offset.get(message.to) - 1
  if (temp < 0) {
    this.offset.delete(message.to)
  } else {
    this.offset.set(message.to, temp)
  }

  return message
}

ActiveStack.prototype.peek = function () {
  return this.stack[this.stack.length - 1]
}

ActiveStack.prototype.hasActive = function (objectId) {
  return this.offset.has(objectId)
}

ActiveStack.prototype.isEmpty = function () {
  return this.stack.length == 0
}

ActiveStack.prototype.getOffset = function (elementId) {
  if (this.offset.has(elementId)) {
    return this.offset.get(elementId)
  } else {
    return 0
  }
}
