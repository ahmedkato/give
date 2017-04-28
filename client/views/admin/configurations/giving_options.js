import { clearImage } from '/imports/api/miscFunctions';

function reorderItems(dontFlash) {
  // This is here because the UI does a weird shuffle of the elements when you turn off
  // the sortable by using 'cancel'. Also, it serves to show the user that
  // we did something, namely, we saved their changes.
  if (!dontFlash) {
    $("#selectedGivingOptionsDiv").fadeOut(200).fadeIn(200);
  }

  Meteor.setTimeout(()=> {
    const config = ConfigDoc();
    let orderOfOptions = $("#selectedGivingOptionsDiv").sortable("toArray"),
      newOptionsOrder = [],
      currentGroup;
    //const givingOptions = config && config.Giving && config.Giving.options;
    const givingOptions = Session.get("givingOptionsChecked");


    orderOfOptions.forEach(function(id, index) {
      givingOptions.map((item)=> {
        if (item.type === 'group') {
          currentGroup = item.groupId;
        } else {
          item.currentGroup = currentGroup;
        }
        if (item.id === id || item.groupId === id) {
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
    Session.set("givingOptionsChecked", newOptionsOrder);

    if (!dontFlash) {
      $(".sortable").sortable("cancel");
    }
  }, 202);
}

function sortableFunction() {
  Meteor.setTimeout(function() {
    $(".sortable").sortable({
      cursor: 'move',
      dropOnEmpty: true,
      handle: '.fa-arrows',
      helper: function(e, li) {
        this.copyHelper = li.clone().insertAfter(li);
        $(this).data('copied', false);
        return li.clone();
      },
      start: function( e, ui ) {
        clone = $(ui.item[0].outerHTML).clone();
      },
      placeholder: {
        element: function(clone) {
          return $('<div class="row selected-options sortable-clone">' + clone[0].innerHTML + '</li>');
        },
        update: function() {
          return;
        }
      },
      stop: function() {
        const copied = $(this).data('copied');
        if (!copied) {
          this.copyHelper.remove();
        }
        this.copyHelper = null;
      },
      receive: function( e, ui ) {
        ui.sender.data('copied', true);
        sortableIn = 1;
      },
      over: function() {
        sortableIn = 1;
        $('.sorting' ).removeClass("out-sortable");
      },
      out: function() {
        sortableIn = 0;
        $('.sorting' ).addClass("out-sortable");
      },
      beforeStop: function( e, ui ) {
        if ( sortableIn === 0 ) {
          ui.item.remove();
        }
      },
      update(e, ui) {
        console.log(e);
        console.log(ui);
        reorderItems();
      },
      cancel: ".disable-sort"
    });
  }, 500);
}

function checkForDuplicateGroupNames(givingOptions) {
  const dupArr = [];
  const groupedByCount = _.countBy(givingOptions, function(item) {
    return item.text;
  });

  for (const text in groupedByCount) {
    if (groupedByCount[text] > 1) {
      _.where(givingOptions, {
        text: text, type: 'group'
      }).map(function(item) {
        dupArr.push(item);
      });
    }
  }
  return dupArr;
}

function updateText( id, type, value ) {
  const config = ConfigDoc();
  $("#" + id).removeClass("backgroundColor");
  $("#" + id).removeClass("indianred");
  // Store all the current options
  const configOptions = config && config.Giving && config.Giving.options;
  // Find the indexOf this particular option
  const elementPos = configOptions.map(function(x) {
    return x.id ? x.id : x.groupId;
  }).indexOf(id);

  // Update the matching object
  if (type === 'text') {
    configOptions[elementPos].text = value;
  } else if (type === 'description') {
    configOptions[elementPos].description = value;
  }

  // Store the new version of the configOptions
  Config.update({_id: config._id}, {
    $set: {
      'Giving.options': configOptions
    }
  });
}

Template.GivingOptions.events({
  'click #addGroupButton': function() {
    const config = ConfigDoc();
    console.log(config._id);
    Config.update({_id: config._id}, {
      $addToSet: {
        "Giving.options": {
          groupId: Random.id([8]),
          type: 'group',
          position: $(".selected-options").length,
          guideShow: false
        }
      }
    });

    Session.set("givingOptionsChecked", Config.findOne().Giving.options);
    reorderItems(true);
  },
  'click #addTripsOption': function(e) {
    e.preventDefault();
    console.log('Clicked addTripsOption');
    const config = ConfigDoc();

    Config.update({_id: config._id}, {
      $addToSet: {
        "Giving.options": {
          id: 'trips',
          text: 'trips',
          description: '',
          type: 'option',
          position: $(".selected-options").length
        }
      }
    });
    Session.set("givingOptionsChecked", Config.findOne().Giving.options);
    reorderItems(true);
  },
  'click #updateDropdown': function(e) {
    e.preventDefault();
    const config = ConfigDoc();

    // If section two ends with a group, highlight that group and throw an error
    if ($("#selectedGivingOptionsDiv").children().last().hasClass("group-option")) {
      Bert.alert( {
        message: "You have a group as the last part of your list, you'll need an option below it.",
        type: 'danger',
        icon: 'fa-frown-o',
        style: 'growl-bottom-right'
      } );
      const id = $("#selectedGivingOptionsDiv").children().last().attr("id");
      $("#" + id).addClass("backgroundColor");
      $("#" + id).addClass("indianred");
      return;
    }

    // If section two ends with a group, highlight that group and throw an error
    const groupsTogether = $("#selectedGivingOptionsDiv").children().map(function(index, item) {
      if ($(item).prev().hasClass("group-option") && $(item).hasClass("group-option")) {
        return $(item).attr("id");
      }
    });
    if (groupsTogether && groupsTogether.length > 0) {
      Bert.alert( {
        message: "You have group(s) together with no sub-options",
        type: 'danger',
        icon: 'fa-frown-o',
        style: 'growl-bottom-right'
      } );
      groupsTogether.each(function(index, id) {
        if (id) {
          $("#" + id).prev().addClass("backgroundColor");
          $("#" + id).prev().addClass("indianred");
        }
      });
      return;
    }

    const group = config.Giving.options;

    // Check this group for duplicate group names
    const duplicates = checkForDuplicateGroupNames(group);
    if (duplicates && duplicates.length > 1) {
      Bert.alert( {
        message: "You have duplicate group names. Each group must have a unique name.",
        type: 'danger',
        icon: 'fa-frown-o',
        style: 'growl-bottom-right'
      } );
      duplicates.forEach(function( item ) {
        const id = item.groupId;
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
      elementPos.forEach( function( item ) {
        let id;
        if ( item.id ) {
          Bert.alert( {
            message: "You have a blank value in an option, couldn't save",
            type: 'danger',
            icon: 'fa-frown-o',
            style: 'growl-bottom-right'
          } );
          id = item.id;
        } else {
          Bert.alert( {
            message: "You have a blank value in a group, couldn't save",
            type: 'danger',
            icon: 'fa-frown-o',
            style: 'growl-bottom-right'
          } );
          id = item.groupId;
        }
        $("#" + id).addClass("backgroundColor");
        $("#" + id).addClass("indianred");
      } );
    } else {
      const readyToReload = reorderItems();
      location.reload();
    }
  },
  'input .group-input, input .option-text': _.debounce(function(e) {
    const id = $(e.currentTarget).attr("data-el-id");
    const text = $(e.currentTarget).val();
    console.log(id, text);
    updateText(id, 'text', text);
  }, 500),
  'input .option-description': _.debounce(function(e) {
    const id = $(e.currentTarget).attr("data-el-id");
    const description = $(e.currentTarget).val();
    console.log(id, description);
    updateText(id, 'description', description);
  }, 500),
  'click .remove-item': function(e) {
    e.preventDefault();
    const dtId = $(e.currentTarget).attr('data-el-id');
    const config = ConfigDoc();

    if (!dtId) {
      Bert.alert({
        message: "Couldn't remove that item. Please save and reload the page",
        type: 'danger',
        icon: 'fa-frown-o',
        style: 'growl-bottom-right'
      });
      throw new Meteor.Error("400", "Something went wrong, there is no id on this element.");
    }
    const updateOperator = dtId.length === 8 ? {groupId: dtId} : {id: dtId};

    Config.update({_id: config._id}, {
      $pull: {
        "Giving.options": updateOperator
      }
    });
    Session.set("givingOptionsChecked", Config.findOne().Giving.options);

    // Now that we have removed an item we need to update the positions of the
    // remaining options
    reorderItems(true);
  },
  'click :checkbox': function(e) {
    e.preventDefault();
    const dtId = $(e.target).val();
    const config = ConfigDoc();

    const updateConfig = Config.update({_id: config._id}, {
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
    Session.set("givingOptionsChecked", Config.findOne().Giving.options);
    reorderItems();
  },
  'click .clear-image': function(e) {
    const type = $( e.currentTarget ).data( 'el-type' );
    return clearImage( type );
  }
});

Template.GivingOptions.helpers({
  dt_funds: function() {
    const config = ConfigDoc();
    let selectedGivingOptions = Session.get("givingOptionsChecked");
    if (selectedGivingOptions) {
      selectedGivingOptions = selectedGivingOptions.map(function(val) { return val.id; });
      if ( selectedGivingOptions ) {
        return DT_funds.find({'id': {$nin: selectedGivingOptions}}, {sort: { name: 1 } });
      }
    }
    return DT_funds.find({}, {sort: { name: 1 } });
  },
  givingOptions: function() {
    const givingOptions = Session.get("givingOptionsChecked");
    if(givingOptions){
      givingOptions.sort(function(a, b) {
        return a.position - b.position;
      });
      return givingOptions;
    }
    return null;
  },
  donationGroups: function() {
    const givingOptions = Session.get("givingOptionsChecked");

    const groups = _.filter( givingOptions, function(item) {
      return item && item.groupId;
    });
    const donationGroups = groups.map(function(group) {
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
    const config = ConfigDoc();
    return config && config._id;
  },
  twoDDSlickOptions() {
    return Session.get("showSecondLabel");
  }
});

Template.GivingOptions.onCreated(function() {
  Meteor.call("get_dt_funds", function(error, result) {
    if (result) {
      console.log("Got all funds");
    } else {
      console.error( error.message );
    }
  });

  this.autorun(() => {
    this.subscribe('wholeConfigDoc');
    this.subscribe('userDTFunds');
  });
});

Template.GivingOptions.onRendered(function() {
  $('[data-toggle="popover"]').popover({html: true});

  const config = ConfigDoc();

  if (config && config._id) {
    // Start the function to setup the table connections and make them sortable
    sortableFunction();
  } else {
    console.log('no configuration id, need to setup the giving information first');
  }

  const givingOptions = config && config.Giving && config.Giving.options;
  Session.set("givingOptionsChecked", givingOptions);

  if (givingOptions && givingOptions.length > 0) {
    Session.set("givingOptionsChecked", givingOptions);
    const groups = _.filter( givingOptions, function(item) {
      return item && item.groupId;
    });
    Session.set("showDD", false);

    // Setup the DD-Slick version of the individual select elements
    Meteor.setTimeout(function() {
      Session.set( "showDD", true );
    }, 500);
    Meteor.setTimeout(function() {
      groups.forEach(function(item) {
        const itemName = '#dd-' + item.groupId;
        $(itemName).ddslick({
          onSelected: function(selectedData) {
            $('[name="donateTo"]').val(selectedData.selectedData.value);
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
          onSelected: _.debounce(function(selectedData) {
            groups.forEach(function(item) {
              const itemName = '#dd-' + item.groupId;
              if ( selectedData.selectedData.value !== item.groupId) {
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
  $( "[data-toggle='tooltip']" ).tooltip();
});
