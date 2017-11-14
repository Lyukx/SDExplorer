import {Message} from "./message";

var MSG_HEIGHT = 80;
var MSG_PADDING = MSG_HEIGHT / 4;

var validMessages; // The valid messages (those be displayed)
var originMessages; // Total messages (Saved in a map form: [id => message])
var totalMessages; // Total messages (from / to may be changed by grouping objects)

var mainThreadSet;

export default function MessageController(messages, mainThreads, display, elementMap){
    validMessages = [];
    originMessages  = new Map();
    for(var i = 0; i < messages.length; i++){
        totalMessages.push(messages[i]);
        originMessages.set(messages[i].id, messages[i]);
    }

    // Initial the messages with setting the from / to
    var displaySet = new Set(display);
    // if the message is from/to elements in a grouped group, change the from/to attribute
    for(var i = 0; i < totalMessages.length; i++){
        while(!displaySet.has(totalMessages[i].from)){
            var parent = elementMap.get(originMessages.get(messages).from).parent;
            message.from = parent;
            if(parent == -1){
                break;
            }
        }
        while(!displaySet.has(totalMessages[i].to)){
            var parent = elementMap.get(originMessages.get(messages).to).parent;
            message.to = parent;
            if(parent == -1){
                break;
            }
        }
    }

    mainThreadSet = mainThreads;
}

//Decide the validations/scales/positions/stackOffsets of messages
function updateStatus(){
    var activeSet = new Set(); // Speed up the has() check using a Set as the stack may be deep
    var activeStack = [];

    var position = MSG_HEIGHT / 4;
    var feedBack = 0; // A

    var enabledMessages = []; // After unfold operation there might be newly enabled messages
    validMessages = [];

    var offsetMap = createOffset();

    for(var i = 0; i < totalMessages.length; i++){
        var thisMsg = totalMessages[i];
        // Invalid message
        if(thisMsg.to == thisMsg.from || thisMsg.from == -1 || thisMsg.to == -1){
            thisMsg.valid = false;
        }

        // Message from main thread
        else if(mainThreadSet.has(thisMsg.from)){
            position += (activeStack.length + 1) * MSG_HEIGHT / 2;
            thisMsg.position = position;
            // clear the call stack
            activeStack = [];
            activeSet.clear();
            offsetMap = createOffset();
            // Add message into active stack
            activeSet.add(thisMsg.to);
            activeStack.push(thisMsg);
            if(offsetMap.has(thisMsg.to)){
                thisMsg.toOffset = offsetMap.get(thisMsg.to) + 1;
                offsetMap.set(thisMsg.to, thisMsg.toOffset);
            }
            else{
                offsetMap.set(thisMsg.to, 0);
            }
            //Check enabled
            if(!thisMsg.valid){
                enabledMessages.push(thisMsg);
            }
            thisMsg.valid = true;
            thisMsg.scale = 1;
            validMessages.push(thisMsg);
        }

        // Message from active block
        else if(activeSet.has(thisMsg.from)){
            if(!thisMsg.valid){
                enabledMessages.push(thisMsg);
            }
            thisMsg.valid = true;
            thisMsg.scale = 1;
            validMessages.push(thisMsg);
            // Decide the position
            var feedBack = 0;
            // After loop the peek of the stack is the last valid message in the call chain
            while(peek(activeStack).to != thisMsg.from){
                var top = activeStack.pop();
                activeSet.delete(top);
                feedBack += 1;
            }
            position += (feedBack + 1) * MSG_HEIGHT / 2;
            thisMsg.position = position;
            // Change the scale of messages in the call chain
            activeStack.forEach(function(msg){
                msg.scale += 1;
            });
            // Add the message into active set & stack
            activeStack.push(thisMsg);
            activeSet.add(thisMsg.to);
        }
    }
}

function createOffset(){
    var offSetMap = new Map();
    for (let mainThread of mainThreadSet){
        offsetMap.set(mainThread, 0);
    }
    return offSetMap;
}
