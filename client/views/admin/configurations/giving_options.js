function reorderItems() {
  let config = ConfigDoc();
  let orderOfOptions = $("#selectedGivingOptionsDiv").sortable("toArray"),
    newOptionsOrder = [],
    currentGroup;
  let givingOptions = config && config.Giving && config.Giving.options;

  orderOfOptions.forEach(function(id, index) {
    let thisOption = _.map(givingOptions, function(item){
      if(item.type === 'group'){
        currentGroup = item.groupId;
      } else {
        item.currentGroup = currentGroup;
      }
      if (item.id === id || item.groupId === id){
        item.position = index;
        newOptionsOrder.push(item);
      }
    });
  });

  Config.update({_id: config._id}, {
    $set: {
      'Giving.options': newOptionsOrder
    }
  });
};

function sortableFunction () {
  Meteor.setTimeout(function () {
    $(".sortable").sortable({
      cursor: 'move',
      dropOnEmpty: true,
      handle: '.fa-arrows',
      helper: function (e, li) {
        this.copyHelper = li.clone().insertAfter(li);
        $(this).data('copied', false);
        return li.clone();
      },
      start: function( e, ui ) {
        clone = $(ui.item[0].outerHTML).clone();
      },
      placeholder: {
        element: function(clone) {
          return $('<div class="row selected-options sortable-clone">'+clone[0].innerHTML+'</li>');
        },
        update: function() {
          return;
        }
      },
      stop: function () {
        var copied = $(this).data('copied');
        if (!copied) {
          this.copyHelper.remove();
        }
        this.copyHelper = null;
      },
      receive: function ( e, ui ) {
        ui.sender.data('copied', true);
        sortableIn = 1;
      },
      over: function( e, ui ) {
        sortableIn = 1;
        $('.sorting' ).removeClass("out-sortable");
      },
      out: function( e, ui ) {
        sortableIn = 0;
        $('.sorting' ).addClass("out-sortable");
      },
      beforeStop: function( e, ui ) {
        if ( sortableIn === 0 ) {
          ui.item.remove();
        }
      },
      cancel: ".disable-sort"
    });
  }, 500);
};

function checkForDuplicateGroupNames(givingOptions) {
  let dupArr = [];
  let groupedByCount = _.countBy(givingOptions, function (item) {
    return item.text;
  });

  for (var text in groupedByCount) {
    if (groupedByCount[text] > 1) {
      _.where(givingOptions, {
        text: text, type: 'group'
      }).map(function (item) {
        dupArr.push(item);
      });
    }
  };
  return dupArr;
}

Template.GivingOptions.events({
  'click #addGroupButton': function () {
    let config = ConfigDoc();
    console.log(config._id);
    Config.update({_id: config._id}, {
      $addToSet: {
        "Giving.options": {
          groupId: Random.id([8]),
          type: 'group',
          position: $(".selected-options").length
        }
      }
    });
  },
  'click #updateDropdown': function (e) {
    e.preventDefault();
    let config = ConfigDoc();

    // If section two ends with a group, highlight that group and throw an error
    if ($("#selectedGivingOptionsDiv").children().last().hasClass("group-option")) {
      Bert.alert( {
        message: "You have a group as the last part of your list, you'll need an option below it.",
        type:    'danger',
        icon:    'fa-frown-o',
        style:   'growl-bottom-right'
      } );
      let id = $("#selectedGivingOptionsDiv").children().last().attr("id");
      $("#" + id).addClass("backgroundColor");
      $("#" + id).addClass("indianred");
      return;
    }

    // If section two ends with a group, highlight that group and throw an error
    let groupsTogether = $("#selectedGivingOptionsDiv").children().map(function(index, item){
      if ($(item).prev().hasClass("group-option") && $(item).hasClass("group-option")){
        return $(item).attr("id");
      }});
    if (groupsTogether && groupsTogether.length > 0) {
      Bert.alert( {
        message: "You have group(s) together with no sub-options",
        type:    'danger',
        icon:    'fa-frown-o',
        style:   'growl-bottom-right'
      } );
      console.log(groupsTogether);
      groupsTogether.each(function(index, id){
        console.log(id);
        if (id) {
          $("#" + id).prev().addClass("backgroundColor");
          $("#" + id).prev().addClass("indianred");
        }
      });
      return;
    }


    var group = config.Giving.options;

    // Check this group for duplicate group names
    let duplicates = checkForDuplicateGroupNames(group);
    if (duplicates && duplicates.length > 1) {
      Bert.alert( {
        message: "You have duplicate group names. Each group must have a unique name.",
        type:    'danger',
        icon:    'fa-frown-o',
        style:   'growl-bottom-right'
      } );
      duplicates.forEach(function ( item ) {
        let id = item.groupId;
        $("#" + id).addClass("backgroundColor");
        $("#" + id).addClass("indianred");
      });
      return;
    }
    let elementPos;
    elementPos = _.filter( group, function(x) {
      if (x && !x.text) {
        return x.id ? x.id : x.groupId;
      }
    });

    if (elementPos && elementPos.length > 0) {
      elementPos.forEach( function ( item ) {
        let id;
        if( item.id ) {
          Bert.alert( {
            message: "You have a blank value in an option, couldn't save",
            type:    'danger',
            icon:    'fa-frown-o',
            style:   'growl-bottom-right'
          } );
          id = item.id;
        } else {
          Bert.alert( {
            message: "You have a blank value in a group, couldn't save",
            type:    'danger',
            icon:    'fa-frown-o',
            style:   'growl-bottom-right'
          } );
          id = item.groupId;
        }
        $("#" + id).addClass("backgroundColor");
        $("#" + id).addClass("indianred");
      } );
    } else {
      // Store this new order
      reorderItems();
      // TODO: remove this hack
      // hack, reload the page. I think there is a problem between the order of the elements from meteor and
      // the order that sortable has these in
      // without the reload the order isn't correct after the reorderItems() function is run
      location.reload();
    }
  },
  'change .editable-content': _.debounce(function(e){
    let text;
    let description;
    let id;
    let config = ConfigDoc();

    if ($(e.currentTarget).hasClass("group-option")) {
      text = $(e.currentTarget).val();
      id = $(e.currentTarget).attr("data-el-id");
      $("#" + id).removeClass("backgroundColor");
      $("#" + id).removeClass("indianred");
    } else {
      let type = $(e.currentTarget).attr("data-text-type");
      id = $(e.currentTarget).attr("data-el-id");
      if (type === "text") {
        text = $(e.currentTarget).val();
        $("#" + id).removeClass("backgroundColor");
        $("#" + id).removeClass("indianred");
      } else {
        description = $(e.currentTarget).val();
      }
    }


    // Store all the current options
    let configOptions = config && config.Giving && config.Giving.options;
    // Find the indexOf this particular option
    let elementPos = configOptions.map(function(x) {return x.id ? x.id : x.groupId; }).indexOf(id);
    // Update the matching object
    if (text) {
      configOptions[elementPos].text = text;
    } else if (description) {
      configOptions[elementPos].description = description;
    } else {
      configOptions[elementPos].text = text;
    }
    // Store the new version of the configOptions
    Config.update({_id: config._id}, {
      $set: {
        'Giving.options': configOptions
      }
    });
  },100),
  'click .remove-item': function(e) {
    e.preventDefault();
    let dtId = $(e.currentTarget).attr('data-el-id');
    let config = ConfigDoc();

    if(!dtId){
      Bert.alert({
        message: "Couldn't remove that item. Please save and reload the page",
        type: 'danger',
        icon: 'fa-frown-o',
        style: 'growl-bottom-right'
      });
      throw new Meteor.Error("400", "Something went wrong, there is no id on this element.");
    }
    let updateOperator = dtId.length === 8 ? {groupId: dtId} : {id: dtId};

    Config.update({_id: config._id}, {
      $pull: {
        "Giving.options": updateOperator
      }
    });

    if (dtId.length === 8) {
      Config.update({_id: config._id}, {
        $pull: {
          "Giving.guide": updateOperator
        }
      });
    }

    // Now that we have removed an item we need to update the positions of the
    // remaining options
    reorderItems();
  },
  'click :checkbox': function(e) {
    e.preventDefault();
    let dtId = $(e.target).val();
    let config = ConfigDoc();

    Config.update({_id: config._id}, {
      $addToSet: {
        "Giving.options": {
          id: dtId,
          text: $(e.target).attr('data-el-text'),
          description: $(e.target).attr('data-description') ?
            $(e.target).attr('data-description') : "",
          type: 'option',
          position: $(".selected-options").length
        }
      }
    });
  },
  'click .clear-image': function() {

    if (!confirm( "Are you sure you want to delete that image?" )) {
      return;
    }
    let uploadId = Uploads.findOne({fundId: this.id})._id;
    let uploadName = Uploads.findOne({fundId: this.id}).name;
    Uploads.remove({_id: uploadId});
    Meteor.call("deleteImageFile", uploadName, function(err){
      if(err){
        Bert.alert( {
          message: "Hmm... that didn't work",
          type:    'danger',
          icon:    'fa-frown-o',
          style:   'growl-bottom-right'
        } );
        throw new Meteor.Error("400", "Something went wrong and the user wasn't able to remove an image");
      } else {
        Bert.alert({
          message: "Removed",
          type: 'success',
          icon: 'fa-smile-o'
        });
      }
    });
  }
});

Template.GivingOptions.helpers({
  dt_funds: function () {
    let config = ConfigDoc();
    let selectedGivingOptions = config ? config.Giving.options : null;
    if(selectedGivingOptions){
      selectedGivingOptions = selectedGivingOptions.map(function(val){ return val.id; });
      if( selectedGivingOptions ) {
        return DT_funds.find({'id': {$nin: selectedGivingOptions}}, {sort: { name: 1 } });
      }
    }
    return DT_funds.find({}, {sort: { name: 1 } });
  },
  imageExists: function () {
    let id = this.id;
    return Uploads.findOne({fundId: id});
  },
  imageSrc: function () {
    if (Uploads.findOne({fundId: this.id})) {
      return Uploads.findOne({fundId: this.id}).baseUrl + Uploads.findOne({fundId: this.id}).name;
    }
    return;
  },
  givingOptions: function() {
    let config = ConfigDoc();
    let givingOptions =  config && config.Giving && config.Giving.options;
    return _.sortBy(givingOptions, 'position');
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
    return config && config._id;
  },
  twoDDSlickOptions() {
    return Session.get("showSecondLabel");
  }
});

Template.GivingOptions.onCreated(function () {
  let self = this;
  self.autorun(function() {
    self.subscribe("uploaded");
  });
});

Template.GivingOptions.onRendered(function () {
  $('[data-toggle="popover"]').popover({html: true});

  let config = ConfigDoc();
  
  if (config && config._id) {
    // Start the function to setup the table connections and make them sortable
    sortableFunction();
  } else {
    console.log('no configuration id, need to setup the giving information first');
  }

  var givingOptions = config && config.Giving && config.Giving.options;

  if(givingOptions && givingOptions.length > 0){

    $('#testDropdown').select2({
      data: _.sortBy(givingOptions, 'position'),
      dropdownCssClass: 'dropdown-inverse',
      placeholder: "Choose one"
    });
    //$("#testDropdown").select2('val',givingOptions[0].id);

    Session.set("givingOptionsChecked", givingOptions);
    let groups = _.filter( givingOptions, function(item) {
        return item && item.groupId;
      });
    Session.set("showDD", false);

    // Setup the DD-Slick version of the individual select elements
    Meteor.setTimeout(function() {
      Session.set( "showDD", true );
    }, 500);
    Meteor.setTimeout(function() {
      groups.forEach(function(item){
        let itemName = '#dd-' + item.groupId;
        $(itemName).ddslick({
          onSelected: function(selectedData) {
            $('#donateTo').val(selectedData.selectedData.value);
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
      $(".dd-container").addClass("text-center");
    }, 1000);
  }
});
