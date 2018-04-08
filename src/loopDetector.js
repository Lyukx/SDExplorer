import {Loop} from './loop'

// represent: an array of messages
// repeat: repeat times
function LoopNode (represent, repeat) {
  this.represent = represent
  this.repeat = repeat
  this.children = []
  this.depth = 1
}

LoopNode.prototype.sameRepresent = function (another) {
  if (this.represent.length != another.represent.length) {
    return false
  }
  for (var i = 0; i < this.represent.length; i++) {
    if (!this.represent[i].equals(another.represent[i])) {
      return false
    }
  }
  return true
}

function compareWindows (loopTreeList, start, windowSize) {
  for (var i = start; i < start + windowSize; i++) {
    if (!loopTreeList[i].sameRepresent(loopTreeList[i + windowSize])) {
      return false
    }
  }
  return true
}

function mergeNodes (loopTreeList, start, windowSize, repeat) {
  var represent = []
  var children = []
  var maxDepth = 0
  for (var i = start; i < start + windowSize; i++) {
    represent = represent.concat(loopTreeList[i].represent)
    children.push(loopTreeList[i])
    if (loopTreeList[i].depth > maxDepth) {
      maxDepth = loopTreeList[i].depth
    }
  }
  var merged = new LoopNode(represent, repeat)
  merged.children = children
  merged.depth = maxDepth + 1
  return merged
}

function compress (messages) {
  var loopTreeList = []
  for (var i = 0; i < messages.length; i++) {
    loopTreeList.push(new LoopNode([messages[i]], 1))
  }
  var windowSize = 1
    // var thread = loopTreeList.length / 2;
  var thread = loopTreeList.length / 2 < 100 ? loopTreeList.length / 2 : 100
  while (windowSize <= thread) {
    for (i = 0; i <= loopTreeList.length - 2 * windowSize; i++) {
            // Find all continuous loop iterations
      var repeatCount = 1
      while (compareWindows(loopTreeList, i, windowSize)) {
                // Remove items in right window
        loopTreeList.splice(i + windowSize, windowSize)
        repeatCount++
        if (i > loopTreeList.length - 2 * windowSize) {
          break
        }
      }
            // There are loops, merge items in the window together
      if (repeatCount > 1) {
        var merged = mergeNodes(loopTreeList, i, windowSize, repeatCount)
        loopTreeList.splice(i, windowSize, merged)
      }
    }
    windowSize++
  }

  return loopTreeList
}

function getAllRepresentIds (represent) {
  var ids = []
  for (var i = 0; i < represent.length; i++) {
    ids.push(represent[i].id)
  }
  return ids
}

function getAllLoops (loopTreeRoot) {
    // Apply a DFS on loop tree and find those repeat > 1 nodes
  var loops = []
  if (loopTreeRoot.children.length == 0) {
    return loops
  }
  var stack = []
  stack.push(loopTreeRoot)
  while (stack.length != 0) {
    var node = stack.pop()
    loops.push(node)
    for (var i = 0; i < node.children.length; i++) {
            // Only access non-leef node
      if (node.children[i].repeat > 1) {
        stack.push(node.children[i])
      }
    }
  }
  return loops
}

export function LoopDetector (messages) {
  var loopTreeList = compress(messages)
    // Get all loops
  var loops = []
    // Get compressed messages
  var compressed = []
  for (var i = 0; i < loopTreeList.length; i++) {
    loops = loops.concat(getAllLoops(loopTreeList[i]))
    compressed = compressed.concat(loopTreeList[i].represent)
  }

  this.result = [loops, compressed]
}
