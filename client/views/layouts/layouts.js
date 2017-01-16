function loadHead() {
  const config = ConfigDoc();

  if (config && config._id) {
    const imageDoc = Images.findOne({$and: [{configId: config._id}, {'favicon': "_true"}]});
    if (imageDoc) {
      console.log("Got to imageDoc exists");
      $('#favicon').attr("href", imageDoc.baseUrl + imageDoc.name);
    }
  }
}

Template.MasterLayout.onCreated(function() {
  this.autorun(() => {
    this.subscribe("config");
    this.subscribe("uploaded");
  });
  loadHead();
});

Template.AdminLayout.onCreated(function() {
  this.autorun(() => {
    this.subscribe("config");
    this.subscribe("uploaded");
  });
  loadHead();
});

Template.UserLayout.onCreated(function() {
  this.autorun(() => {
    this.subscribe("config");
    this.subscribe("uploaded");
  });
  loadHead();
});
