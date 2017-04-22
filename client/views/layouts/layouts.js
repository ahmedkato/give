function loadHead() {
  Meteor.setTimeout(()=>{
    const config = Config.findOne({
      'OrgInfo.web.domain_name': Meteor.settings.public.org_domain
    });
    console.log(config);
    const imageDoc = Images.findOne({configId: config._id, "meta.favicon": "_true"});
    console.log(imageDoc);
    if (imageDoc) {
      console.log("Got to imageDoc exists");
      $('#favicon').attr("href", imageDoc.versions.original.meta.pipeFrom + "?v=" + Math.random().toFixed(3) * 1000);
    }
  }, 200);
  Meteor.setTimeout(()=>{
    const config = Config.findOne({
      'OrgInfo.web.domain_name': Meteor.settings.public.org_domain
    });
    console.log(config);
    const imageDoc = Images.findOne({configId: config._id, "meta.favicon": "_true"});
    if (imageDoc) {
      console.log("Got to imageDoc exists");
      $('#favicon').attr("href", imageDoc.versions.original.meta.pipeFrom + "?v=" + Math.random().toFixed(3) * 1000);
    }
  }, 3000);
}

Template.MasterLayout.onCreated(function() {
  this.autorun(() => {
    this.subscribe("config", {onReady() {
      loadHead();
    }});
    this.subscribe("uploaded");
  });
});

Template.AdminLayout.onCreated(function() {
  this.autorun(() => {
    this.subscribe("config", {onReady() {
      loadHead();
    }});
    this.subscribe("uploaded");
  });
});

Template.UserLayout.onCreated(function() {
  this.autorun(() => {
    this.subscribe("config", {onReady() {
      loadHead();
    }});
    this.subscribe("uploaded");
  });
});
