export default function Logger(){}

Logger.prototype.output = function(log){
  //console.log(log)
}

Logger.prototype.logFold = function(groupInfo){
  var log = "Fold group: " + groupInfo.id + "@" + groupInfo.displayName
  this.output(log)
}

Logger.prototype.logUnfold = function(groupInfo){
  var log = "Unfold group: " + groupInfo.id + "@" + groupInfo.displayName
  this.output(log)
}
