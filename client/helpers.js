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
    return moment.unix(date).format('MMM DD, YYYY');
  } else if (date) {
    return moment(date).format('MMM DD, YYYY');
  }
});

Template.registerHelper('writeInValue', function() {
  return Session.get('params.enteredWriteInValue');
});

Template.registerHelper('logged_in', function(context) {
  if (Meteor.user()) {
    switch (context) {
      case "fname":
        return Meteor.user().profile.fname;
        break;
      case "lname":
        return Meteor.user().profile.lname;
        break;
      case "email":
        return Meteor.user().emails[0].address;
        break;
      case "line1":
        return Meteor.user().profile.address.line1;
        break;
      case "line2":
        return Meteor.user().profile.address.line2;
        break;
      case "city":
        return Meteor.user().profile.address.city;
        break;
      case "state":
        return Meteor.user().profile.address.state;
        break;
      case "postal_code":
        return Meteor.user().profile.address.postal_code;
        break;
      case "phone":
        return Meteor.user().profile.phone;
        break;
      case "business_name":
        if (Meteor.user().profile.business_name) {
          return  Meteor.user().profile.business_name;
        }
        break;
      default:
        return;
    }
  }
  else {
    return;
  }
});

/*
 * Epoch to String
 * Convert a UNIX epoch string to human readable time.
 */

Template.registerHelper('epochToString', function(timestamp) {
  if (timestamp) {
    var length = timestamp.toString().length;
    if ( length === 10 ) {
      return moment.unix(timestamp).format("MM/DD/YY");
    }
    return moment.unix(timestamp / 1000).format("MM/DD/YY");
  }
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
  return "$" + cents / 100;
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
  var campaign = Session.get('params.campaign');
  if (campaign === '') {
    return false;
  }
});


Template.registerHelper('locked_amount', function() {
  var locked = Session.get("params.locked_amount");
  if (locked === 'true') {
    return true;
  } else {
    return false;
  }
});

Template.registerHelper('locked_frequency', function() {
  var locked = Session.get("params.locked_frequency");
  if (locked === 'true') {
    return true;
  }
  return false;
});

Template.registerHelper('doNotShowOneTime', function() {
  if (Session.equals("paymentMethod", "Card")) {
    return false;
  } else {
    let config = ConfigDoc();

    if (config && config.Settings && config.Settings.doNotAllowOneTimeACH) {
      // set monthly
      $("#is_recurring").val("monthly");
      $("#is_recurring").change();
      return true;
    }
  }
});

Template.registerHelper('forceACHDay', function() {
  let newRecurringDate;
  let config = ConfigDoc();

  if (Session.equals("paymentMethod", "Card") ||
    (config && config.Settings && config.Settings.forceACHDay === 'any')) {
    newRecurringDate =  moment().format('D MMM, YYYY');
    $("#start_date").val(newRecurringDate);
    return '';
  } else {
    if (config && config.Settings && config.Settings.forceACHDay) {
      // set monthly
      $("#is_recurring").val("monthly");
      $("#is_recurring").change();
      let thisDay = Number(moment().format("D"));
      if(thisDay > Number(config.Settings.forceACHDay)) {
        newRecurringDate = moment().add(1, 'months').format(Number(config.Settings.forceACHDay) + " MMM, YYYY");
      } else {
        newRecurringDate = moment().format(Number(config.Settings.forceACHDay) + " MMM, YYYY");
      }
      $("#start_date").val(newRecurringDate);
      return 'disabled';
    }
  }
});

Template.registerHelper('collectBankAccountType', function() {
  let config = ConfigDoc();

  if (config && config.Settings && config.Settings.collectBankAccountType) {
    return true;
  }
  return false;
});

Template.registerHelper('cleanupString', function(string) {
  var cleanString = s(string).stripTags().trim().value();
  return cleanString;
});

/*
 * Subtract
 * Take the two passed values, subtract them, and divide by 100 to return dollar amount.
 */

Template.registerHelper('subtract', function(v1, v2) {
  // Don't want to divide by 0 or a negative
  if (v1 <= v2) {
    return;
  }
  return ( v1 - v2 ) / 100;
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

Template.registerHelper( 'contact_us', ( ) => {
  let config = ConfigDoc();

  return '<a class="email" href="mailto:' +  config.OrgInfo.emails.contact && + '">' +
    config.OrgInfo.emails.support + '</a><div class="tel">' +
    config.OrgInfo.emails.phone + '</div>';
});

Template.registerHelper( 'not_safari', () => {
  let user_agent = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  return user_agent;
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
  let config = ConfigDoc();
  return config;
});

Template.registerHelper( 'stripe_ach_verification_type', () => {
  let config = ConfigDoc();

  return config &&
    config.Settings &&
    config.Settings.ach_verification_type;
});
