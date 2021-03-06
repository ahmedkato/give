const later = require('later');
var config = Config.findOne({
  'OrgInfo.web.domain_name': Meteor.settings.public.org_domain
});
var DONORTOOLSAUTH = Meteor.settings.donor_tools_user + ':' + Meteor.settings.donor_tools_password;
var DONORTOOLSINDVSOURCEID = config &&
  config.Settings &&
  config.Settings.DonorTools &&
  config.Settings.DonorTools.defaultSourceIdForIndividualDonor;
var DONORTOOLSORGSOURCEID = config &&
  config.Settings &&
  config.Settings.DonorTools &&
  config.Settings.DonorTools.defaultSourceIdForOrganizationDonor;

const getFundId = (donateTo)=> {
  const dtFund = Utils.processDTFund( donateTo );

  if ( !dtFund ) {
    return config.Settings.DonorTools.defaultFundId;
  }
  return dtFund;
};

const getMemo = (donateTo, splitMemo, chargeId, customerId, metadata)=> {
  const dtFund = Utils.processDTFund( donateTo );
  let memo;

  // fund_id should be the No-Match-Found fund used to help reconcile
  // write-in gifts and those not matching a fund in DT
  if ( !dtFund ) {
    memo = Meteor.settings.dev +
      (metadata &&
      metadata.frequency &&
      metadata.frequency.charAt( 0 ).toUpperCase() +
      metadata.frequency.slice( 1 ) + " " + donateTo);
  } else {
    memo = Meteor.settings.dev +
      (metadata &&
      metadata.frequency &&
      metadata.frequency.charAt( 0 ).toUpperCase() +
      metadata.frequency.slice( 1 ));
  }
  if ( !memo ) {
    logger.error( chargeId || "Not using a chargeId", customerId );
    logger.error( metadata );
    logger.error( "Something went wrong above, it looks like there is no metadata on this object." );
  }
  if ( splitMemo ) {
    memo = memo + " " + splitMemo;
  }
  return memo;
};

const getMetadata = (chargeCursor) => {
  let metadata, invoiceCursor;
  if ( chargeCursor.id.slice( 0, 2 ) === 'ch' || chargeCursor.id.slice( 0, 2 ) === 'py' ) {
    if ( chargeCursor.invoice ) {
      invoiceCursor = Invoices.findOne( { _id: chargeCursor.invoice } );
      if ( invoiceCursor &&
        invoiceCursor.lines &&
        invoiceCursor.lines.data[0] &&
        invoiceCursor.lines.data[0].metadata ) {
        metadata = invoiceCursor.lines.data[0].metadata;
      } else {
        metadata = chargeCursor.metadata;
      }
    } else {
      metadata = chargeCursor.metadata;
    }
  } else {
    // TODO: this area is to be used in case we start excepting bitcoin or
    // other payment methods that return something other than a ch_  or py_
    // event object id
  }
  return metadata;
};

getSourceId = (customerCursor, metadata) => {
  let sourceId;
  if ( customerCursor && customerCursor.metadata && customerCursor.metadata.business_name ) {
    if (metadata.dt_source) {
      sourceId = metadata.dt_source;
    } else {
      sourceId = DONORTOOLSORGSOURCEID;
    }
  } else if ( metadata && metadata.dt_source ) {
    sourceId = metadata.dt_source;
  } else {
    sourceId = DONORTOOLSINDVSOURCEID;
  }
  return sourceId;
};

getBusinessName = (customerCursor) => {
  let businessName;
  if ( customerCursor && customerCursor.metadata && customerCursor.metadata.business_name ) {
    businessName = customerCursor.metadata.business_name;
  }
  return businessName;
};

/**
 * Utils is the main function object on the server side
 * it contains most of the functions we might use inside our Methods or
 * in response to a webhook
 */
Utils = {
  /**
   * General purpose http gettter
   * cRud (R in CRUD)
   * http://docs.meteor.com/#/full/http_call
   *
   * @method http_get_donortools
   * @param {String} getQuery - The query string that should be attached to this request
   */
  http_get_donortools( getQuery ) {
    logger.info( "Started http_get_donortools" );
    logger.info( "getQuery:", getQuery );
    const config = ConfigDoc();

    const getURL = config &&
      config.Settings &&
      config.Settings.DonorTools &&
      config.Settings.DonorTools.url;

    if ( getURL ) {
      logger.info("Donor Tools URL to use in get:", getURL);
      try {
        const getResource = HTTP.get( getURL + getQuery, {
          auth: DONORTOOLSAUTH
        } );
        return getResource;
      } catch ( e ) {
        // The statusCode should show us if there was a connection problem or network error
        throw new Meteor.Error( e.statusCode, e );
      }
    } else {
      logger.error( 'No DonorTools url setup' );
      throw new Meteor.Error( 400, 'No DonorTools url setup' );
    }
  },
  get_stripe_customer( stripe_customer_id ) {
    logger.info( "Started get_stripe_customer" );
    logger.info( "Stripe customer id: " + stripe_customer_id );
    const stripe_customer = StripeFunctions.stripe_retrieve( 'customers',
      'retrieve',
      stripe_customer_id, '' );

    return stripe_customer;
  },
  // Check donation form entries
  check_update_customer_form( form, dt_persona_id, updateThisUser ) {
    check( form, {
      'address': {
        'address_line1': String,
        'address_line2': Match.Maybe( String ),
        'city': String,
        'state': String,
        'postal_code': String
      },
      'phone': String
    } );
    check( dt_persona_id, Number );
    check(updateThisUser, Match.Maybe(String));
  },
  // Check donation form entries
  checkFormFields(form) {
    // Check all the form fields from the donation forms
    check( form, {
      paymentInformation: {
        campaign: Match.Maybe( String ),
        coverTheFees: Boolean,
        created_at: Number,
        donateWith: Match.Maybe( String ),
        dt_source: Match.Maybe( String ),
        fees: Match.Maybe( Number ),
        href: Match.Maybe( String ),
        is_recurring: Match.OneOf( "one_time", "monthly", "yearly", "semi-annually", "weekly", "bi-weekly" ),
        later: Match.Maybe( Boolean ),
        method: Match.Maybe( String ),
        saved: Boolean,
        send_scheduled_email: Match.Maybe( String ),
        source_id: Match.Maybe( String ),
        start_date: Match.Maybe( String ),
        token_id: Match.Maybe( String ),
        total_amount: Match.Integer,
        type: String,
        fee: Match.Maybe( Number ),
        splits: Match.Maybe( [{
          _id: String,
          amount: Number,
          donateTo: String,
          name: Match.Maybe(String),
          item: Match.Maybe(Number),
          memo: Match.Maybe(String)
        }])
      },
      customer: {
        fname: String,
        lname: String,
        org: Match.Maybe( String ),
        email_address: String,
        phone_number: Match.Maybe( String ),
        address_line1: String,
        address_line2: Match.Maybe( String ),
        region: String,
        city: String,
        postal_code: String,
        country: Match.Maybe( String ),
        created_at: Number,
        id: Match.Maybe( String )
      },
      sessionId: String
    } );
  },
  checkLoginForm( form ) {
    check( form, {
      username: String,
      password: String
    } );
  },
  GetDTData( fundsList, dateStart, dateEnd ) {
    logger.info( "Started GetDTData Utils method (not method call)" );

    check( fundsList, [Number] );
    check( dateStart, String );
    check( dateEnd, String );
    fundsList.forEach( function( fundId ) {
      Utils.getFundHistory( fundId, dateStart, dateEnd );
    } );
    logg.er.log( "Got all funds history" );
    return;
  },
  /**
   * Get the Donor Tools split data for the trip funds
   *
   * @method updateTripFunds
   * @param {String} dateStart - Today - x days
   * @param {String} dateEnd - Today
   */
  updateTripFunds: function(dateStart, dateEnd) {
    logger.info("Started updateTripFunds Utils method (not method call)");

    check(dateStart, Match.Maybe(String));
    check(dateEnd, Match.Maybe(String));
    try {
      const fundsList = Trips.find().map( function( trip ) {
        return trip.fundId;
      });
      logger.info( "Trips funds list: " + fundsList );

      fundsList.forEach( function( fundId ) {
        const funds = Utils.getFundHistory( fundId,
          dateStart ? dateStart : "",
          dateEnd ? dateEnd : "" );

        const dtSplits = DT_splits.find({fund_id: Number(fundId)});
        console.log(dtSplits.fetch());
        const amount = dtSplits.fetch().reduce(function( prevValue, item ) {
          return prevValue + item.amount_in_cents;
        }, 0);

        Trips.update({fundId: fundId}, {$set: {
          fundTotal: amount / 100
        }});
      });
    } catch ( e ) {
      // Got a network error, time-out or HTTP error in the 400 or 500 range.
      return false;
    }
    return "Got all funds history for the trips listed";
  },
  update_dt_account( form, dt_persona_id, updateThisUser ) {
    logger.info( "Inside update_dt_account." );
    const config = ConfigDoc();
    let id;
    if (updateThisUser) {
      id = updateThisUser;
    } else {
      id = Meteor.userId();
    }

    const get_dt_persona = Utils.http_get_donortools(
      '/people/' + dt_persona_id + '.json' );

    // Store the relevant object
    let persona = get_dt_persona.data.persona;

    // Get the IDs needed to update the object
    const address_id = get_dt_persona.data.persona.addresses[0].id;
    const phone_id = get_dt_persona.data.persona.phone_numbers[0].id;

    // Reinitialize a blank persona record
    persona = {};

    // Shape the data the way it needs to go into the persona record
    const street_address = form.address.address_line1 + " \n" + form.address.address_line2;
    persona.addresses = [];
    persona.addresses[0] = {
      "id": address_id,
      "city": form.address.city,
      "state": form.address.state,
      "street_address": street_address,
      "postal_code": form.address.postal_code
    };
    persona.phone_numbers = [];
    persona.phone_numbers[0] = {
      "id": phone_id,
      phone_number: form.phone
    };

    const update_persona = HTTP.call( "PUT", config.Settings.DonorTools.url + '/people/' + dt_persona_id + '.json',
      {
        data: { "persona": persona },
        auth: DONORTOOLSAUTH
      } );

    const insertedPersonaInfo = Meteor.users.update( {
      _id: id,
      'persona_info.id': dt_persona_id
    }, { $set: {
      'persona_info.$': update_persona.data.persona
    }
    }
    );
  },
  getFundHistory( fundId, dateStart, dateEnd ) {
    logger.info( "Got to getFundHistory with fund_id: " + fundId +
      "Start Date: " + dateStart + " End Date: " + dateEnd);

    let totalPages = 3;
    for ( i = 1; i <= totalPages; i++ ) {
      let dataResults;
      let query;
      if (dateStart && dateEnd) {
        query = '/splits.json?basis=cash&fund_id=' + fundId + '&range[from]=' +
          dateStart + '&range[to]=' + dateEnd + '&page=' + i + '&per_page=1000';
      } else {
        query = '/splits.json?basis=cash&fund_id=' + fundId + '&page=' + i +
          '&per_page=1000';
      }
      dataResults = Utils.http_get_donortools( query );

      Utils.store_splits( dataResults.data );
      dataResults = Utils.http_get_donortools( query );

      // take the array of donations and only get the unique donations in that array
      const uniqueDonations = _.unique(dataResults.data, function(split) {return split.split.donation_id;});

      // Now get only the IDs from that unique list
      const uniqueDonationIDs = uniqueDonations.map(function(split) {return split.split.donation_id;});
      Utils.store_donations(uniqueDonationIDs);

      totalPages = dataResults.headers['pagination-total-pages'];
    }
  },
  store_donations( donationIDs ) {
    logger.info("Started store_donations");
    donationIDs.forEach(function(id) {
      const donation = Utils.http_get_donortools(
        '/donations/' + id + '.json' );
      DT_donations.upsert( { _id: donation.data.donation.id }, { $set: donation.data.donation } );
    });
  },
  store_splits( donations ) {
    logger.info("donations");
    logger.info(donations);

    donations.forEach( function( split ) {
      DT_splits.upsert( { _id: split.split.id }, { $set: split.split } );
    } );
  },
  update_dt_donation_status( event_object ) {
    logger.info( "Started update_dt_donation_status" );
    const config = ConfigDoc();

    let transaction_id, get_dt_donation, update_donation, dt_donation_id;

    transaction_id = event_object.data.object.id;

    get_dt_donation = Utils.http_get_donortools( '/donations.json?transaction_id=' + transaction_id );

    if (get_dt_donation &&
        get_dt_donation.data &&
        get_dt_donation.data[0] &&
        get_dt_donation.data[0].donation &&
        get_dt_donation.data[0].donation.id) {
      dt_donation_id = get_dt_donation.data[0].donation.id;
    } else {
      logger.error("There is no record of the transaction in DT, but we have it in the DT_Donation collection");
      return;
    }

    if ( get_dt_donation.data[0].donation.payment_status === event_object.data.object.status && !event_object.data.object.refunded ) {
      return;
    }

    if ( event_object.data.object.refunded ) {
      logger.warn("charge is showing refunded");

      get_dt_donation.data[0].donation.payment_status = 'refunded';
      get_dt_donation.data[0].donation.splits[0].amount_in_cents = 0;
      const createdDate = moment.unix( event_object.data.object.refunds.data[0].created ).format( "YYYY/MM/DD hh:mma" );
      const refundedAmount = event_object.data.object.amount_refunded / 100;

      const donationMemo = "The charge was refunded on " + createdDate +
        ". The original charge amount was $" + refundedAmount;
      get_dt_donation.data[0].donation.memo = donationMemo;
    } else {
      get_dt_donation.data[0].donation.payment_status = event_object.data.object.status;
    }

    if ( event_object.data.object.status === 'failed' ) {
      get_dt_donation.data[0].donation.splits[0].amount_in_cents = 0;
      const createdDate = moment.unix( event_object.data.object.created ).format( "YYYY/MM/DD hh:mma" );
      const failedAmount = (event_object.data.object.amount / 100).toFixed(2);

      const donationMemo = "The charge failed on " + createdDate +
        ". The original charge amount was $" + failedAmount + '. The failed reason was "' +
        event_object.data.object.failure_message + '"';
      get_dt_donation.data[0].donation.memo = donationMemo;
      // The failed type in Donor Tools
      get_dt_donation.data[0].donation.donation_type_id = config.Settings.DonorTools.failedDonationTypeId;
    }

    update_donation = HTTP.call( "PUT", config.Settings.DonorTools.url + '/donations/' + dt_donation_id + '.json',
      {
        data: { "donation": get_dt_donation.data[0].donation },
        auth: DONORTOOLSAUTH
      } );

    logger.info( "Updated donation Object: " );
    logger.info( update_donation );
    DT_donations.upsert( { _id: dt_donation_id }, update_donation.data.donation );
  },
  find_dt_persona_flow( email, customer_id ) {
    logger.info( "Started find_dt_persona_flow" );

    let personResult, matched_id, orgMatch, personMatch;

    // Get all the ids that contain this email address.
    personResult = Utils.http_get_donortools(
      "/people.json?search=" + email + "&fields=email_address"
    );

    logger.info("personResult from DT: ", (personResult && personResult.data));
    if ( personResult && personResult.data && personResult.data.length === 0 ) {
      // Didn't find a DT person
      // Schedule welcome email
      Utils.send_welcome_email(email);
    }
    const metadata = Customers.findOne( { _id: customer_id } ).metadata;
    if ( metadata.business_name ) {
      orgMatch = _.find( personResult.data, function( value ) {
        return value.persona.company_name;
      } );
      if ( orgMatch ) {
        // Does the company name in DT match the company name provided by the user?'
        if ( orgMatch.persona.company_name.toLowerCase() === metadata.business_name.toLowerCase() ) {
          // Return value.id as the DT ID that has matched what the user inputted
          matched_id = orgMatch.persona.id;
          // return the matched DT persona id
          return matched_id;
        }
        // Create new company in DT, since this one didn't match what they gave us
        return null;
      }
      // Create new company in DT, since this one (or these) didn't match what they gave us
      return null;
    }
    orgMatch = _.find( personResult.data, function( value ) {
      return value.persona.is_company;
    } );

    if ( !orgMatch ) {
      personMatch = _.find( personResult.data, function( el ) {
        if ( el.persona.names.some( function( value ) {
          logger.info( "Person names from DT here: " );
          logger.info( value );
          logger.info( "Stripe metadata here: " );
          logger.info( metadata );
          logger.info( "Data trimmed and split based on '&': " );
          logger.info( value.first_name.toLowerCase().split('&')[0].trim(),
              metadata.fname.toLowerCase().split('&')[0].trim(),
              value.last_name.toLowerCase().split('&')[0].trim(),
              metadata.lname.toLowerCase().split('&')[0].trim() );
          logger.info( "Data trimmed and split based on ' and ': " );
          logger.info( value.first_name.toLowerCase().split(' and ')[0].trim(),
              metadata.fname.toLowerCase().split(' and ')[0].trim(),
              value.last_name.toLowerCase().split(' and ')[0].trim(),
              metadata.lname.toLowerCase().split(' and ')[0].trim() );

          if ( (value.first_name.toLowerCase().split('&')[0].trim() === metadata.fname.toLowerCase().split('&')[0].trim()
              && value.last_name.toLowerCase().split('&')[0].trim() === metadata.lname.toLowerCase().split('&')[0].trim())
            || (value.first_name.toLowerCase().split(' and ')[0].trim() === metadata.fname.toLowerCase().split(' and ')[0].trim()
            && value.last_name.toLowerCase().split(' and ')[0].trim() === metadata.lname.toLowerCase().split(' and ')[0].trim())) {
            logger.info( "Person who's name matches: " );
            logger.info( value );
            // returning true here tells the function that this is the record inside which the correct name is found
            return true;
          }
        } ) ) {
          // Looked through all of the name arrays inside of all of the persona's and there was a match
          return true;
        }
      } );
      // return the matched DT persona id if it exists, else return null since there was no name match here.
      if ( personMatch ) {
        return personMatch.persona.id;
      }
      return null;
    }
    // Create new person in DT, since this one (or these) didn't match what they gave us
    return null;
  },
  check_for_dt_user(email, checkThisDTID, use_id, customer_id) {

    try {
      // This function is used to get all of the persona_id (there might be many)
      // from DT if they exist or return false if none do
      logger.info( "Started check_for_dt_user" );
      logger.info( "ID: ", checkThisDTID );

      let personResult, matched_id, getPersonasAndMatchedId, personaMatchData, personaData;
      if ( use_id ) {
        personResult = Utils.http_get_donortools( "/people/" + checkThisDTID + ".json" );
        personaData = Utils.split_dt_persona_info( email, personResult );
        return {
          persona_ids: personaData.persona_ids,
          persona_info: personaData.persona_info,
          matched_id: 'not used'
        };
      } else {
        if ( Audit_trail.findOne( { _id: customer_id } ) && Audit_trail.findOne( { _id: customer_id } ).flow_checked ) {
          logger.info( "Checked for and found a audit record for this customer creation flow, skipping the account creation." );
          return;
        } else {
          logger.info( "Checked for and didn't find an audit record for this customer creation flow." );

          Audit_trail.upsert( { _id: customer_id }, { $set: { flow_checked: true } } );
          getPersonasAndMatchedId = Utils.find_dt_persona_flow( email, customer_id );
          logger.info( getPersonasAndMatchedId );
          personaMatchData = getPersonasAndMatchedId.personResult;
          matched_id = getPersonasAndMatchedId.matched_id;

          personaData = Utils.split_dt_persona_info( email, personaMatchData );
        }

        return {
          persona_ids: personaData.persona_ids,
          persona_info: personaData.persona_info,
          matched_id: matched_id
        };
      }
    } catch ( e ) {
      logger.error( e );
      const error = ( e.response );
      throw new Meteor.Error( error, e._id );
    }
  },
  /**
   * Main algorithm for checking if there is already a DonorTools account that
   * matches this customer's information
   * @method find_dt_account_or_make_a_new_one
   * @param {Object} customer - The Stripe customer
   * @param {String} user_id - The user id from the Give app
   * @param {Boolean} skip_audit - Should we skip the audit check?
   */
  find_dt_account_or_make_a_new_one(customer, user_id, skip_audit) {
    logger.info( "Started find_dt_account_or_make_a_new_one" );

    let dt_persona_match_id;
    if ( Audit_trail.findOne( { _id: customer.id } ) &&
      Audit_trail.findOne( { _id: customer.id } ).flow_checked && !skip_audit ) {
      logger.info( "Checked for and found a audit record for this customer creation flow, skipping the account creation." );
      return;
    } else {
      logger.info( "Checked for and didn't find an audit record for this customer." );
      Audit_trail.upsert( { _id: customer.id }, { $set: { flow_checked: true } } );

      // Run the necessary checks to find which DT account this customer should
      // be associated with (if any)
      dt_persona_match_id = Utils.find_dt_persona_flow( customer.email, customer.id );

      if ( !dt_persona_match_id ) {
        // Create a new Donor Tools account and assign the id to the dt_persona_match_id let
        dt_persona_match_id = Utils.create_dt_account( customer, user_id );

        // Send an email to the support users telling them that a new DT account was added
        Utils.send_new_dt_account_added_email_to_support_email_contact( customer.email, user_id, dt_persona_match_id );
      }

      logger.info( "The donor Tools ID for this customer is ", dt_persona_match_id );
      return dt_persona_match_id;
    }
  },
  create_dt_account(customer, user_id) {
    logger.info( "Started create_dt_account" );
    const config = ConfigDoc();

    let metadata, newDTPerson, recognition_name, address_line2, is_company;

    if ( !customer.metadata ) {
      logger.info( "No metadata included with this customer object, setting it by " +
        "finding the document inside the customer's collection" );
      metadata = Customers.findOne( { _id: customer.id } ).metadata;
    } else {
      metadata = customer.metadata;
    }
    if ( metadata.business_name ) {
      recognition_name = metadata.business_name;
      is_company = true;
    } else {
      recognition_name = metadata.fname + " " + metadata.lname;
      is_company = false;
    }

    if ( metadata.address_line2 ) {
      address_line2 = metadata.address_line2;
    } else {
      address_line2 = '';
    }

    newDTPerson = HTTP.post( config.Settings.DonorTools.url + '/people.json', {
      "data": {
        "persona": {
          "company_name": metadata.business_name,
          "is_company": is_company,
          "names": [
            {
              "first_name": metadata.fname,
              "last_name": metadata.lname
            }
          ],
          "email_addresses": [
            {
              "email_address": metadata.email
            }
          ],
          "street_address": metadata.address_line1 + " \n" + address_line2,
          "city": metadata.city,
          "state": metadata.state,
          "postal_code": metadata.postal_code,
          "phone_numbers": [
            {
              "phone_number": metadata.phone
            }
          ],
          "web_addresses": [
            {
              "web_address": Meteor.absoluteUrl( "dashboard/users?userID=" + user_id )
            }
          ],
          "salutation_formal": metadata.fname + " " + metadata.lname,
          "recognition_name": recognition_name
        }
      },
      auth: DONORTOOLSAUTH
    } );


    // Audit the new DT account creation
    const event = {
      id: newDTPerson.data.persona.id,
      type: 'dt.account created',
      userId: user_id,
      category: 'DonorTools',
      relatedCollection: 'DT_personas',
      page: config.Settings.DonorTools.url + '/people/' + newDTPerson.data.persona.id,
      otherInfo: '/dashboard/users?userID=' + user_id
    };
    Utils.audit_event( event );
    return newDTPerson.data.persona.id;
  },
  insert_gift_into_donor_tools(chargeId, customer_id) {
    logger.info( "Started insert_gift_into_donor_tools" );
    const config = ConfigDoc();
    logger.info( "Config Settings:", config.Settings );
    logger.info( "chargeId:", chargeId, " Customer_id: ", customer_id );
    let newDonationResult;

    const chargeCursor = Charges.findOne( { _id: chargeId } );
    const customerCursor = Customers.findOne( { _id: customer_id } );

    if ( Audit_trail.findOne( { _id: chargeCursor._id } ) && Audit_trail.findOne( { _id: chargeCursor._id } ).dt_donation_inserted ) {
      logger.info( "Already inserted the donation into DT." );
      return;
    }
    Audit_trail.upsert( { _id: chargeCursor._id }, { $set: { dt_donation_inserted: true } } );

    const metadata = getMetadata(chargeCursor);

    const splits = [];
    let donationSplitsId = metadata && metadata.donationSplitsId;
    if (!donationSplitsId && (chargeCursor && chargeCursor.metadata && chargeCursor.metadata.donationSplitsId)) {
      donationSplitsId = chargeCursor.metadata.donationSplitsId;
    }
    if (donationSplitsId) {
      logger.info("donationSplitsId: " + donationSplitsId);
      const donationSplits = DonationSplits.findOne({_id: donationSplitsId});
      donationSplits.splits.forEach(function( split, index ) {
        let newSplitAmount;
        if (index === 0 && (metadata.fees > 0 || donationSplits.fees > 0)) {
          newSplitAmount = split.amount + Number(metadata.fees || donationSplits.fees);
        }
        newSplitAmount = newSplitAmount ? newSplitAmount : split.amount;
        splits.push({amount_in_cents: newSplitAmount, fund_id: Number(split.donateTo), memo: getMemo(split.donateTo, split.memo, chargeId, customer_id, metadata)});
      });
    } else {
      throw new Meteor.Error( "Couldn't find the donationSplitsId inside of insert_gift_into_donor_tools with charge.id: " + chargeCursor.id );
    }

    const source_id = getSourceId(customerCursor, metadata);

    logger.info( "Persona ID is:", customerCursor.metadata.dt_persona_id );

    if ( chargeCursor.refunded ) {
      logger.warn("charge is showing refunded");

      splits.forEach(function(split) {
        split.amount_in_cents = split.amount_in_cents * -1;
      });

      // amount = 0;
      const createdDate = moment.unix( chargeCursor.created ).format( "YYYY/MM/DD hh:mma" );
      const refundedAmount = (chargeCursor.refunds.data[0].amount / 100).toFixed(2);

      const donationMemo = "The charge was refunded on " + createdDate +
        ". The original charge amount was $" + refundedAmount;
      memo = donationMemo;
    }

    if ( chargeCursor.status === 'failed' ) {
      logger.warn("charge is showing refunded");

      splits.forEach(function(split) {
        split.amount_in_cents = 0;
      });
      const createdDate = moment.unix( chargeCursor.created ).format( "YYYY/MM/DD hh:mma" );
      const failedAmount = (chargeCursor.amount / 100).toFixed(2);

      const donationMemo = "The charge failed on " + createdDate +
        ". The original charge amount was $" + failedAmount + '. The failed reason was "' +
        chargeCursor.failure_message + '"';

      memo = donationMemo;
    }

    try {
      logger.info( "Started checking for this person in DT" );
      let checkPerson;
      checkPerson = HTTP.get( config.Settings.DonorTools.url + '/people/' +
        customerCursor.metadata.dt_persona_id + '.json', {
          auth: DONORTOOLSAUTH
        } );
      logger.info( checkPerson.data );
      if (!checkPerson) {
        logger.warn("No person found, not sure if this will work, but I'll attempt to insert this donation without a person with this record in DT.");
      }


      const data = {
        "donation": {
          "persona_id": Number(customerCursor.metadata.dt_persona_id),
          "splits": splits,
          "donation_type_id": config.Settings.DonorTools.customDataTypeId,
          "received_on": moment( new Date( chargeCursor.created * 1000 ) ).format( "YYYY/MM/DD hh:mma" ),
          "source_id": source_id,
          "payment_status": chargeCursor.status,
          "transaction_id": chargeId
        }
      };
      if ( chargeCursor.status === 'failed' || chargeCursor.refunded ) {
        data.donation.memo = memo;
      }

      logger.info("Donation data, prior to HTTP.post to DT");
      logger.info(data);
      newDonationResult = HTTP.post( config.Settings.DonorTools.url + '/donations.json', {
        data: data,
        auth: DONORTOOLSAUTH
      } );
    } catch ( e ) {
      logger.error( "There was a problem while looking at the data or trying to post it to DonorTools, here is the Persona ID: " +
        customerCursor.metadata.dt_persona_id);
      const to = config && config.OrgInfo &&
        config.OrgInfo.emails && config.OrgInfo.emails &&
        config.OrgInfo.emails.support;
      const emailObject = {
        to: to,
        type: 'Failed to add a gift to Donor Tools.',
        emailMessage: "I tried to add a gift with PersonaID of: " + customerCursor.metadata.dt_persona_id +
            " to Donor Tools, but for some reason I wasn't able to." +
            " Click the button to see the Stripe Charge",
        buttonText: "Stripe Charge",
        buttonURL: "https://dashboard.stripe.com/payments/" + chargeId
      };
      Utils.sendEmailNotice( emailObject );
      Audit_trail.update( { _id: chargeId }, {
        $set: {
          "dt_donation_inserted": false
        }
      } );
      throw new Meteor.Error( e );
    }
    newDonationResult.data.donation._id = newDonationResult.data.donation.id;
    DT_donations.upsert( { _id: newDonationResult.data.donation.id }, newDonationResult.data.donation );

    if ( newDonationResult && newDonationResult.data && newDonationResult.data.donation && newDonationResult.data.donation.persona_id ) {
      // Send the id of this new DT donation to the function which will update the charge to add that meta text.
      Utils.update_charge_with_dt_donation_id( chargeId, newDonationResult.data.donation.id );

      // Get all of the donations related to the persona_id that was either just created or that was just used when
      // the user gave
      Utils.get_all_dt_donations( [customerCursor.metadata.dt_persona_id] );

      return newDonationResult.data.donation.persona_id;
    } else {
      logger.error( "The persona ID wasn't returned from DT, or something else happened with the connection to DT." );
      throw new Meteor.Error( "Couldn't get the persona_id for some reason" );
    }
  },
  insert_manual_gift_into_donor_tools(donationId, customerId, dtPersonaId) {
    logger.info( "Started insert_manual_gift_into_donor_tools" );
    logger.info( "donationId: ", donationId, " customerId: ", customerId, "DT Persona ID: ", dtPersonaId);
    const config = ConfigDoc();
    let metadata;

    const donationCursor = Donations.findOne( { _id: donationId } );
    const customerCursor = Customers.findOne( { _id: customerId } );

    if ( Audit_trail.findOne( { donation_id: donationId } ) &&
      Audit_trail.findOne( { donation_id: donationId } ).dt_donation_inserted ) {
      logger.info( "Already inserted the donation into DT." );
      return;
    }
    Audit_trail.upsert( { _id: donationCursor._id }, { $set: { dt_donation_inserted: true } } );

    const splits = [];
    const donationSplitsId = donationCursor && donationCursor.donationSplitsId;
    if (donationSplitsId) {
      logger.info("donationSplitsId: " + donationSplitsId);
      const donationSplits = DonationSplits.findOne({_id: donationSplitsId});
      donationSplits.splits.forEach(function( split ) {
        splits.push({amount_in_cents: split.amount, fund_id: Number(split.donateTo), memo: getMemo(split.donateTo, split.memo, null, customerCursor.id, donationCursor)});
      });
    } else {
      throw new Meteor.Error( "Couldn't find the donationSplitsId inside of insert_manual_gift_into_donor_tools with donation.id: " + donationCursor.id );
    }

    const sourceId = getSourceId(customerCursor, {dt_source: donationCursor.dt_source});

    logger.info( "Persona ID is: ", customerCursor.metadata.dt_persona_id );

    try {
      logger.info( "Started checking for this person in DT" );
      const checkPerson = HTTP.get( config.Settings.DonorTools.url + '/people/' +
        dtPersonaId + '.json', {
          auth: DONORTOOLSAUTH
        } );
      logger.info( checkPerson.data );
    } catch ( e ) {
      logger.error( "No Person with the DT ID of " +
        dtPersonaId + " found in DT" );
      const to = config && config.OrgInfo &&
        config.OrgInfo.emails && config.OrgInfo.emails &&
        config.OrgInfo.emails.support;
      const emailObject = {
        to: to,
        type: 'Failed to add a gift to Donor Tools.',
        emailMessage: "I tried to add a gift with PersonaID of: " + dtPersonaId +
                      " to Donor Tools, but for some reason I wasn't able to." +
                      " Click the button to see the Stripe Charge",
        buttonText: "Stripe Charge",
        buttonURL: "https://dashboard.stripe.com/payments/" + donationId
      };
      Utils.sendEmailNotice( emailObject );

      Audit_trail.update( { donation_id: donationId }, {
        $set: {
          "dt_donation_inserted": false
        }
      } );
      throw new Meteor.Error( e );
    }
    const receivedOn = (donationCursor.nextDonationDate
        ? donationCursor.nextDonationDate
        : (donationCursor.start_date === 'today'
        ? donationCursor.created_at
        : ((donationCursor.start_date > donationCursor.created_at)
          ? donationCursor.start_date : donationCursor.created_at)));

    const newDonationResult = HTTP.post( config.Settings.DonorTools.url + '/donations.json', {
      data: {
        "donation": {
          "persona_id": dtPersonaId,
          "splits": splits,
          "donation_type_id": config.Settings.DonorTools.achFundIDForNonStripe,
          "received_on": moment.unix( new Date(receivedOn)).format( "YYYY/MM/DD hh:mma"),
          "source_id": sourceId,
          "payment_status": 'succeeded',
          "transaction_id": donationId
        }
      },
      auth: DONORTOOLSAUTH
    } );

    newDonationResult.data.donation._id = newDonationResult.data.donation.id;
    DT_donations.upsert( { _id: newDonationResult.data.donation.id }, newDonationResult.data.donation );

    if ( newDonationResult && newDonationResult.data && newDonationResult.data.donation && newDonationResult.data.donation.persona_id ) {
      // add this dt_donation_id to the donation
      Donations.update( { _id: donationId }, { $set: { dt_donation_id: newDonationResult.data.donation.id } } );
    } else {
      logger.error( "The persona ID wasn't returned from DT, or something else happened with the connection to DT." );
      throw new Meteor.Error( "Couldn't get the persona_id for some reason" );
    }
  },
  checkForDTFundID( id ) {
    logger.info( "checkForDTFundID with id: " + id );

    const dtFund = DT_funds.findOne( { id: id } );
    if ( dtFund ) {
      return dtFund.id;
    }
    return;
  },
  checkForDTFundName(name) {
    logger.info( "checkForDTFundName with name: " + name );

    const dtFund = DT_funds.findOne( { name: name } );
    if ( dtFund ) {
      return dtFund.id;
    }
    return;
  },
  getDonateTo(donateTo) {
    logger.info( "getDonateTo with: " );
    logger.info( donateTo );
    logger.info( "Is not a number? " + isNaN( donateTo ) );

    if ( !isNaN( donateTo ) ) {
      const donorToolsIDMatch = Utils.checkForDTFundID( donateTo );
      if ( donorToolsIDMatch ) {
        return donorToolsIDMatch;
      } else {
        throw new Meteor.Error( 500, "Couldn't find that number id in DT. Did it get merged? The admin might also need to retrieve all the funds from DT via the Give dashboard. " );
      }
    } else {
      const donorToolsNameMatch = Utils.checkForDTFundName( donateTo );
      if ( donorToolsNameMatch ) {
        return donorToolsNameMatch;
      } else {
        throw new Meteor.Error( 500, "Couldn't find that name in DT. Did it get changed? The admin might also need to retrieve all the funds from DT via the Give dashboard. ");
      }
    }
  },
  getDonateToName(donateTo) {
    logger.info( "getDonateToName with: " );
    logger.info( donateTo );
    logger.info( "Is not a number? " + isNaN( donateTo ) );

    if ( !isNaN( donateTo ) ) {
      const donorToolsIDMatch = Utils.checkForDTFundID( donateTo );
      if ( donorToolsIDMatch ) {
        return DT_funds.findOne( { id: donorToolsIDMatch } ).name;
      } else {
        throw new Meteor.Error( 500, "Couldn't find that number id in DT. Did it get merged?" );
      }
    } else {
      const donorToolsNameMatch = Utils.checkForDTFundName( donateTo );
      if ( donorToolsNameMatch ) {
        return DT_funds.findOne( { id: donorToolsNameMatch } ).name;
      } else {
        throw new Meteor.Error( 500, "Couldn't find that name in DT. Did it get changed?" );
      }
    }
  },
  create_customer(paymentDevice, customerInfo) {
    logger.info( "Inside create_customer." );

    const stripeCustomerObject = {
      email: customerInfo.email_address,
      metadata: {
        "city": customerInfo.city,
        "state": customerInfo.region,
        "address_line1": customerInfo.address_line1,
        "address_line2": customerInfo.address_line2,
        "country": customerInfo.country,
        "postal_code": customerInfo.postal_code,
        "phone": customerInfo.phone_number,
        "business_name": customerInfo.org,
        "email": customerInfo.email_address,
        "fname": customerInfo.fname,
        "lname": customerInfo.lname
      }
    };

    if ( paymentDevice.slice( 0, 2 ) === 'to' ) {
      logger.info( "card" );
      stripeCustomerObject.card = paymentDevice;
    } else if ( paymentDevice.slice( 0, 2 ) === 'bt' ) {
      logger.info( "Bank_account" );
      stripeCustomerObject.bank_account = paymentDevice;
    }

    const stripeCustomer = StripeFunctions.stripe_create( 'customers', stripeCustomerObject );

    stripeCustomer._id = stripeCustomer.id;

    const customer_id = Customers.insert( stripeCustomer );

    logger.info( "Customer_id: " + customer_id );
    return stripeCustomer;
  },
  charge(total, donation_id, customer_id, payment_id, metadata) {
    logger.info( "Inside charge." );

    const stripeCharge = StripeFunctions.stripe_create( 'charges',
      {
        amount: total,
        currency: "usd",
        customer: customer_id,
        source: payment_id,
        metadata: metadata
      } );
    stripeCharge._id = stripeCharge.id;

    // Add charge response from Stripe to the collection
    Charges.insert( stripeCharge );
    logger.info( "Finished Stripe charge. Charges ID: " + stripeCharge._id );
    return stripeCharge;
  },
  charge_plan(total, donation_id, customer_id, payment_id, frequency, start_date, metadata) {
    logger.info( "Inside charge_plan." );
    logger.info( "Start date: " + start_date );

    let plan, subscription_frequency;
    subscription_frequency = frequency;

    switch ( subscription_frequency ) {
    case "monthly":
      plan = "giveMonthly";
      break;
    case "weekly":
      plan = "giveWeekly";
      break;
    case "bi-weekly":
      plan = "giveBiWeekly";
      break;
    case "yearly":
      plan = "giveYearly";
      break;
    case "daily":
      plan = "giveDaily";
      break;
    case "semi-annually":
      plan = "giveEvery6Months";
      break;
    }

    const attributes = {
      plan: plan,
      quantity: total,
      metadata: metadata
    };
    if ( start_date !== 'today' ) {
      attributes.trial_end = start_date;
    }

    const stripeChargePlan = StripeFunctions.stripe_update( 'customers', 'createSubscription', customer_id, '', attributes );

    stripeChargePlan._id = stripeChargePlan.id;
    logger.info( "Stripe charge Plan information" );
    logger.info( stripeChargePlan );
    // Add charge response from Stripe to the collection
    Subscriptions.insert( stripeChargePlan );
    DonationSplits.update({_id: metadata.donationSplitsId}, { $set: { subscription_id: stripeChargePlan.id} });

    Donations.update( { _id: donation_id }, { $set: { subscription_id: stripeChargePlan.id } } );
    if ( start_date === 'today' ) {
      // Query Stripe to get the first invoice from this new subscription
      const stripeInvoiceList = StripeFunctions.stripe_retrieve( 'invoices', 'list', {
        customer: customer_id,
        limit: 1
      }, '' );
      return stripeInvoiceList.data[0];
    }
    Utils.send_scheduled_email( donation_id, stripeChargePlan.id, subscription_frequency, total );
    return 'scheduled';
  },
  audit_event(event) {
    logger.info( "Inside audit_event." );
    logger.info( event );

    const splitType = event.type.split(".");
    const insertThis = {
      category: event.category,
      failureCode: event.failureCode,
      failureMessage: event.failureMessage,
      emailSentTo: event.emailSentTo,
      otherInfo: event.otherInfo,
      page: event.page,
      relatedCollection: event.relatedCollection,
      relatedDoc: event.id,
      show: true,
      subtype: splitType[1],
      time: new Date(),
      type: splitType[0],
      userId: event.userId
    };

    Audit_trail.insert( insertThis );
  },
  update_card(customer_id, card_id, saved) {
    logger.info( "Started update_card" );
    logger.info( "Customer: " + customer_id + " card_id: " + card_id + " saved: " + saved );

    const stripeUpdatedCard = StripeFunctions.stripe_update( 'customers', 'updateCard', customer_id, card_id, {
      metadata: {
        saved: saved
      }
    } );

    stripeUpdatedCard._id = stripeUpdatedCard.id;
    return stripeUpdatedCard;
  },
  add_meta_from_subscription_to_charge(stripeEvent) {
    logger.info( "Started add_meta_from_subscription_to_charge" );

    // setup a cursor for this subscription
    const subscription_cursor = Subscriptions.findOne( { _id: stripeEvent.data.object.subscription } );

    // update the charges document to add the metadata, this way the related gift information is attached to the charge
    if ( subscription_cursor.metadata ) {
      Charges.update( { _id: stripeEvent.data.object.charge }, { $set: { metadata: subscription_cursor.metadata } } );
    }

    // update the invoices document to add the metadata
    if ( subscription_cursor.metadata ) {
      Invoices.update( { _id: stripeEvent.data.object.id }, { $set: { metadata: subscription_cursor.metadata } } );
    }

    // Now send these changes off to Stripe to update the record there.
    Utils.update_invoice_metadata( stripeEvent );
  },
  update_stripe_customer(form, dt_persona_id) {
    logger.info( "Inside update_stripe_customer." );

    const customers = Customers.find( {
      'metadata.dt_persona_id': dt_persona_id.toString()
    } ).map( function( customer ) {
      return customer.id;
    } );
    if ( customers.length > -1 ) {
      logger.info( "Got at least one customer" );
    } else {
      throw new Meteor.Error( 500, "Not customers with that DT ID were found" );
    }

    customers.forEach( function( customer_id ) {
      logger.info( customer_id );

      StripeFunctions.stripe_update( 'customers',
        'update', customer_id, '', {
          "metadata": {
            "city": form.address.city,
            "state": form.address.state,
            "address_line1": form.address.address_line1,
            "address_line2": form.address.address_line2,
            "postal_code": form.address.postal_code,
            "phone": form.phone
          }
        }
      );
    } );
  },
  update_stripe_customer_subscription(customer_id, subscription_id, token_id, donateWith) {
    logger.info( "Inside update_stripe_customer_subscription." );

    const stripeSubscriptionUpdate = StripeFunctions.stripe_update( 'customers', 'updateSubscription', customer_id, subscription_id, {
      source: token_id,
      metadata: { donateWith: donateWith }
    } );

    return stripeSubscriptionUpdate;
  },
  update_stripe_customer_card(data) {
    logger.info( "Inside update_stripe_customer_card." );
    const stripeCardUpdate = StripeFunctions.stripe_update( 'customers', 'updateCard', data.customer_id, data.card, {
      exp_month: data.exp_month,
      exp_year: data.exp_year
    } );
    return stripeCardUpdate;
  },
  update_stripe_customer_bank(customer_id, bank) {
    logger.info( "Inside update_stripe_customer_bank." );
    logger.info( customer_id, bank );

    const stripeBankUpdate = StripeFunctions.stripe_update( 'customers', 'createSource', customer_id, '', { source: bank } );
    return stripeBankUpdate;
  },
  update_stripe_bank_metadata(customer_id, bank_id, saved) {
    logger.info( "Inside update_stripe_bank_metadata." );
    logger.info( customer_id, bank_id, saved );
    if ( saved ) {
      saved = 'true';
    } else {
      saved = 'false';
    }

    const stripeBankUpdate = StripeFunctions.stripe_update( 'customers', 'updateCard', customer_id, bank_id, { metadata: { saved: saved } } );
  },
  update_stripe_customer_default_source(customer_id, device_id) {
    logger.info( "Inside update_stripe_customer_default_source." );
    logger.info( customer_id, device_id );

    const sourceUpdate = StripeFunctions.stripe_update( 'customers', 'update', customer_id, '', { default_source: device_id } );
    return sourceUpdate;
  },
  update_invoice_metadata(event_body) {
    logger.info( "Inside update_invoice_metadata" );

    // Get the subscription cursor
    const subscription_cursor = Subscriptions.findOne( { _id: event_body.data.object.subscription } );

    if ( subscription_cursor.metadata ) {
      // Use the metadata from the subscription to update the invoice with Stripe
      StripeFunctions.stripe_update( 'invoices', 'update', event_body.data.object.id, '', {
        "metadata": subscription_cursor.metadata
      } );
    } else {
      return;
    }
  },
  update_charge_metadata(event_body) {
    logger.info( "Inside update_charge_metadata with: " + event_body.data.object.id );

    // Get the subscription cursor
    let invoice_cursor = Invoices.findOne( { _id: event_body.data.object.invoice } );
    if ( !invoice_cursor ) {
      const invoice = StripeFunctions.get_invoice( event_body.data.object.invoice );
      invoice._id = invoice.id;
      Invoices.upsert( { _id: invoice._id }, invoice );
      invoice_cursor = Invoices.findOne( { _id: invoice.id } );
    }
    const subscription_cursor = Subscriptions.findOne( { _id: invoice_cursor.subscription } );

    // Use the metadata from the subscription to update the charge with Stripe
    if ( subscription_cursor.metadata ) {
      StripeFunctions.stripe_update( 'charges', 'update', event_body.data.object.id, '', {
        "metadata": subscription_cursor.metadata
      } );
    } else {
      return;
    }

    if ( subscription_cursor.metadata ) {
      Charges.update( { _id: event_body.data.object.id }, { $set: { metadata: subscription_cursor.metadata } } );
    }
  },
  cancel_stripe_subscription( customerId, subscriptionId, reason ) {
    logger.info( "Inside cancel_stripe_subscription" );
    logger.info( customerId + " " + subscriptionId + " " + reason );

    // Add the reason to the metadata before canceling
    const stripeSubscription = StripeFunctions.stripe_update( 'customers',
      'updateSubscription',
      customerId,
      subscriptionId,
      { metadata: { canceled_reason: reason } }
    );

    // Run the delete subscription function
    const stripeCancel = StripeFunctions.stripe_delete( 'customers',
      'cancelSubscription',
      customerId,
      subscriptionId
    );
    return stripeCancel;
  },
  stripe_create_subscription( customer_id, source_id, plan, quantity, metadata ) {
    logger.info( "Inside stripe_create_subscription." );
    logger.info( customer_id );

    // don't want to copy the canceled reason to the new subscription
    delete metadata.reason;

    const stripeCreateSubscription = StripeFunctions.stripe_update( 'customers', 'createSubscription', customer_id, '', {
      plan: plan,
      quantity: quantity,
      metadata: metadata
    } );

    stripeCreateSubscription._id = stripeCreateSubscription.id;
    // Add charge response from Stripe to the collection
    Subscriptions.insert( stripeCreateSubscription );
    metadata.subscription_id = stripeCreateSubscription.id;
    Donations.insert( metadata );

    return stripeCreateSubscription;
  },
  stripe_set_transfer_posted_metadata( transfer_id, set_to ) {
    logger.info( "Inside stripe_set_transfer_posted_metadata with transfer id: " +
      transfer_id + "and set_to: " + set_to );

    const stripeTransfer = StripeFunctions.stripe_update( 'transfers', 'update', transfer_id, '', {
      metadata: {
        posted: set_to
      }
    } );
    return stripeTransfer;
  },
  stripe_get_refund( refund_id ) {
    logger.info( "Started stripe_get_refund. Refund id: " + refund_id );

    const stripeRefund = StripeFunctions.stripe_retrieve( 'refunds', 'retrieve', refund_id, {
      expand: ["charge"]
    } );

    return stripeRefund;
  },
  get_all_stripe_refunds() {
    logger.info( "Inside get_all_stripe_refunds." );

    const allRefunds = StripeFunctions.stripe_retrieve( 'refunds', 'list', { limit: 100 }, '' );
    return allRefunds;
  },
  update_stripe_customer_dt_persona_id(customer_id, new_persona_id) {
    logger.info( "Inside update_stripe_customer_dt_persona_id." );
    logger.info( new_persona_id );

    const stripeCustomerUpdate = StripeFunctions.stripe_update( 'customers', 'update', customer_id, '', {
      "metadata": {
        "dt_persona_id": new_persona_id
      }
    } );
    return stripeCustomerUpdate;
  },
  update_stripe_subscription_amount_or_designation_or_date(subscription_id, customer_id, fields) {
    const stripeSubscriptionUpdate = StripeFunctions.stripe_update( 'customers',
      'updateSubscription',
      customer_id,
      subscription_id,
      fields );

    return stripeSubscriptionUpdate;
  },
  send_new_dt_account_added_email_to_support_email_contact(email, user_id, personaID) {
    logger.info( "Started send_new_dt_account_added_email_to_support_email_contact" );
    if ( Audit_trail.findOne( {
      relatedDoc: personaID,
      category: 'Email',
      subtype: 'account created'
    } )) {
      logger.info( "Already sent a send_new_dt_account_added_email_to_support_email_contact email" );
      return;
    }

    const config = ConfigDoc();

    // Create the HTML content for the email.
    // Create the link to go to the new person that was just created.
    const html = "<h1>DT account created</h1><p>" +
      "Details: <br>Email: " + email + "<br>ID: " +
      user_id + "<br>Link: <a href='" +
      config.Settings.DonorTools.url +
      "/people/" + personaID + "'>" + personaID +
      "</a></p>";

    let toAddresses = [];
    let bccAddress;
    toAddresses.push( {"email": config.OrgInfo.emails.support } );
    toAddresses.push( {"email": config.OrgInfo.emails.otherSupportAddresses } );

    bccAddress = config.OrgInfo.emails.bccAddress;
    const sendObject = {
      from_email: config.OrgInfo.emails.support,
      to: toAddresses,
      bcc: bccAddress,
      subject: "DT Account inserted.",
      html: html
    };
    Utils.sendHTMLEmail( sendObject );

    const event = {
      id: personaID,
      type: 'dt.account created',
      userId: user_id,
      emailSentTo: toAddresses,
      category: 'Email',
      relatedCollection: 'DT_personas',
      page: config.Settings.DonorTools.url + "/people/" + personaID,
      otherInfo: '/dashboard/users?userID=' + user_id
    };
    Utils.audit_event( event );
  },
  /**
   * Send an email to new users, welcoming them
   *
   * @method send_welcome_email
   * @param {String} email - email of the user who has just been created
   */
  send_welcome_email( email ) {
    logger.info( "Started send_welcome_email" );
    const config = ConfigDoc();

    if ( !(config && config.OrgInfo && config.OrgInfo.emails && config.OrgInfo.emails.support) ) {
      logger.warn( "No support email to send to/from." );
      return;
    }

    if ( !(config && config.Services.Email && config.Services.Email && config.Services.Email.welcome) ) {
      logger.info( "There is no welcome email name setup so we aren't sending a welcome email." );
      return;
    }

    const user = Meteor.users.findOne({'emails.address': email});
    if ( Audit_trail.findOne( { relatedDoc: user._id, type: 'welcome' } ) ) {
      logger.info( "Already sent a welcome email" );
      return;
    }

    const data_slug = {
      "template_name": config.Services.Email.welcome,
      "template_content": [
        {}
      ],
      "message": {
        "global_merge_vars": [
          {
            "name": "DEV",
            "content": Meteor.settings.dev
          }
        ]
      },
      "send_at": moment().add(7, "days").toISOString()
    };
    Utils.send_mandrill_email( data_slug, config.Services.Email.welcome, email, 'Welcome' );

    const event = {
      id: user._id,
      type: 'welcome',
      userId: user._id,
      category: 'Email',
      relatedCollection: 'Meteor.users',
      page: '/dashboard/users?userID=' + user._id,
      emailSentTo: email
    };
    Utils.audit_event( event );
  },
  /**
   * Send an email to the support email contact alerting.
   * Tell them a new user was created in Give
   *
   * @method send_new_give_account_added_email_to_support_email_contact
   * @param {String} email - email of the user who has just been created
   * @param {String} user_id - _id of the user who has just been created
   * @param {String} personaID - id from Donor Tools identifying this user
   */
  send_new_give_account_added_email_to_support_email_contact( email, user_id, personaID ) {
    logger.info( "Started send_new_give_account_added_email_to_support_email_contact" );
    const config = ConfigDoc();

    if ( !(config && config.OrgInfo && config.OrgInfo.emails && config.OrgInfo.emails.support) ) {
      logger.warn( "No support email to send to/from." );
      return;
    }

    if ( Audit_trail.findOne( { relatedDoc: user_id, category: 'Email', subtype: 'account created' } ) ) {
      logger.info( "Already sent a send_new_give_account_added_email_to_support_email_contact email" );
      return;
    }

    // Create the HTML content for the email.
    // Create the link to go to the new person that was just created.
    const html = "<h1>Give account created</h1><p>" +
      "Details: <br>Email: " + email + "<br>ID: " + user_id +
      "<br>Link: <a href='" + config.Settings.DonorTools.url +
      "/people/" + personaID + "'>" + personaID + "</a></p>";

    let toAddresses = [];
    toAddresses.push( {"email": config.OrgInfo.emails.support } );
    if ( config.OrgInfo.emails.otherSupportAddresses ) {
      toAddresses = toAddresses.concat( config.OrgInfo.emails.otherSupportAddresses );
    }

    const emailObject = {
      from_email: config.OrgInfo.emails.support,
      to: toAddresses,
      subject: "Give Account inserted.",
      html: html
    };

    Utils.sendHTMLEmail( emailObject );

    // Audit the new account creation
    const event = {
      id: user_id,
      emailSentTo: toAddresses,
      type: 'give.account created',
      userId: user_id,
      category: 'Email',
      relatedCollection: 'Meteor.users',
      page: '/dashboard/users?userID=' + user_id
    };
    Utils.audit_event( event );
  },
  /**
   * Send an email to the admins.
   * Tell them a change was made to the DonorTools or Stripe Configuration
   *
   * @method send_change_email_notice_to_admins
   */
  send_change_email_notice_to_admins(changeMadeBy, changeIn) {
    logger.info( "Started send_change_email_notice_to_admins" );
    const config = ConfigDoc();
    const event = {
      id: config._id,
      type: 'config.change',
      category: 'Admin',
      userId: changeMadeBy,
      relatedCollection: 'Config',
      page: "/dashboard/" + changeIn
    };
    Utils.audit_event(event);

    if ( !(config && config.OrgInfo && config.OrgInfo.emails && config.OrgInfo.emails.support) ) {
      logger.warn( "No support email to send from." );
      return;
    }

    const admins = Roles.getUsersInRole( 'admin' );
    const adminEmails = admins.map( function( item ) {
      return {"email": item.emails[0].address};
    } );

    // Create the HTML content for the email.
    // Create the link to go to the new person that was just created.
    const html = "<h2>We thought you might want to know.</h2><p> A changed was made to your Give " +
      "configuration. <br> Changed By: " +
      Meteor.users.findOne( { _id: changeMadeBy } ).emails[0].address + "</p><p>" +
      "To see the changes go to your <a href='" + Meteor.absoluteUrl() +
      "dashboard/" + changeIn + "'>Dashboard</a></p>";

    const emailObject = {
      from: config.OrgInfo.name + "<" + config.OrgInfo.emails.support + ">",
      from_email: config.OrgInfo.emails.support,
      to: adminEmails,
      subject: Meteor.settings.dev + "A configuration change was made",
      html: html
    };

    Utils.sendHTMLEmail( emailObject );

    event.emailSentTo = adminEmails;
    event.category = 'Email';
    Utils.audit_event(event);
  },
  /**
   * set a user's state object and update that object with a timestamp
   *
   * @method set_user_state
   * @param {String} userId - _id of user who's state is being updated
   * @param {String} state - OneOf the values, 'disabled', 'enabled', or 'invited'
   */
  set_user_state(userId, state) {
    logger.info( "Started set_user_state method" );

    check( userId, String );
    check( state, Match.OneOf(
      'disabled',
      'enabled',
      'invited'
    ) );

    try {
      // Set the state of the user with userId
      Meteor.users.update( { _id: userId }, {
        $set: {
          state: {
            status: state,
            updatedOn: new Date()
          }
        }
      } );

      // Logout user
      Meteor.users.update( { _id: userId }, { $set: { "services.resume.loginTokens": [] } } );
    } catch ( e ) {
      throw new Meteor.Error( 500, "Can't do that" );
    }
  },
  /**
   * 1. Construct the user's profile object from the customer metadata
   * 2. Create a user
   * 3. Update the new user with some details; profile, roles, state and
   * primary_customer_id
   * 4. Send the enrollment email
   * 5. return the newly created users's _id
   * @method create_user
   * @param {String} email - the email address used to give on the donation_form
   * @param {String} customer_id - the customer id generated by Stripe when the customer gave
   */
  create_user(email, customer_id) {
    try {
      logger.info( "Started create_user." );

      let user_id, customer_cursor, fname, lname, profile;

      customer_cursor = Customers.findOne( customer_id );
      if ( !customer_cursor.metadata.country ) {
        logger.error( "No Country" );
      }

      // Construct the user's profile object from the customer metadata
      fname = customer_cursor && customer_cursor.metadata.fname;
      lname = customer_cursor && customer_cursor.metadata.lname;
      profile = {
        fname: fname,
        lname: lname,
        address: {
          address_line1: customer_cursor.metadata.address_line1,
          address_line2: customer_cursor.metadata && customer_cursor.metadata.address_line2,
          city: customer_cursor.metadata.city,
          state: customer_cursor.metadata.state,
          postal_code: customer_cursor.metadata.postal_code,
          country: customer_cursor.metadata.country
        },
        phone: customer_cursor.metadata.phone,
        business_name: customer_cursor.metadata.business_name
      };

      // Create a user
      user_id = Accounts.createUser( { email: email } );

      // Add some details to the new user account
      Meteor.users.update( user_id, {
        $set: {
          'profile': profile,
          'primary_customer_id': customer_id,
          roles: [],
          state: {
            status: 'invited',
            updatedOn: new Date()
          }
        }
      } );

      // Send an enrollment Email to the new user
      Accounts.sendEnrollmentEmail( user_id );
      return user_id;
    } catch ( e ) {
      logger.info( e );
      const error = (e.response);
      throw new Meteor.Error( error, e._id );
    }
  },
  /**
   * This function creates the Stripe plans that are needed for Give to work
   * @method create_stripe_plans
   */
  create_stripe_plans() {
    try {
      logger.info( "Started create_stripe_plans." );
      const stripe_plans = [
        { name: 'giveDaily', interval: 'day' },
        { name: 'giveWeekly', interval: 'week' },
        { name: 'giveBiWeekly', interval: 'week', interval_count: 2 },
        { name: 'giveMonthly', interval: 'month' },
        { name: 'giveYearly', interval: 'year' },
        { name: 'giveEvery6Months', interval: 'month', interval_count: 6 }
      ];

      stripe_plans.forEach( function(plan) {
        // for each of the plans run the Stripe get function (to see if the plan exists)
        // then run the create function if it does not exist
        const stripePlan = Utils.retrieve_stripe_plan(plan.name);
        logger.info(stripePlan);
        if (!stripePlan) {
          const newStripePlan = Utils.create_stripe_plan(plan);
        }
      } );
    } catch (e) {
      logger.error(e);
      const error = (e.response);
      throw new Meteor.Error( error, e._id );
    }
  },
  /**
   * This function will attempt to retrieve a Stripe plan
   * @method retrieve_stripe_plan
   * @param {String} name - The name of the plan to retrieve from Stripe
   */
  retrieve_stripe_plan(name) {
    logger.info( "Started retrieve_stripe_plan with name: " + name );

    try {
      const stripePlan = StripeFunctions.stripe_retrieve( 'plans', 'retrieve', name, '' );

      return stripePlan;
    } catch (e) {
      logger.error( e );
      return;
    }
  },
  /**
   * This function creates a Stripe plan
   * @method create_stripe_plan
   * @param {Object} plan - The plan to be created
   * @param {String} plan.name - The name of the plan
   * @param {String} plan.interval - The interval of the plan
   */
  create_stripe_plan(plan) {
    logger.info( "Started create_stripe_plan with name: " + plan.name );
    const createdPlan = StripeFunctions.stripe_create( 'plans', {
      amount: 1,
      interval: plan.interval,
      interval_count: plan.interval_count || 1,
      name: plan.name,
      currency: "usd",
      id: plan.name
    } );
    return createdPlan;
  },
  // Below here was moved from post_donations.js
  post_donation_operation(customer_id, charge_id) {
    logger.info( "Started post_donation_operation." );
    let inserted_now, matchedId, findAnyMatchedDTaccount;

    if ( DT_donations.findOne( { transaction_id: charge_id } ) ) {
      logger.info( "There is already a DT donation with that charge_id in the collection or there is a current operation on that DT donation" );
      return;
    } else {
      // create an email_address variable to be reused below
      const email_address = Customers.findOne( customer_id ) && Customers.findOne( customer_id ).email;

      // check that there was a customer record and that record had an email address
      if ( email_address ) {
        // create user
        const user_id = Utils.create_user( email_address, customer_id );
        let persona_result = {};

        // Check for existing id array
        if ( user_id.persona_id && !user_id.persona_info ) {
          logger.info( "post_donation.js: This is the persona_id : ", user_id.persona_id );
          // check dt for user, persona_ids will be an array of 0 to many persona_ids
          persona_result = Utils.check_for_dt_user( email_address, user_id.persona_id, true );
        } else {
          // check dt for user, persona_ids will be an array of 0 to many persona_ids
          findAnyMatchedDTaccount = Utils.check_for_dt_user( email_address, null, false, customer_id );
          if ( !findAnyMatchedDTaccount ) {
            return;
          }
          persona_result = findAnyMatchedDTaccount;
          matchedId = findAnyMatchedDTaccount.matched_id;
          logger.info( "matchedId: " + matchedId + " persona_result: ");
          logger.info( persona_result );
        }

        if ( !persona_result ) {
          return;
        }

        const audit_item = Audit_trail.findOne( { _id: charge_id } );

        if ( !persona_result || !persona_result.persona_info || persona_result.persona_info === '' || matchedId === null ) {
          // Call DT create function
          if ( audit_item && audit_item.status && audit_item.status.dt_donation_inserted ) {
            return;
          } else {
            inserted_now = Audit_trail.update( { _id: charge_id }, {
              $set: {
                status: {
                  dt_donation_inserted: true,
                  dt_donation_inserted_time: moment().format( "MMM DD, YYYY hh:mma" )
                }
              }
            } );
            const single_persona_id = Utils.insert_donation_and_donor_into_dt( customer_id, user_id, charge_id );
            persona_result = Utils.check_for_dt_user( email_address, single_persona_id, true );
            // return {persona_ids: personaData.persona_ids, persona_info: personaData.persona_info, matched_id: 'not used'};

            // Send me an email letting me know a new user was created in DT.
            Utils.send_dt_new_dt_account_added( email_address, user_id, single_persona_id );
          }
        } else {
          if ( audit_item && audit_item.status && audit_item.status.dt_donation_inserted ) {
            return;
          } else {
            inserted_now = Audit_trail.update( { _id: charge_id }, {
              $set: {
                status: {
                  dt_donation_inserted: true,
                  dt_donation_inserted_time: moment().format( "MMM DD, YYYY hh:mma" )
                }
              }
            } );

            Utils.insert_donation_into_dt( customer_id, user_id, persona_result.persona_info, charge_id, persona_id );
          }
        }

        Utils.update_stripe_customer_user( customer_id, user_id, email_address );

        // Get all of the donations related to the persona_id that was either just created or that was just used when
        // the user gave
        Utils.get_all_dt_donations( persona_result.persona_ids );

        Utils.for_each_persona_insert( persona_result.persona_info, user_id );
      } else {
        logger.error( "Didn't find the customer record, exiting." );
        throw new Meteor.Error( "Email doesn't exist", "Customer didn't have an email address", "Customers.findOne(customer_id) && Customers.findOne(customer_id).email from post_donation.js didn't find an email" );
      }
    }
  },
  for_each_persona_insert(id_or_info, user_id) {
    logger.info( "Started for_each_persona_insert." );
    const config = ConfigDoc();

    if ( id_or_info && id_or_info.length ) {
      if ( id_or_info[0].id ) {
        logger.info( user_id );

        // Start from scratch
        const updateThisThing = Meteor.users.update( { _id: user_id._id }, { $set: { 'persona_info': [] } } );
        logger.info( updateThisThing );

        // forEach of the persona ids stored in the array run the insert_persona_info_into_user function
        id_or_info.forEach( function( element ) {
          logger.info( element.id );
          HTTP.call( "GET", config.Settings.DonorTools.url + "/people/" + element.id + ".json",
            { auth: DONORTOOLSAUTH },
            function( error ) {
              if ( !error ) {
                logger.info( "No error, moving to insert" );
                logger.info( "element.id: " + element.id );
                Utils.insert_persona_info_into_user( user_id, element );
              } else {
                Utils.remove_persona_info_from_user( user_id, element );
              }
            } );
        } );
      } else {
        id_or_info.forEach( function( element ) {
          const email = Meteor.users.findOne( user_id ).emails[0].address;
          const results_of_repeat = Utils.check_for_dt_user( email, element, true );
        } );
      }
    } else {
      logger.info( "No persona_ids found in either an array of ids or in an array of persona_info" );
    }
    return;
  },
  insert_donation_and_donor_into_dt(customer_id, user_id, charge_id) {
    logger.info( "Started insert_donation_and_donor_into_dt" );
    const config = ConfigDoc();

    const customer = Customers.findOne( customer_id );
    const charge = Charges.findOne( charge_id );

    let payment_status, received_on;
    const metadata = getMetadata(charge);
    const source_id = getSourceId(customer, metadata);
    const business_name = getBusinessName(customer);
    let recognition_name;
    if ( business_name ) {
      recognition_name = business_name;
    } else {
      recognition_name = customer.metadata.fname + " " + customer.metadata.lname;
    }

    payment_status = charge.status;
    received_on = moment( new Date( charge.created * 1000 ) ).format( "YYYY/MM/DD hh:mma" );

    const splits = [];
    const donationSplitsId = metadata && metadata.donationSplitsId;
    if (donationSplitsId) {
      const donationSplits = DonationSplits.findOne({_id: donationSplitsId});
      donationSplits.splits.forEach(function( split, index ) {
        let newSplitAmount;
        if (index === 0 && (metadata.fees > 0 || donationSplits.fees > 0)) {
          newSplitAmount = split.amount + Number(metadata.fees || donationSplits.fees);
        }
        newSplitAmount = newSplitAmount ? newSplitAmount : split.amount;
        splits.push({amount_in_cents: newSplitAmount, fund_id: Number(split.donateTo), memo: getMemo(split.donateTo, split.memo, charge.id, customer.id, metadata)});
      });
    } else {
      throw new Meteor.Error( "Couldn't find the donationSplitsId inside of insert_donation_and_donor_into_dt with charge.id: " + charge.id );
    }

    if ( customer.metadata.address_line2 ) {
      address_line2 = customer.metadata.address_line2;
    } else {
      address_line2 = '';
    }

    try {
      const newDonationResult = HTTP.post(config.Settings.DonorTools.url + '/donations.json', {
        data: {
          "donation": {
            "splits": splits,
            "donation_type_id": config.Settings.DonorTools.customDataTypeId,
            "received_on": received_on,
            "source_id": source_id,
            "payment_status": payment_status,
            "transaction_id": charge_id,
            "find_or_create_person": {
              "company_name": business_name,
              "full_name": customer.metadata.fname + " " + customer.metadata.lname,
              "email_address": customer.metadata.email,
              "street_address": customer.metadata.address_line1 + " \n" + address_line2,
              "city": customer.metadata.city,
              "state": customer.metadata.state,
              "postal_code": customer.metadata.postal_code,
              "phone_number": customer.metadata.phone,
              "web_address": Meteor.absoluteUrl("dashboard/users?userID=" + user_id),
              "salutation_formal": customer.metadata.fname + " " + customer.metadata.lname,
              "recognition_name": recognition_name
            }
          }
        },
        auth: DONORTOOLSAUTH
      });

      if (newDonationResult && newDonationResult.data && newDonationResult.data.donation && newDonationResult.data.donation.persona_id) {
        return newDonationResult.data.donation.persona_id;
      }
      logger.error("The persona ID wasn't returned from DT, or something else happened with the connection to DT.");
      throw new Meteor.Error("Couldn't get the persona_id for some reason");
    } catch (e) {
      logger.error(e);
      const error = (e.response);
      throw new Meteor.Error(error, e._id);
    }
  },
  separate_donations(serverResponse) {
    logger.info( "Inside separate_donations" );

    // Pull each donation from the array and send them to be inserted
    serverResponse.forEach( function( element ) {
      Utils.insert_each_dt_donation( element.donation );
    } );
  },
  insert_each_dt_donation( donation ) {
    DT_donations.upsert( { _id: donation.id }, donation );
  },
  separate_funds( fundResults ) {
    logger.info( "Inside separate_funds" );

    // Pull each donation from the array and send them to be inserted
    fundResults.forEach( function( element ) {
      Utils.insert_each_dt_fund( element.fund );
    } );
  },
  separate_sources( sourceResults ) {
    logger.info( "Inside separate_sources" );

    // Pull each donation from the array and send them to be inserted
    sourceResults.forEach( function( element ) {
      Utils.insert_each_dt_source( element.source );
    } );
  },
  insert_each_dt_fund( fund ) {
    logger.info( "Inside insert_each_dt_fund with " + fund.id );

    fund.id = fund.id.toString();
    // Insert each donation into the DT_funds collection
    fund._id = fund.id;
    DT_funds.upsert( { _id: fund._id }, fund );
  },
  insert_each_dt_source(source) {
    logger.info( "Inside insert_each_dt_source with " + source.id );

    source.id = source.id.toString();

    // Insert each donation into the DT_funds collection
    source._id = source.id;
    DT_sources.upsert( { _id: source._id }, source );
  },
  get_all_dt_donations(persona_ids) {
    logger.info( "Started get_all_dt_donations" );
    logger.info( "persona_ids: " + persona_ids );

    if ( persona_ids === '' ) {
      return;
    }
    persona_ids.forEach( function( id ) {
      let responseData;
      // TODO: what if there are more than 1000 gifts?
      responseData = Utils.http_get_donortools( "/people/" + id +
        '/donations.json?per_page=1000' );
      // Call the function to separate the donation array received from DT into individual donation
      Utils.separate_donations( responseData.data );
    } );
  },
  insert_persona_info_into_user(user_id, persona_info) {
    // Insert the donor tools persona id into the user record
    logger.info( "Started insert_persona_info_into_user" );
    logger.info( persona_info );

    if ( Meteor.users.findOne( {
      _id: user_id._id,
      'persona_info.id': persona_info.id
    } ) ) {
      Meteor.users.update( {
        _id: user_id._id,
        'persona_info.id': persona_info.id
      }, { $set: { 'persona_info.$': persona_info } } );
    } else {
      Meteor.users.update( user_id, { $addToSet: { 'persona_info': persona_info } } );
    }
    return;
  },
  remove_persona_info_from_user(user_id, persona_info) {
    // Remove an old donor tools persona id from the user record
    logger.info( "Started remove_persona_info_from_user" );
    logger.info( "ID: " );
    logger.info( user_id );

    if ( Meteor.users.findOne( {
      _id: user_id._id,
      'persona_info.id': persona_info.id
    } ) ) {
      Meteor.users.update( { _id: user_id._id }, { $pull: { persona_info: { id: persona_info.id } } } );
    }
    return;
  },
  insert_donation_into_dt(customer_id, user_id, persona_info, charge_id, persona_id) {
    try {
      logger.info( "Started insert_donation_into_dt" );
      const config = ConfigDoc();

      // TODO: still need to fix the below for any time when the charge isn't being passed here, like for scheduled gifts
      if ( Audit_trail.findOne( { _id: charge_id } ) &&
        Audit_trail.findOne( { _id: charge_id } ).subtype &&
        Audit_trail.findOne( { _id: charge_id } ).subtype === 'gift inserted' ) {
        logger.info( "Already inserted the donation into DT." );
        return;
      } else {
        // Audit the new account creation
        const event = {
          id: charge_id,
          type: 'dt.gift inserted',
          userId: user_id,
          category: 'DonorTools',
          relatedCollection: 'Charges',
          page: '/dashboard/gifts?refunds=true&chargeID=' + charge_id
        };
        Utils.audit_event( event );
      }

      const customer = Customers.findOne( customer_id );
      const charge = Charges.findOne( charge_id );

      let dt_fund, donateTo, invoice_cursor;

      if ( charge_id.slice( 0, 2 ) === 'ch' || charge_id.slice( 0, 2 ) === 'py' ) {
        if ( charge.invoice ) {
          invoice_cursor = Invoices.findOne( { _id: charge.invoice } );
          if ( invoice_cursor && invoice_cursor.lines && invoice_cursor.lines.data[0] && invoice_cursor.lines.data[0].metadata && invoice_cursor.lines.data[0].metadata.donateTo ) {
            donateTo = invoice_cursor.lines.data[0].metadata.donateTo;
          } else {
            donateTo = charge && charge.metadata && charge.metadata.donateTo;
          }
        } else {
          donateTo = charge.metadata.donateTo;
        }
      } else {
        // TODO: this area is to be used in case we start excepting bitcoin or other payment methods that return something other than a ch_ event object id
      }

      if ( donateTo ) {
        dt_fund = Utils.get_fund_id( donateTo );
      } else {
        dt_fund = null;
      }

      // write-in gifts and those not matching a fund in DT
      let fund_id, memo;
      if ( !dt_fund ) {
        fund_id = config.Settings.DonorTools.defaultFundId;
        memo = Meteor.settings.dev + charge.metadata.frequency.charAt( 0 ).toUpperCase() + charge.metadata.frequency.slice( 1 ) + " " + donateTo;
      } else {
        fund_id = dt_fund;
        memo = Meteor.settings.dev + charge.metadata.frequency.charAt( 0 ).toUpperCase() + charge.metadata.frequency.slice( 1 );
        if ( charge && charge.metadata && charge.metadata.note ) {
          memo = memo + " " + charge.metadata.note;
        }
      }
      let source_id;

      if ( customer && customer.metadata && customer.metadata.business_name ) {
        if (charge.metadata.dt_source) {
          source_id = charge.metadata.dt_source;
        } else {
          source_id = DONORTOOLSORGSOURCEID;
        }
      }
      if ( charge.metadata && charge.metadata.dt_source ) {
        source_id = charge.metadata.dt_source;
      } else {
        source_id = DONORTOOLSINDVSOURCEID;
      }

      const amount = charge.amount;

      let newDonationResult;
      newDonationResult = HTTP.post( config.Settings.DonorTools.url + '/donations.json', {
        data: {
          "donation": {
            "persona_id": persona_id,
            "splits": [{
              "amount_in_cents": amount,
              "fund_id": fund_id,
              "memo": memo
            }],
            "donation_type_id": config.Settings.DonorTools.customDataTypeId,
            "received_on": moment( new Date( charge.created * 1000 ) ).format( "YYYY/MM/DD hh:mma" ),
            "source_id": source_id,
            "payment_status": charge.status,
            "transaction_id": charge_id
          }
        },
        auth: DONORTOOLSAUTH
      } );

      if ( newDonationResult && newDonationResult.data && newDonationResult.data.donation && newDonationResult.data.donation.persona_id ) {
        // Send the id of this new DT donation to the function which will update the charge to add that meta text.
        Utils.update_charge_with_dt_donation_id( charge_id, newDonationResult.data.donation.id );

        return newDonationResult.data.donation.persona_id;
      } else {
        logger.error( "The persona ID wasn't returned from DT, or something else happened with the connection to DT." );
        throw new Meteor.Error( "Couldn't get the persona_id for some reason" );
      }
    } catch ( e ) {
      logger.info( e );
      // e._id = AllErrors.insert(e.response);
      const error = (e.response);
      throw new Meteor.Error( error, e._id );
    }
  },
  get_business_persona(persona_info, is_business) {
    logger.info( "Started get_business_persona" );

    if ( is_business ) {
      // Find the persona object that has a company name
      var result = _.find( persona_info, function( value ) {
        return value.company_name;
      } );
    } else {
      // Find the persona object that does not have a company name
      var result = _.find( persona_info, function( value ) {
        return !value.company_name;
      } );
    }
    // Return the persona id for the company persona
    return result.id;
  },
  update_charge_with_dt_donation_id(charge_id, dt_donation_id) {
    logger.info( "Started update_charge_with_dt_donation_id" );

    const stripeUpdate = StripeFunctions.stripe_update( 'charges',
      'update',
      charge_id,
      '', {
        metadata: { dt_donation_id: dt_donation_id }
      } );
    return stripeUpdate;
  },
  split_dt_persona_info(email, personResultInSplit) {
    logger.info( "Started split_dt_persona_info" );

    if ( !personResultInSplit || personResultInSplit.data === '' || personResultInSplit.data === [] ) {
      logger.info( "No existing DT account found" );
      return;
    } else {
      const return_to_called = {};
      return_to_called.persona_ids = [];
      return_to_called.persona_info = [];

      if ( !personResultInSplit.data.length ) {
        logger.info( "Not an array of data" );
        personResult.data = [personResult.data];
      }
      personResultInSplit.data.forEach( function( element ) {
        return_to_called.persona_ids.push( element.persona.id );
        return_to_called.persona_info.push( element.persona );

        element.persona.email_addresses.forEach( function( element ) {
          if ( element.address_type_id === 5 ) {
            return_to_called.dt_account_has_main = true;
          }
          if ( element.email_address === email ) {
            if ( element.address_type_id === 5 ) {
              return_to_called.matching_main_account = true;
            }
            // So it matches for one of the persona's, but what if it doesn't match for the other?
            // Also, this should still work if it ends up that there are no main emails.
            logger.info( "Yup, this is a main email address for the account you searched for" );
          }
        } );
      } );
      return return_to_called;
    }
  },
  processDTFund(donateTo) {
    logger.info( "Started processDTFund" );

    let dt_fund;

    if ( donateTo ) {
      if ( !isNaN( donateTo ) ) {
        dt_fund = Number( donateTo );
      } else {
        dt_fund = null;
      }
    } else {
      dt_fund = null;
    }
    logger.info( "dt_fund: " + dt_fund );
    return dt_fund;
  },
  /**
   * This function sets up Mandrill
   * @method configMandrill
   */
  configMandrill() {
    logger.info( "Started configMandrill" );
    const config = ConfigDoc();

    Mandrill.config( {
      username: config.Services.Email.mandrillUsername,
      "key": config.Services.Email.mandrillKey,
      port: 587,
      host: "smtps.mandrillapp.com"
    } );
  },
  /**
   * Send an HTML email (not using a template)
   * @method sendHTMLEmail
   * @param {Object} emailObject - The email to be sent
   * @param {String} emailObject.from - The from address
   * @param {Array} emailObject.to - The to addresses
   * @param {String} emailObject.subject - The email subject
   * @param {String} emailObject.html - The html
   */
  sendHTMLEmail( emailObject ) {
    logger.info( "Started sendHTMLEmail" );
    const config = ConfigDoc();

    if ( !(config && config.Services && config.Services.Email && config.Services.Email.emailSendMethod) ) {
      logger.warn( "Can't send email, there is no emailSendMethod." );
      return;
    }
    const configMandrill = Utils.configMandrill();
    let bccAddress;

    if ( config.OrgInfo.emails.bccAddress ) {
      bccAddress = config.OrgInfo.emails.bccAddress;
    }
    Mandrill.messages.send( {
      message: {
        from_name: emailObject.from,
        from_email: config.OrgInfo.emails.support,
        to: emailObject.to,
        bcc: bccAddress,
        subject: emailObject.subject,
        html: emailObject.html,
      }
    } );
  },
  /**
   * Check the user profile, if address info exists return;
   * Else add the info to the user profile
   * @method check_for_profile_info_add_if_none
   * @param {String} user_id - The user._id
   * @param {String} customer_id - The Stripe customer.id (also the document _id of this
   * customer from the customers collection)
   */
  check_for_profile_info_add_if_none(user_id, customer_id) {
    logger.info("Started check_for_profile_info_add_if_none with user: " + user_id + "and customer_id: " + customer_id);

    if (Meteor.users.findOne({_id: user_id}) &&
      Meteor.users.findOne({_id: user_id}).profile &&
      Meteor.users.findOne({_id: user_id}).profile.address) {
      logger.info("This user already has an address object in their profile.");
      return;
    } else {
      logger.info("This user doesn't have an address object in their profile.");
      logger.info("Updating the profile with this customer info: " + customer_id);

      const customer_cursor = Customers.findOne( { _id: customer_id } );
      // Construct the user's profile object from the customer metadata
      const fname = customer_cursor && customer_cursor.metadata.fname;
      const lname = customer_cursor && customer_cursor.metadata.lname;
      const profile = {
        fname: fname,
        lname: lname,
        address: {
          address_line1: customer_cursor.metadata.address_line1,
          address_line2: customer_cursor.metadata && customer_cursor.metadata.address_line2,
          city: customer_cursor.metadata.city,
          state: customer_cursor.metadata.state,
          postal_code: customer_cursor.metadata.postal_code,
          country: customer_cursor.metadata.country
        },
        phone: customer_cursor.metadata.phone,
        business_name: customer_cursor.metadata.business_name
      };
      Meteor.users.update({_id: user_id}, {$set: {
        profile: profile
      }});
    }
  }
};
