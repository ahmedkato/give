
function OrgInfoCheck(name, namePart2) {
  let config = ConfigDoc();
  if (name && namePart2){
    if (config && config.OrgInfo && config.OrgInfo[name] && config.OrgInfo[name][namePart2]) {
      return config.OrgInfo[name][namePart2];
    }
    return;
  } else if (name) {

    if (config && config.OrgInfo && config.OrgInfo[name]) {
      return config.OrgInfo[name];
    }
    return;
  }
};

  Give = {
    getCleanValue: function ( id ) {
      var jqueryObjectVal = $( id ).val();
      return Give.cleanupString( jqueryObjectVal );
    },
    cleanupString: function ( string ) {
      var cleanString = s( string ).stripTags().trim().value();
      return cleanString;
    },
    get_fee: function ( amount ) {
      var r = (100 - 2.9) / 100;
      var i = (parseFloat( amount ) + 0.3) / r;
      var s = i - amount;
      return {
        fee:   i,
        total: s
      };
    },
    process_give_form: function( quickForm, customer, user_id ) {
      var form = {};
      var userCursor;
      var customerCursor;
      var businessName;
      var addressLine2;

      if (Meteor.user()) {
        if (user_id && Roles.userIsInRole(Meteor.user(), ['super-admin', 'admin'])) {
          userCursor = Meteor.users.findOne(user_id);
        } else {
          userCursor = Meteor.user();
        }
        var profile;
        if (userCursor.profile && userCursor.profile.fname) {
          profile = userCursor.profile;
        } else {
          let persona_info = userCursor &&
            userCursor.persona_info &&
            userCursor.persona_info[0];
          if (!persona_info) {
            console.error("No persona_info");
            return;
          }
          profile = {
            fname: persona_info.names[0].first_name,
            lname: persona_info.names[0].last_name,
            phone: persona_info.phone_numbers[0].phone_number,
            business_name: persona_info.company_name,
            address: {
              address_line1: persona_info.addresses[0].street_address.slice(0,
                persona_info.addresses[0].street_address.indexOf('\n')),
              city: persona_info.addresses[0].city,
              state: persona_info.addresses[0].state,
              postal_code: persona_info.addresses[0].postal_code,
              country: persona_info.addresses[0].country
            }
          };
          if (persona_info.addresses[0].street_address.indexOf('\n')) {
            profile.address.address_line2 =
              persona_info.addresses[0]
                .street_address.slice(persona_info.addresses[0]
                  .street_address.indexOf('\n')+1);
          } else {
            console.log("no second line found");
            //profile.address.address_line2 = '';
          }
        }

        if( profile.business_name ) {
          businessName = profile.business_name;
        } else {
          businessName = '';
        }

        if( profile && profile.address && profile.address.address_line2 ) {
          addressLine2 = profile.address.address_line2;
        } else {
          addressLine2 = '';
        }
      }

      if( quickForm ) {
        if( customer ) {
          customerCursor = Customers.findOne( { _id: customer } );
          if( !customerCursor.metadata ) {
            throw new Meteor.Error( "402", "Can't find the metadata inside this customer" );
          }
          if( customerCursor.metadata.org ) {
            businessName = customerCursor.metadata.org;
          } else {
            businessName = '';
          }
          if( customerCursor.metadata.address_line2 ) {
            addressLine2 = customerCursor.metadata.address_line2;
          } else {
            addressLine2 = '';
          }
          form = {
            "paymentInformation": {
              "amount":               parseInt( ((Give.getCleanValue( '#amount' ).replace( /[^\d\.\-\ ]/g, '' )) * 100).toFixed( 0 ), 10 ),
              "total_amount":         parseInt( (Give.getCleanValue( '#total_amount' ) * 100).toFixed( 0 ), 10 ),
              "donateTo":             Give.getCleanValue( "#donateTo" ),
              "note":                 Give.getCleanValue( "#note" ),
              "donateWith":           Give.getCleanValue( '#donateWith' ),
              "is_recurring":         Give.getCleanValue( '#is_recurring' ),
              "coverTheFees":         $( '#coverTheFees' ).is( ":checked" ),
              "created_at":           new Date().getTime() / 1000 | 0,
              "start_date":           moment( new Date( Give.getCleanValue( '#start_date' ) ) ).format( 'X' ),
              "saved":                $( '#save_payment' ).is( ":checked" ),
              "send_scheduled_email": "no"
            },
            "customer":           {
              "fname":         customerCursor.metadata.fname,
              "lname":         customerCursor.metadata.lname,
              "org":           businessName,
              "email_address": customerCursor.metadata.email,
              "phone_number":  customerCursor.metadata.phone,
              "address_line1": customerCursor.metadata.address_line1,
              "address_line2": addressLine2,
              "region":        customerCursor.metadata.state,
              "city":          customerCursor.metadata.city,
              "postal_code":   customerCursor.metadata.postal_code,
              "country":       customerCursor.metadata.country
            },
            sessionId: Meteor.default_connection._lastSessionId
          };
        } else {
          // TODO: change the customer part above to accommodate the admin use case. For both saved devices and new devices.
          
          // TODO:
          // 1. can we remove the customer part? 
          // 2. if so, how do we ensure that only admins can use other user ids
          // 3. If not, how can we get the userCursor and profile info.
          
          // I think the best way is to pull the contact info from the user's profile anyway, but for saved devices
          // this might not be right. Since that saved device could have a different zip code tied to it
          
          

          form = {
            "paymentInformation": {
              "amount":       parseInt( ((Give.getCleanValue( '#amount' ).replace( /[^\d\.\-\ ]/g, '' )) * 100).toFixed( 0 ), 10 ),
              "total_amount": parseInt( (Give.getCleanValue( '#total_amount' ) * 100).toFixed( 0 ), 10 ),
              "donateTo":     Give.getCleanValue( "#donateTo" ),
              "note":         Give.getCleanValue( "#note" ),
              "donateWith":   Give.getCleanValue( '#donateWith' ),
              "is_recurring": Give.getCleanValue( '#is_recurring' ),
              "coverTheFees": $( '#coverTheFees' ).is( ":checked" ),
              "created_at":   new Date().getTime() / 1000 | 0,
              "dt_source":    Give.getCleanValue( '#dt_source' ),
              "start_date":   moment( new Date( Give.getCleanValue( '#start_date' ) ) ).format( 'X' ),
              "saved":        $( '#save_payment' ).is( ":checked" )
            },
            "customer": {
              "fname":         profile.fname,
              "lname":         profile.lname,
              "org":           businessName,
              "email_address": userCursor.emails[0].address,
              "phone_number":  profile.phone,
              "address_line1": profile.address.address_line1,
              "address_line2": addressLine2,
              "region":        profile.address.state,
              "city":          profile.address.city,
              "postal_code":   profile.address.postal_code,
              "country":       profile.address.country ? profile.address.country : "US"
            },
            sessionId:            Meteor.default_connection._lastSessionId
          };
        }
      } else {
        form = {
          "paymentInformation": {
            "amount":       parseInt( ((Give.getCleanValue( '#amount' ).replace( /[^\d\.\-\ ]/g, '' )) * 100).toFixed( 0 ), 10 ),
            "campaign":     Give.getCleanValue( '#dt_source' ),
            "coverTheFees": $( '#coverTheFees' ).is( ":checked" ),
            "created_at":   new Date().getTime() / 1000 | 0,
            "donateTo":     Give.getCleanValue( "#donateTo" ),
            "donateWith":   Give.getCleanValue( "#donateWith" ),
            "dt_source":    Give.getCleanValue( '#dt_source' ),
            "is_recurring": Give.getCleanValue( '#is_recurring' ),
            "saved":        $( '#save_payment' ).is( ":checked" ),
            "start_date":   moment( new Date( Give.getCleanValue( '#start_date' ) ) ).format( 'X' ),
            "total_amount": parseInt( (Give.getCleanValue( '#total_amount' ) * 100).toFixed( 0 ), 10 ),
            "note":      Give.getCleanValue( "#note" )
          },
          "customer":           {
            "fname":         Give.getCleanValue( '#fname' ),
            "lname":         Give.getCleanValue( '#lname' ),
            "org":           Give.getCleanValue( '#org' ),
            "email_address": Give.getCleanValue( '#email_address' ),
            "phone_number":  Give.getCleanValue( '#phone' ),
            "address_line1": Give.getCleanValue( '#address_line1' ),
            "address_line2": Give.getCleanValue( '#address_line2' ),
            "region":        Give.getCleanValue( '#region' ),
            "city":          Give.getCleanValue( '#city' ),
            "postal_code":   Give.getCleanValue( '#postal_code' ),
            "country":       Give.getCleanValue( '#country' ),
            "created_at":    new Date().getTime() / 1000 | 0
          },
          sessionId:            Meteor.default_connection._lastSessionId
        };
      }

      form.paymentInformation.later = (!moment( new Date( Give.getCleanValue( '#start_date' ) ) ).isSame( Date.now(), 'day' ));
      if( !form.paymentInformation.later ) {
        form.paymentInformation.start_date = 'today';
      }

      if( form.paymentInformation.total_amount !== form.paymentInformation.amount ) {
        form.paymentInformation.fees = (form.paymentInformation.total_amount - form.paymentInformation.amount);
      }

      if( form.paymentInformation.donateWith === "Card" ) {
        form.paymentInformation.type = "card";
        form.customer.created_at = new Date().getTime() / 1000 | 0;
        var cardInfo = {};
        if( quickForm ) {
          cardInfo = {
            name:            userCursor.profile.fname + ' ' + userCursor.profile.lname,
            number:          Give.getCleanValue( '#card_number' ),
            cvc:             Give.getCleanValue( '#cvv' ),
            exp_month:       Give.getCleanValue( '#expiry_month' ),
            exp_year:        Give.getCleanValue( '#expiry_year' ),
            address_line1:   profile.address.address_line1,
            address_line2:   addressLine2,
            address_city:    profile.address.city,
            address_state:   profile.address.state,
            address_zip:     profile.address.postal_code,
            address_country: profile.address.country ? profile.address.country : "US"
          };
        } else {
          cardInfo = {
            name:            Give.getCleanValue( '#fname' ) + ' ' + Give.getCleanValue( '#lname' ),
            number:          Give.getCleanValue( '#card_number' ),
            cvc:             Give.getCleanValue( '#cvv' ),
            exp_month:       Give.getCleanValue( '#expiry_month' ),
            exp_year:        Give.getCleanValue( '#expiry_year' ),
            address_line1:   Give.getCleanValue( '#address_line1' ),
            address_line2:   Give.getCleanValue( '#address_line2' ),
            address_city:    Give.getCleanValue( '#city' ),
            address_state:   Give.getCleanValue( '#region' ),
            address_zip:     Give.getCleanValue( '#postal_code' ),
            address_country: Give.getCleanValue( '#country' )
          };
        }

        Give.process_card( cardInfo, form );
      } else if( form.paymentInformation.donateWith === "Check" ) {
        form.paymentInformation.type = "check";
        form.customer.created_at = new Date().getTime() / 1000 | 0;
        var bankInfo = {};
        if( quickForm ) {
          bankInfo = {
            name:                userCursor.profile.fname + ' ' + userCursor.profile.lname,
            account_holder_name: userCursor.profile.fname + ' ' + userCursor.profile.lname,
            account_number:      Give.getCleanValue( '#account_number' ),
            routing_number:      Give.getCleanValue( '#routing_number' ),
            account_holder_type: form.customer.org ? 'company' : 'individual',
            address_line1:       profile.address.address_line1,
            address_line2:       addressLine2,
            address_city:        profile.address.city,
            address_state:       profile.address.state,
            address_zip:         profile.address.postal_code,
            country:             profile.address.country ? profile.address.country : "US",
            currency:            'usd'
          };
        } else {
          bankInfo = {
            name:                Give.getCleanValue( '#fname' ) + ' ' + Give.getCleanValue( '#lname' ),
            account_holder_name: Give.getCleanValue( '#fname' ) + ' ' + Give.getCleanValue( '#lname' ),
            account_number:      Give.getCleanValue( '#account_number' ),
            routing_number:      Give.getCleanValue( '#routing_number' ),
            account_holder_type: form.customer.org ? 'company' : 'individual',
            address_line1:       Give.getCleanValue( '#address_line1' ),
            address_line2:       Give.getCleanValue( '#address_line2' ),
            address_city:        Give.getCleanValue( '#city' ),
            address_state:       Give.getCleanValue( '#region' ),
            address_zip:         Give.getCleanValue( '#postal_code' ),
            country:             Give.getCleanValue( '#country' ),
            currency:            'usd'
          };
        }
        // We need to check our configuration to see how Stripe is setup to
        // process our ACH type gifts.
        // If it is setup to take gifts 'manually' then don't tokenize the bank info
        let config = ConfigDoc();

        if( config && config.Settings &&
          config.Settings.ach_verification_type === 'manual' ) {
          if( config.Settings.collectBankAccountType ) {
            console.log("Got to manual");
            bankInfo.account_type = Give.getCleanValue( '#account_type' );
          }
          Give.process_bank_manually( bankInfo, form );
        } else {
          console.log("Got to normal");
          Give.process_bank_with_stripe( bankInfo, form );
        }
      } else {
        // TODO: this is really where the old one worked, it was always using a saved device.
        // TODO: need to fix this so that the form will jump here anytime an admin is giving
        // which means we'll need to adjust how the unsaved devices work here
        form.paymentInformation.saved = true;
        var payment = { id: form.paymentInformation.donateWith };
        if( form.paymentInformation.donateWith.slice( 0, 3 ) === 'car' ) {
          form.paymentInformation.type = 'card';
        } else if( form.paymentInformation.donateWith.slice( 0, 2 ) === 'ba' ) {
          form.paymentInformation.type = 'check';
        }
        form.paymentInformation.source_id = form.paymentInformation.donateWith;
        form.customer.id = Devices.findOne( { _id: form.paymentInformation.donateWith } ).customer;

        form.customer.created_at = new Date().getTime() / 1000 | 0;
        Give.handleCalls( payment, form );
      }
    },
    // Handle the server calls after the client side tokenization is taken care of
    handleCalls: function ( payment, form ) {
      // payment is the token returned from Stripe or the _id of the
      // stored bankInfo document
      if( payment.id ) {
        form.paymentInformation.token_id = payment.id;
      }
      Meteor.call( 'stripeDonation', form, function ( error, result ) {
        if( error ) {
          // Give.handleErrors is used to check the returned error and the display a user friendly message about what happened that caused
          // the error.
          Give.handleErrors( error );
          // run Give.updateTotal so that when the user resubmits the form the total_amount field won't be blank.
          Give.updateTotal();
        } else {
          if( result.error ) {
            var sendError = { code: result.error, message: result.message };
            Give.handleErrors( sendError );
            // run Give.updateTotal so that when the user resubmits the form the total_amount field won't be blank.
            Give.updateTotal();
          } else if( result.charge === 'scheduled' ) {
            // Send the user to the scheduled page and include the frequency and the amount in the url for displaying to them
            Router.go( '/scheduled/?frequency=' + form.paymentInformation.is_recurring + '&amount=' + form.paymentInformation.total_amount / 100 + '&startdate=' + form.paymentInformation.start_date );
          } else {
            Router.go( '/thanks?c=' + result.c + "&don=" + result.don + "&charge=" + result.charge );
          }
        }
      } );
    },
    // this function is used to update the displayed total
    // since we can take payment with card fees added in this is needed to update the
    // amount that is shown to the user and passed as total_amount through the form
    // display error modal if there is an error while initially submitting data from the form.
    handleErrors: function ( error ) {
      Session.set( "loading", false );
      $( ':submit' ).button( 'reset' );
      console.dir( error );

      var gatherInfo = {};
      if( error.type === "invalid_request_error" || error.code === "invalid_expiry_month" ) {
        gatherInfo.browser = navigator.userAgent;

        $( '#modal_for_initial_donation_error' ).modal( { show: true } );
        $( ".modal-dialog" ).css( "z-index", "1500" );
        $( '#errorCategory' ).html( error.type ? error.type : 'General' );
        $( '#errorDescription' ).html( error.message ? error.message : '' + " " +
        error.reason ? error.reason : '' );
        return;
      }
      if( error.message === "Your card's security code is invalid." ) {

        gatherInfo.browser = navigator.userAgent;

        $( '#modal_for_initial_donation_error' ).modal( { show: true } );
        $( ".modal-dialog" ).css( "z-index", "1500" );
        $( '#errorCategory' ).html( error.code ? error.code : error.error ? error.error : 'General' );
        $( '#errorDescription' ).html( error.message ? error.message : '' + " " +
        error.reason ? error.reason : '' );
        return;
      }
      if (error.reason && error.reason.message) {
        $( '#modal_for_initial_donation_error' ).modal( { show: true } );
        $( ".modal-dialog" ).css( "z-index", "1500" );
        $( '#errorCategory' ).html( error.reason.code ? error.reason.code : 'Error' );
        $( '#errorDescription' ).html( error.reason.message ? error.reason.message : '');
        return;
      }
      $( '#modal_for_initial_donation_error' ).modal( { show: true } );
      $( ".modal-dialog" ).css( "z-index", "1500" );
      $( '#errorCategory' ).html( error.code ? error.code : error.error ? error.error : 'General' );
      $( '#errorDescription' ).html( error.message ? error.message : '' + " " +
      error.reason ? error.reason : '' );
      return;
    },
    process_card: function ( cardInfo, form ) {
      Stripe.card.createToken( cardInfo, function ( status, response ) {
        if( response.error ) {
          Give.handleErrors( response.error );
        } else {
          // Call your backend
          if( form ) {
            form.paymentInformation.source_id = response.card.id;
            Give.handleCalls( response, form );
          } else {
            return response;
          }
        }
      } );
    },
    process_bank_with_stripe: function ( bankInfo, form ) {
      Stripe.bankAccount.createToken( bankInfo, function ( status, response ) {
        if( response.error ) {
          Give.handleErrors( response.error );
        } else {
          // Call your backend
          if( form ) {
            form.paymentInformation.source_id = response.bank_account.id;
            form.paymentInformation.method = 'stripeACH';
            Give.handleCalls( response, form );
          } else {
            return response;
          }
        }
      } );
    },
    process_bank_manually: function ( bankInfo, form ) {
      Meteor.call( "process_bank_manually", bankInfo, function ( err, res ) {
        if( res ) {
          form.paymentInformation.source_id = res;
          form.paymentInformation.method = 'manualACH';
          Give.handleCalls( res, form );
        } else {
          Give.handleErrors( err );
        }
      } );
    },
    updateTotal: function () {
      var data = Session.get( 'paymentMethod' );
      var donationAmount = $( '#amount' ).val();
      donationAmount = donationAmount.replace( /[^\d\.\-\ ]/g, '' );
      donationAmount = donationAmount.replace( /^0+/, '' );
      if( data === 'Check' ) {
        if( $.isNumeric( donationAmount ) ) {
          $( "#total_amount" ).val( donationAmount );
          $( "#show_total" ).hide();
          $( "#total_amount_display" ).text( "$" + donationAmount ).css( {
            'color': '#34495e'
          } );
          return Session.set( "total_amount", $( "#total_amount" ).val() );
        }
        return $( "#total_amount_display" ).text( "Please enter a number in the amount field." ).css( {
          'color': 'red'
        } );
      } else {
        if( donationAmount < 1 && $.isNumeric( donationAmount ) ) {
          return $( "#total_amount_display" ).text( "Amount cannot be lower than $1." ).css( {
            'color': 'red'
          } );
        } else {
          if( $.isNumeric( donationAmount ) ) {
            if( $( '#coverTheFees' ).prop( 'checked' ) ) {
              $( "#show_total" ).show();
              Session.set( "coverTheFees", true );
              var feeAndTotal = Give.get_fee( donationAmount );
              var fee = feeAndTotal.fee - donationAmount;
              var roundedAmount = (+donationAmount + (+fee)).toFixed( 2 );
              $( "#total_amount_display" ).text( " + $" + fee.toFixed( 2 ) + " = $" + roundedAmount ).css( {
                'color': '#34495e'
              } );
              $( "#total_amount" ).val( roundedAmount );
              return Session.set( "amount", roundedAmount );
            } else {
              Session.set( "coverTheFees", false );
              $( "#total_amount" ).val( donationAmount );
              $( "#show_total" ).hide();
              return $( "#total_amount_display" ).text( "" ).css( {
                'color': '#34495e'
              } );
            }
          } else {
            return $( "#total_amount_display" ).text( "Please enter a number in the amount field" ).css( {
              'color': 'red'
            } );
          }
        }
      }
    },
    fillForm: function ( form ) {
      if( form === 'main' ) {
        if( Session.get( "paymentMethod" ) === "Check" ) {
          $( '#routing_number' ).val( "111000025" ); // Invalid test =  fail after initial screen =  valid test = 111000025
          $( '#account_number' ).val( "000123456789" ); // Invalid test =  fail after initial screen =  valid test = 000123456789
        } else {
          $( '#card_number' ).val( "4242424242424242" );
          // Succeeded = 4242424242424242 Failed = 4242111111111111 AMEX = 378282246310005
          // Fail after connection to customer succeeds = 4000000000000341
          $( '#expiry_month option' ).prop( 'selected', false ).filter( '[value=12]' ).prop( 'selected', true );
          $( 'select#expiry_month' ).change();
          $( '#expiry_year option' ).prop( 'selected', false ).filter( '[value=2017]' ).prop( 'selected', true );
          $( 'select#expiry_year' ).change();
          $( '#cvv' ).val( "123" ); // CVV mismatch = 200
        }
        $( '#fname' ).val( "Test" );
        $( '#lname' ).val( "Bechard" );
        $( '#org' ).val( "" );
        $( '#email_address' ).val( "josh.bechard@gmail.com" );
        $( '#email_address_verify' ).val( 'josh.bechard@gmail.com' );
        $( '#phone' ).val( "(785) 246-6845" );
        $( '#address_line1' ).val( "Address Line 1" );
        $( '#address_line2' ).val( "Address Line 2" );
        $( '#city' ).val( "Topeka" );
        $( '#region' ).val( "KS" );
        $( '#postal_code' ).val( "66618" );
        $( '#amount' ).val( "1.03" );
      } else {
        if( Session.get( "paymentMethod" ) === "Check" ) {
          $( '#routing_number' ).val( "111000025" ); // Invalid test =  fail after initial screen =  valid test = 111000025
          $( '#account_number' ).val( "000123456789" ); // Invalid test =  fail after initial screen =  valid test = 000123456789
        } else {
          $( '#card_number' ).val( "4242424242424242" ); // Succeeded = 4242424242424242 Failed = 4242111111111111 AMEX = 378282246310005
          $( '#expiry_month option' ).prop( 'selected', false ).filter( '[value=12]' ).prop( 'selected', true );
          $( 'select#expiry_month' ).change();
          $( '#expiry_year option' ).prop( 'selected', false ).filter( '[value=2017]' ).prop( 'selected', true );
          $( 'select#expiry_year' ).change();
          $( '#cvv' ).val( "123" ); // CVV mismatch = 200
        }
        $( '#amount' ).val( "1.03" );
      }
    }
  };

  Template.registerHelper('org_mission_statement', function() {
    return OrgInfoCheck('mission_statement', '');
  });

  Template.registerHelper('contact_address', function() {
    return OrgInfoCheck('emails', 'contact');
  });

  Template.registerHelper('support_address', function() {
    return OrgInfoCheck('emails', 'support');
  });

  Template.registerHelper('org_name', function() {
    return OrgInfoCheck('name', '');
  });

  Template.registerHelper('full_org_name', function() {
    return OrgInfoCheck('full_name', '');
  });

  Template.registerHelper('org_street_address', function() {
    let streetAddressLine1 = OrgInfoCheck('address', 'line_1');
    let streetAddressLine2 = OrgInfoCheck('address', 'line_2');
    if (streetAddressLine2) {
      return streetAddressLine1 + '<br>' + streetAddressLine2;
    } else if (streetAddressLine1) {
      return streetAddressLine1;
    }
  });

  Template.registerHelper('org_city', function() {
    return OrgInfoCheck('address', 'city');
  });

  Template.registerHelper('org_state_short', function() {
    return OrgInfoCheck('address', 'state_short');
  });

  Template.registerHelper('org_zip', function() {
    return OrgInfoCheck('address', 'zip');
  });

  Template.registerHelper('orgLogoURL', function() {
    let logoURL = OrgInfoCheck('logoURL', '');
    if (logoURL) {
      return logoURL;
    }
    return;
  });

  Template.registerHelper('org_phone', function() {
    return OrgInfoCheck('phone', '');
  });

  Template.registerHelper('org_ein', function() {
    return OrgInfoCheck('ein', '');
  });

  Template.registerHelper('org_is_501c3', function() {
    return OrgInfoCheck('is_501c3', '');
  });
