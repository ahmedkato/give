Template.MasterLayout.onCreated(function() {
  this.autorun(() => {
    this.subscribe("config");
    this.subscribe("uploaded");
  });
});

Template.AdminLayout.onCreated(function() {
  this.autorun(() => {
    this.subscribe("config");
    this.subscribe("uploaded");
  });
});

Template.UserLayout.onCreated(function() {
  this.autorun(() => {
    this.subscribe("config");
    this.subscribe("uploaded");
  });
});
