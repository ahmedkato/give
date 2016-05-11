
function guideExists () {
  let config = ConfigDoc();
  if (config && config.Giving && config.Giving.guide) {
    return true;
  }
  return false;
}

function groupIndex (config, id) {
  return config.Giving.guide.map( function ( group ) {
    return group.groupId;
  } ).indexOf( id );
}

Template.DonationLanding.onCreated(function () {
  this.autorun(()=>{
    this.subscribe("uploaded");
  });
});

Template.DonationLanding.helpers({
  imageSrc: function () {
    if (Uploads.findOne({fundId: this.id})) {
      return Uploads.findOne({fundId: this.id}).baseUrl + Uploads.findOne({fundId: this.id}).name;
    }
    return;
  },
  givingOptions: function() {
    let config = ConfigDoc();
    if (config && config._id) {
      let givingOptions =  config && config.Giving && config.Giving.options;
      if (givingOptions && givingOptions.length > 0) {
        return _.sortBy(givingOptions, 'position');
      }
    }
    return;
  },
  donationGroups: function() {
    let config = ConfigDoc();
    let givingOptions =  config && config.Giving && config.Giving.options;

    let groups = _.filter( givingOptions, function(item) {
      return item && item.groupId;
    });
    let donationGroups = groups.map(function(group) {
      group.children = _.filter(givingOptions, function(item) {
        return group.groupId === item.currentGroup;
      });
      return group;
    });
    return donationGroups;
  },
  showDD: function() {
    return Session.get("showDD");
  },
  configId: function() {
    let config = ConfigDoc();

    if( config && config._id ) {
      var givingOptions = config && config.Giving && config.Giving.options;

      if( givingOptions && givingOptions.length > 0 ) {

        let groups = _.filter( givingOptions, function ( item ) {
          return item && item.groupId;
        } );

        // Setup the DD-Slick version of the individual select elements
        Meteor.setTimeout(function() {
          groups.forEach(function(item){
            let itemName = '#dd-' + item.groupId;
            $(itemName).ddslick({
              onSelected: function(selectedData) {
                $("[name='donateTo']").val(selectedData.selectedData.value);
                if ($("#dd-" + selectedData.selectedData.value + " ul li").length === 1) {
                  // select the first option in the second dropdown if there is only 1 option
                  $( "#dd-" + selectedData.selectedData.value ).ddslick( 'select', { index: 1 } );
                }
              }
            });
            $(itemName).hide();
          });

          if ($("#mainDD")) {
            $("#mainDD").ddslick({
              onSelected: _.debounce(function(selectedData){
                groups.forEach(function(item){
                  let itemName = '#dd-' + item.groupId;
                  if( selectedData.selectedData.value !== item.groupId) {
                    if ($("#dd-" + selectedData.selectedData.value + " ul li").length > 1) {
                      $("#dd-" + selectedData.selectedData.value).show();
                      Session.set("showSecondLabel", true);
                    } else {
                      Session.set("showSecondLabel", false);
                    }
                    $( itemName ).prop('disabled', true);
                    $( itemName ).hide();
                  } else {
                    $("[name='donateTo']").val( $( itemName ).find( ":input" ).val() );
                  }
                });
              }, 300)
            });
          }
        }, 0);

      }
        return config && config._id;
      }
  },
  givingGuide: function() {
    let config = ConfigDoc();
    var givingGuide = config && config.Giving && config.Giving.guide;

    if(givingGuide && givingGuide.length > 0){
      return givingGuide;
    }
  },
  checked: function() {
    let config = ConfigDoc();
    if (guideExists()) {
      if (groupIndex(config, this.groupId) !== -1 && config.Giving.guide[groupIndex(config, this.groupId)].show) {
        return 'checked';
      }
    }
    return;
  },
  icon: function () {
    let config = ConfigDoc();
    if (guideExists()) {
      if (groupIndex(config, this.groupId) !== -1 && config.Giving.guide[groupIndex(config, this.groupId)].icon) {
        return config.Giving.guide[groupIndex(config, this.groupId)].icon;
      }
    }
    return;
  },
  title: function () {
    let config = ConfigDoc();
    if (guideExists()) {
      if (groupIndex(config, this.groupId) !== -1 && config.Giving.guide[groupIndex(config, this.groupId)].title) {
        return config.Giving.guide[groupIndex(config, this.groupId)].title;
      }
    }
    return;
  },
  twoDDSlickOptions() {
    return Session.get("showSecondLabel");
  }
});

Template.DonationLanding.events({
  'click .guide-item': function (e) {
    e.preventDefault();
    let config = ConfigDoc();
    let ddslick = $("#mainDD").data('ddslick');
    let index = groupIndex(config, this.groupId);
    $('#mainDD').ddslick('select', {index: index.toString() });
    $(".guide-item").addClass("dim-area");
    $(e.currentTarget).removeClass("dim-area");
    $(".guide-item").removeClass("highlight-area");
    $(e.currentTarget).addClass("highlight-area");
  },
  'click #other_ways_to_give': function (e) {
    e.preventDefault();
    $('#modal_for_other_ways_to_give').modal({
      show: true,
      backdrop: 'static'
    });
  },
  'click #cardButton': function(e) {
    e.preventDefault();
    console.log("You clicked the card button");
    var placeholder_value = $('#placeholder_donate_input').val();
    if (placeholder_value === '#depends-on-Missionary' && $('#depends-on-Missionary').val() === "") {
      $('#depends-on-Missionary > .dd-select').addClass("red-border");
      alert("Please select a missionary");
      return false;
    } else {
      if (placeholder_value === '') {
        $('[name="donateWith"]').val('Card');
        if($('#GiveTo').val() === '1'){
          $('[name="donateTo"]').val('WhereMostNeeded');
        }
      } else {
        $('[name="donateTo"]').val($(placeholder_value).val());
        $('[name="donateWith"]').val('Card');
      }
      Router.go('/?'+$("#landing_form").serialize());
    }
  },
  'click #checkButton': function(e) {
    e.preventDefault();
    var placeholder_value = $('#placeholder_donate_input').val();
    if (placeholder_value === '#depends-on-Missionary' && $('#depends-on-Missionary').val() === "") {
      $('#depends-on-Missionary > .dd-select').addClass("red-border");
      alert("Please select a missionary");
      return false;
    } else {
      if (placeholder_value === '') {
        $('[name="donateWith"]').val('Check');
        if($('#GiveTo').val() === '1'){
          $('[name="donateTo"]').val('WhereMostNeeded');
        }
      } else {
        $('[name="donateTo"]').val($(placeholder_value).val());
        $('[name="donateWith"]').val('Check');
      }
      Router.go('/?'+$("#landing_form").serialize());
    }
  }
});

Template.DonationLanding.onRendered(function () {
  $('[name="donateTo"]').change();
});

