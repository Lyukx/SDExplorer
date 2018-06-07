export default function Logger(){}

// Output interface
Logger.prototype.output = function(log){
  //console.log(log);
}

Logger.prototype.logFold = function(groupInfo){
  var time = Date();
  var log = {
    time: time,
    type: "Fold",
    param: [groupInfo.id, groupInfo.displayName]
  };
  this.output(log);
}

Logger.prototype.logUnfold = function(groupInfo){
  var time = Date();
  var log = {
    time: time,
    type: "Unfold",
    param: [groupInfo.id, groupInfo.displayName]
  }
  this.output(log);
}

Logger.prototype.logHinitbox = function(messageInfo){
  var time = Date();
  var log = {
    time: time,
    type: "Hintbox",
    param: [messageInfo]
  }
  this.output(log);
}
