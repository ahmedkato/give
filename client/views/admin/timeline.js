Template.Timeline.helpers({
  audits(){
    if (Audit_trail.find().count() > 0) {
      return Audit_trail.find();
    }
    return;
  }
});

Template.Timeline.onCreated(function () {
  this.autorun(()=>{
    this.subscribe('auditTrail');
  });
});