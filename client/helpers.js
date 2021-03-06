import moment from 'moment';

Template.registerHelper('formatTime', function(context) {
  if (context) {
    return moment( context ).format( 'MM/DD/YYYY, hh:mma' );
  }
});

Template.registerHelper('shortIt', function(stringToShorten, maxCharsAmount) {
  if ( stringToShorten.length <= maxCharsAmount ) {
    return stringToShorten;
  }
  return stringToShorten.substring(0, maxCharsAmount);
});

Template.registerHelper('twoDecimalPlaces', function(stringToAddDecimal) {
  return parseFloat(Math.round(stringToAddDecimal) / 100).toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
});

Template.registerHelper('formatDate', function(date, unix) {
  if (date && unix) {
    return moment.unix(new Date(date)).format('MMM DD, YYYY');
  } else if (date) {
    return moment.utc(new Date(date)).format('MMM DD, YYYY');
  }
});

Template.registerHelper('formatDateUTC', function(date) {
  return moment.utc(new Date(date)).format('MMM DD, YYYY');
});

Template.registerHelper('noteValue', function() {
  return Session.get('params.note');
});

Template.registerHelper('logged_in', function(context) {
  const user = Meteor.user();
  if (user && user.profile) {
    switch (context) {
    case "fname":
      return user.profile.fname;
    case "lname":
      return user.profile.lname;
    case "email":
      return user.emails[0].address;
    case "line1":
      return user.profile.address && user.profile.address.line1;
    case "line2":
      return user.profile.address && user.profile.address.line2;
    case "city":
      return user.profile.address && user.profile.address.city;
    case "state":
      return user.profile.address && user.profile.address.state;
    case "postal_code":
      return user.profile.address && user.profile.address.postal_code;
    case "phone":
      return user.profile.address && user.profile.phone;
    case "business_name":
      if (user.profile.business_name) {
        return user.profile.business_name;
      }
      break;
    default:
      return;
    }
  }
  return;
});

/*
 * Epoch to String
 * Convert a UNIX epoch string to human readable time.
 */
Template.registerHelper('epochToString', function(timestamp) {
  if (timestamp === 'today') {
    return moment().format('MM/DD/YY');
  }
  if (timestamp) {
    const length = timestamp.toString().length;
    if ( length === 10 ) {
      return moment.unix(timestamp).format("MM/DD/YY");
    }
    return moment.unix(timestamp / 1000).format("MM/DD/YY");
  }
});
/*
 * Epoch to String
 * Convert a UNIX epoch string to human readable time.
 */
Template.registerHelper('today', function() {
  return moment().format('D MMM, YYYY');
});

/*
 * If Equals
 * Take the two passed values and compare them, returning true if they're equal
 * and false if they're not.
 */
Template.registerHelper('equals', function(c1, c2) {
  // If case1 is equal to case2, return true, else false.
  return c1 === c2 ? true : false;
});

/*
 * Cents to Dollars
 * Take the passed value in cents and convert it to USD.
 */
Template.registerHelper('centsToDollars', function(cents) {
  return (cents / 100) || "";
});

/*
 * Percentage
 * Take the two passed values, divide them, and multiply by 100 to return percentage.
 */
Template.registerHelper('percentage', function(v1, v2) {
  return ( parseInt(v1, 10) / parseInt(v2, 10) ) * 100 + "%";
});

/*
 * Capitalize
 * Take the passed string and capitalize it. Helpful for when we're pulling
 * data out of the database that's stored in lowercase.
 */
Template.registerHelper('capitalize', function(string) {
  if (string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
});

/*
 * Limit String
 * Return the proper string based on the number of lists.
 */
Template.registerHelper('limitString', function(limit) {
  return limit > 1 ? limit + " lists" : limit + " list";
});

/*
 * Current Route
 * Return an active class if the currentRoute session variable name
 * (set in the appropriate file in /client/routes/) is equal to the name passed
 * to the helper in the template.
 */
Template.registerHelper('currentRoute', function(route) {
  return Session.equals('currentRoute', route) ? 'active' : '';
});

Template.registerHelper('MeteorUser', function() {
  if (Meteor.user()) {
    return true;
  }
  return false;
});


Template.registerHelper('campaign', function() {
  const campaign = Session.get('params.campaign');
  if (campaign === '') {
    return false;
  }
});


Template.registerHelper('locked_amount', function() {
  const locked = Session.get("params.locked_amount");
  if (locked === 'true') {
    return true;
  } else {
    return false;
  }
});

Template.registerHelper('locked_frequency', function() {
  const locked = Session.get("params.locked_frequency");
  if (locked === 'true') {
    return true;
  }
  return false;
});

Template.registerHelper('doNotShowOneTime', function() {
  const paymentMethod = Session.get("paymentMethod");
  if (paymentMethod) {
    if ( paymentMethod === "Card" || paymentMethod.slice( 0, 4 ) === 'card' ) {
      return false;
    } else {
      const config = ConfigDoc();

      if ( config && config.Settings && config.Settings.doNotAllowOneTimeACH ) {
        // set monthly
        $( "#is_recurring" ).val( "monthly" );
        $( "#is_recurring" ).change();
        return true;
      }
    }
  }
});

Template.registerHelper('forceACHDay', function() {
  let newRecurringDate;
  const config = ConfigDoc();
  const paymentMethod = Session.get("paymentMethod");

  if (paymentMethod) {
    if (paymentMethod === "Card" || paymentMethod.slice(0, 4) === 'card' ||
      (config && config.Settings && config.Settings.forceACHDay === 'any')) {
      newRecurringDate = moment().format('D MMM, YYYY');
      $("#start_date").val(newRecurringDate);
      return '';
    } else if (config && config.Settings &&
      config.Settings.ach_verification_type === 'manual' &&
      config.Settings.forceACHDay) {
      // set monthly
      $("#is_recurring").val("monthly");
      $("#is_recurring").change();
      const thisDay = Number(moment().format("D"));
      if (thisDay > Number(config.Settings.forceACHDay)) {
        newRecurringDate = moment().add(1, 'months').format(Number(config.Settings.forceACHDay) + " MMM, YYYY");
      } else {
        newRecurringDate = moment().format(Number(config.Settings.forceACHDay) + " MMM, YYYY");
      }
      $("#start_date").val(newRecurringDate);
      return 'disabled';
    }
  }
  return;
});

Template.registerHelper('onlyOnSpecificDay', function() {
  return "<i class='makeRightOfInput fa fa-question-circle' data-toggle='popover' " +
    "data-trigger='hover focus' data-container='body' " +
    "data-content='When giving by Check we can only accept monthly gifts for the day of the month shown in the box. Please allow 3 business days to process your gift.'>" +
    "</i>";
});

Template.registerHelper('collectBankAccountType', function() {
  const config = ConfigDoc();

  if (config && config.Settings && config.Settings.collectBankAccountType) {
    return true;
  }
  return false;
});

Template.registerHelper('cleanupString', function(string) {
  const cleanString = s(string).stripTags().trim().value();
  return cleanString;
});

/*
 * Add
 * Take the two passed values, add them, and divide by 100 to return dollar amount.
 */
Template.registerHelper('add', function(v1, v2) {
  if ((v1 + v2) === 0 ) return 0; // Don't want to divide by 0
  return ( v1 + v2 ) / 100;
});

Template.registerHelper('addingNew', function(type) {
  if (Session.equals("addingNew", type)) {
    return true;
  }
  return false;
});

/*
 * Is this a logged in user?
 */
Template.registerHelper( 'isCurrentUser', ( currentUser ) => {
  return currentUser === Meteor.userId();
});

Template.registerHelper( 'disableIfAdmin', ( userId ) => {
  if ( Meteor.userId() === userId ) {
    return Roles.userIsInRole( userId, 'admin' ) ? "disabled" : "";
  }
});

Template.registerHelper( 'not_dt_user', ( ) => {
  return Session.equals("NotDTUser", true);
});

Template.registerHelper( 'tutorialEnabled', ( ) => {
  return Session.get('tutorialEnabled');
});

Template.registerHelper( 'contact_us', () => {
  const config = ConfigDoc();

  return '<a class="email" href="mailto:' + config.OrgInfo.emails.contact + '">' +
    config.OrgInfo.emails.contact + '</a><div class="tel">' +
    config.OrgInfo.phone + '</div>';
});

Template.registerHelper( 'not_safari', () => {
  const userAgent = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  return userAgent;
});

/*
*  This Session var is used to see if the page should be in the loading state
 */
Template.registerHelper( 'loading', function() {
  return Session.get("loading");
});

/*
*  This Session var is used to see if the page should be in the loading state
 */
Template.registerHelper( 'searchValue', function() {
  return Session.get("searchValue");
});

Template.registerHelper('configExists', function() {
  const config = ConfigDoc();
  return config;
});

Template.registerHelper( 'stripe_ach_verification_type', () => {
  const config = ConfigDoc();

  return config &&
    config.Settings &&
    config.Settings.ach_verification_type;
});

Template.registerHelper('donor_tools_site', function() {
  const config = ConfigDoc();
  if (config && config.Settings && config.Settings.DonorTools && config.Settings.DonorTools.url) {
    return config.Settings.DonorTools.url;
  }
});

Template.registerHelper('donateToThis', function(idOrName) {
  if (! isNaN(idOrName)) {
    if (DT_funds.findOne({_id: idOrName}) && DT_funds.findOne({_id: idOrName}).name) {
      return DT_funds.findOne({_id: idOrName}).name;
    }
  }
  return idOrName;
});

Template.registerHelper('imageExists', function(type) {
  const config = ConfigDoc();
  if (config && config._id) {
    const imageDoc = Images.findOne({$and: [{configId: config._id}, {meta: {[type]: "_true"}}]});
    if (imageDoc && imageDoc._id) {
      return imageDoc;
    }
  }
  return;
});

Template.registerHelper('imageSrc', function(type) {
  if (!type) {
    return;
  }
  const config = ConfigDoc();
  if (config && config._id) {
    const imageDoc = Images.findOne({$and: [{configId: config._id}, {meta: {[type]: "_true"}}]});
    if (imageDoc && imageDoc._id) {
      if ( imageDoc
        && imageDoc.versions
        && imageDoc.versions.thumbnail
        && imageDoc.versions.thumbnail.meta
        && imageDoc.versions.thumbnail.meta.pipeFrom ) {
        return imageDoc.versions.thumbnail.meta.pipeFrom;
      }
      return '/images/spin.gif';
    }
  }
  return;
});

Template.registerHelper('imageUploadCallback', function() {
  return {
    validate: function(file) {
        // 10485760 = 10 Megabytes
      const maxFileSize = 10485760;
      const sizeInMB = maxFileSize / 1048576;
      if (!file) {
        alert("Sorry, that failed. Make sure you are using a .gif, .png, .jpg or .jpeg file.");
      }
        // Check to see if the type of the file matches one of the image types listed in this array
      if (['image/gif', 'image/png', 'image/jpg', 'image/jpeg'].indexOf(file[0].type) === -1) {
        alert("The only image types you can use are png, gif, jpg or jpeg");
        return false;
      }
      if (maxFileSize < file[0].size) {
        alert("The file size is to large, it must be under " + sizeInMB + "MB");
        return false;
      }
      return 'all done';
    },
    finished: function( index, fileInfo, context ) {
      return;
    }
  };
});

Template.registerHelper('givingOptionsGroup', function() {
  const config = ConfigDoc();
  const givingOptions = config && config.Giving && config.Giving.options;

  if ( givingOptions && givingOptions.length > 0 ) {
    const groups = [];
    givingOptions.forEach(function( item ) {
      if (item.type === 'group') {
        groups.push(item);
      }
    });
    return groups;
  }
});

Template.registerHelper('givingOptionsMember', function() {
  const config = ConfigDoc();
  const givingOptions = config && config.Giving && config.Giving.options;

  const groupId = this.groupId;
  const members = [];
  givingOptions.forEach(function( item ) {
    if (item.currentGroup === groupId) {
      members.push(item);
    }
  });
  return members;
});


Template.registerHelper('calculateFees', function(fees) {
  return (fees / 100).toFixed(2);
});


Template.registerHelper('paymentWithCard', function() {
  if(Session.get("paymentMethod")){
    return Session.get("paymentMethod") === 'Card' || Session.get("paymentMethod").slice(0, 3) === 'car';
  }
  return;
});

/*
 Get the array index and return 'even' for even numbers
 and 'odd' for odd numbers
 */
Template.registerHelper('oddEven', function(index) {
  if ((index % 2) === 0) return 'even';
  return 'odd';
});

Template.registerHelper('selected', function() {
  if (Session.get("ach_page") || Session.get("change_donateTo")) {
    if (Session.get("change_donateTo")) {
      return Session.get("change_donateTo") === this.id ? "selected" : '';
    }
    return;
  }
  if (DonationFormItems.findOne() || Meteor.userId()) {
    const id = (Template.parentData(2) && Template.parentData(2)._id) || (Template.parentData(1) && Template.parentData(1)._id);
    if (!id) {
      return DonationFormItems.findOne({name: 'first'}) && DonationFormItems.findOne({name: 'first'}).donateTo === this.id ? "selected" : '';
    }
    return DonationFormItems.findOne({_id: id}) && DonationFormItems.findOne({_id: id}).donateTo === this.id ? "selected" : '';
  }
});

Template.registerHelper('selectedExpiration', function(objectKey, objectValue) {
  const customerDeviceType = Customers.findOne() && Customers.findOne().sources.data[0][objectKey];
  return customerDeviceType === Number(objectValue) ? "selected" : '';
});


Template.registerHelper('coverTheFeesChecked', function() {
  if (Session.get("subscription")) {
    const subscription = Subscriptions.findOne({_id: Session.get("subscription")});
    Meteor.setTimeout(function() {
      $("#coverTheFees").change();
    }, 300);
    return subscription && subscription.metadata && subscription.metadata.coveredTheFees === 'true' ? 'checked' : '';
  }
  return this.coverTheFees ? 'checked' : '';
});

Template.registerHelper('splitDesignations', function() {
  let splitText = "";
  let type;
  let thisQueryValue;

  if (this._id && this._id.substring(0, 2) === 'ch') {
    type = 'charge_id';
    thisQueryValue = this._id;
  } else if (this._id && this._id.substring(0, 3) === 'sub') {
    type = 'subscription_id';
    thisQueryValue = this._id;
  } else if (this.method && this.method === 'manualACH') {
    type = null;
    thisQueryValue = this.donationSplitsId;
  }
  const thisQueryKey = type ? type : '_id';
  const splits = DonationSplits.findOne({[thisQueryKey]: thisQueryValue});
  if (splits) {
    splits.splits.forEach(function( split ) {
      const donateToText = DT_funds.findOne({id: split.donateTo}) &&
        DT_funds.findOne({id: split.donateTo}).name;
      if (donateToText) splitText += donateToText + " <br>";
      else splitText += "Unknown <br>";
    });
    return splitText;
  }
});


Template.registerHelper('isResubscribe', function() {
  if (Session.equals("resubscribe", "true")) {
    return true;
  }
});


Template.registerHelper('paramsDonateTo', function() {
  if (Session.get("params.donateTo")) {
    return Session.get("params.donateTo");
  }
});


Template.registerHelper('fundName', function() {
  if (DT_funds.findOne({_id: this.fund_id.toString()}) && DT_funds.findOne({_id: this.fund_id.toString()}).name) {
    return '<span>' + DT_funds.findOne({_id: this.fund_id.toString()}).name + '</span>';
  }
  return '<span style="color: red;">Finding fund...</span>';
});

Template.registerHelper('noDTPersonaID', function() {
  const user = Meteor.user();
  if (user && ( (user.persona_ids && user.persona_ids[0]) || (user.persona_id && user.persona_id[0]) ) ) {
    return false;
  }
  return true;
});

Template.registerHelper('giftTotal', function() {
  const total = Session.get("giftAmount");
  if (total) {
    return total;
  }
});
Template.registerHelper('showGiftTotal', function() {
  if (DonationFormItems.find() && DonationFormItems.find().count() > 1) {
    return true;
  }
  if ( Session.get("coverTheFees") ) {
    return true;
  }
  return false;
});
