export function Logger(){}

Logger.prototype.output = function(log){
  console.log(log)
}

Logger.prototype.logFold = function(groupInfo){
  log = "Fold group: " + groupInfo.id + "@" + groupIndo.name
  this.output(log)
}

Logger.prototype.logUnfold = function(groupIndo){
  log = "Unfold group: " + groupInfo.id + "@" + groupIndo.name
  this.output(log)
}
