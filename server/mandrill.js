_.extend(Utils, {
  add_email_vars: function (vars, name, content) {
    logger.info("Started add_email_vars");

    const push_vars = vars.push({"name": name, "content": content});
    return push_vars;
  },
  /**
   * Add the Mandrill to and rcpt fields to the email data_slug
   *
   * @method addRecipientToEmail
   * @param {Object} data_slug - A Mandrill data_slug
   * @param {String|Array} to - email address(es)
   * @returns {Object} data_slug with to and rcpt arrays added
   */
  addRecipientToEmail: function (data_slug, to) {
    logger.info("Started addRecipientToEmail");
    logger.info("TO: " + to + " typeof " + typeof to);
    if (!to) {
      logger.error("No to address");
      return;
    }
    const dataSlugWithTo = data_slug;
    logger.info(dataSlugWithTo.message.to);

    if (!dataSlugWithTo.message.to) {
      logger.info("No existing to field");
      if (typeof to === 'string') {
        logger.info("Single email address");
        logger.info(to);
        dataSlugWithTo.message.to = [{email: to, type: "bcc"}];
      } else {
        logger.info("Array of email addresses");
        dataSlugWithTo.message.to = to.map(function (item) {
          return {email: item, type: "bcc"};
        });
      }
    }
    logger.info(dataSlugWithTo);
    return dataSlugWithTo;
  },
  /**
   * Constructs an email notice
   *
   * @method sendEmailNotice
   * @param {Object} emailObject - Email Object
   * @param {String|Array} emailObject.to - Email addresses to send to (sent as BCC)
   * @param {String} emailObject.previewLine - The text that will appear in the email preview line
   * @param {String} emailObject.type - Email type
   * @param {String} emailObject.emailMessage - Main email message
   * @param {String} emailObject.buttonText - Button text
   * @param {String} emailObject.buttonURL - Button URL
   */
  sendEmailNotice(emailObject) {
    logger.info("Started sendEmailNotice");
    logger.info("Here is the emailObject info: ");
    logger.info(emailObject);
    const config = ConfigDoc();

    if (!(config && config.OrgInfo && config.OrgInfo.emails && config.OrgInfo.emails.support)) {
      logger.warn("There is no support email to send to.");
      return;
    }

    if (!(config && config.Services &&
      config.Services.Email && config.Services.Email.notices)) {
      logger.warn("No alert template setup.");
      return;
    }

    const data_slug = {
      "template_name": config.Services.Email.notices,
      "template_content": [
        {}
      ],
      "message": {
        "global_merge_vars": [
          {
            "name": "DEV",
            "content": Meteor.settings.dev
          }, {
            "name": "PreviewLine",
            "content": emailObject.previewLine
          }, {
            "name": "EmailType",
            "content": emailObject.type
          }, {
            "name": "EmailMessage",
            "content": emailObject.emailMessage ? emailObject.emailMessage : "No additional message text"
          }, {
            "name": "ButtonText",
            "content": emailObject.buttonText
          }, {
            "name": "ButtonURL",
            "content": emailObject.buttonURL
          }, {
            "name": "AppURL",
            "content": Meteor.absoluteUrl()
          }
        ]
      }
    };

    Utils.send_mandrill_email(data_slug, config.Services.Email.notices, emailObject.to, 'Admin Notice');
  },
  /**
   * Push the image vars to the Mandrill data_slug
   *
   * @method setupImages
   * @param {Object} dataSlug - this is the data_slug that Mandrill uses.
   */
  setupImages: function (dataSlug) {
    logger.info("Started setupImages");
    const config = ConfigDoc();

    const newDataSlug = dataSlug;
    let logoURL;
    let receiptImageURL;
    const emailLogo = Images.findOne({$and: [{configId: config._id}, {meta: {"emailLogo": "_true"}}]});
    const receiptImage = Images.findOne({$and: [{configId: config._id}, {meta: {"receiptImage": "_true"}}]});
    if (emailLogo) {
      logoURL = emailLogo.versions.thumbnail.meta.pipeFrom;
    } else {
      logoURL = '';
    }

    if (receiptImage) {
      receiptImageURL = receiptImage.versions.thumbnail.meta.pipeFrom;
    } else {
      receiptImageURL = '';
    }

    newDataSlug.message.global_merge_vars.push(
      {
        "name": "LogoURL",
        "content": logoURL
      }
    );
    newDataSlug.message.global_merge_vars.push(
      {
        "name": "ReceiptImage",
        "content": receiptImageURL
      }
    );

    return newDataSlug;
  },
  /**
   * Add the from fields to the data_slug
   *
   * @method setupEmailFrom
   * @param {Object} dataSlug - this is the data_slug that Mandrill uses.
   */
  setupEmailFrom: function (dataSlug) {
    logger.info("Started setupEmailFrom");
    const config = ConfigDoc();
    const newDataSlug = dataSlug;

    newDataSlug.message.from_email = config.OrgInfo.emails.support;
    newDataSlug.message.from_name = config.OrgInfo.name;

    return newDataSlug;
  },
  /**
   * Add the Org fields to the data_slug
   *
   * @method addOrgInfoFields
   * @param {Object} dataSlug - this is the data_slug that Mandrill uses.
   */
  addOrgInfoFields: function (dataSlug) {
    logger.info("Started addOrgInfoFields");
    const config = ConfigDoc();
    const newDataSlug = dataSlug;

    if (config && config.OrgInfo && config.OrgInfo.emails) {
      newDataSlug.message.global_merge_vars.push(
        {
          "name": "OrgName",
          "content": config.OrgInfo.name
        }, {
          "name": "OrgFullName",
          "content": config.OrgInfo.full_name
        }, {
          "name": "OrgPhone",
          "content": config.OrgInfo.phone
        }, {
          "name": "SupportEmail",
          "content": config.OrgInfo.emails.support
        }, {
          "name": "ContactEmail",
          "content": config.OrgInfo.emails.contact
        }, {
          "name": "OrgAddressLine1",
          "content": config.OrgInfo.address.line_1
        }, {
          "name": "OrgAddressLine2",
          "content": config.OrgInfo.address.line_2 ? config.OrgInfo.address.line_2 : ''
        }, {
          "name": "OrgCity",
          "content": config.OrgInfo.address.city
        }, {
          "name": "OrgState",
          "content": config.OrgInfo.address.state_short
        }, {
          "name": "OrgZip",
          "content": config.OrgInfo.address.zip
        }, {
          "name": "OrgMissionStatement",
          "content": config.OrgInfo.mission_statement
        }, {
          "name": "OrgIs501c3",
          "content": config.OrgInfo.is_501c3
        }
      );
    }

    return newDataSlug;
  },
  send_cancelled_email_to_admin: function (subscription_id, stripeEvent) {
    logger.info("Started send_cancelled_email_to_admin");
    const config = ConfigDoc();
    if (!(config && config.OrgInfo && config.OrgInfo.emails && config.OrgInfo.emails.canceledGift)) {
      logger.warn("There aren't any email addresses in the canceled gift notice field.");
      return;
    }

    const audit_trail_cursor = Audit_trail.findOne({
      relatedDoc: subscription_id,
      category: 'Email',
      subtype: 'deleted'
    });
    // Check to see if the deleted subscription email has already been sent for this charge
    if (audit_trail_cursor) {
      logger.info("A 'subscription deleted' email has already been sent, exiting email send function.");
      return;
    }

    const start_date = moment(new Date(stripeEvent.data.object.start * 1000)).format('DD MMM, YYYY');

    const last_gift = moment(new Date(stripeEvent.data.object.current_period_start * 1000)).format('DD MMM, YYYY');

    let canceled_date = new Date(stripeEvent.data.object.canceled_at * 1000);
    canceled_date = moment(canceled_date).format('DD MMM, YYYY hh:mma');

    const customer_cursor = Customers.findOne({_id: stripeEvent.data.object.customer});

    const donor_name = customer_cursor && customer_cursor.metadata && customer_cursor.metadata.fname + " " + customer_cursor.metadata.lname;

    const donateWith = stripeEvent.data.object.metadata && stripeEvent.data.object.metadata.donateWith;

    const canceledReason = stripeEvent.data.object.metadata &&
      stripeEvent.data.object.metadata.canceled_reason;

    // Look for invoices with this subscription_id that haven't been paid and have an attempt count of 4
    const fourFailedAttempts = Invoices.findOne({subscription: subscription_id, attempt_count: 4, paid: false});
    const emailMessage = "A recurring gift with a frequency of, every " +
      stripeEvent.data.object.plan.interval + ", was canceled. The recurring gift amount was $" +
      (stripeEvent.data.object.quantity / 100).toFixed(2) + ". The payment method was (a) " +
      (donateWith && donateWith.toLowerCase()) + ". The gift start date was " + start_date +
      ". The last time this recurring gift charged was " + last_gift +
      ". The gift was canceled on " + canceled_date + '. ' + (fourFailedAttempts ?
        "This recurring gift was canceled because it reached the failed gift retry limit." :
        (canceledReason ? ("The reason given was '" + canceledReason + ".") :
          "The gift was canceled from the Stripe Dashboard, not from Give."));
    const emailObject = {
      to: config.OrgInfo.emails.canceledGift,
      previewLine: "",
      type: 'Canceled Recurring Gift',
      emailMessage: emailMessage,
      buttonText: 'Donor Tools Person',
      buttonURL: config.Settings.DonorTools.url + (customer_cursor.metadata.dt_persona_id ? ('/people/' + customer_cursor.metadata.dt_persona_id) :
        ("/personas?search=" + customer_cursor.email))
    };

    logger.info("emailObject:", emailObject);
    Utils.sendEmailNotice(emailObject);

    const event = {
      id: subscription_id,
      emailSentTo: config.OrgInfo.emails.canceledGift,
      type: 'subscription.deleted',
      category: 'Email',
      relatedCollection: 'Subscriptions',
      page: '/dashboard/subscriptions?sub=' + subscription_id,
      otherInfo: emailMessage
    };

    Utils.audit_event(event);
  },
  send_donation_email: function (recurring, id, amount, type, body, frequency, subscription) {
    try {
      logger.info("Started send_donation_email with these parameters");
      logger.info("recurring:", recurring);
      logger.info("id:", id);
      logger.info("amount:", amount);
      logger.info("type:", type);
      logger.info("event body:", body);
      logger.info("frequency:", frequency);
      logger.info("subscription:", subscription);
      const config = ConfigDoc();

      if (config && config.Services && config.Services.Email &&
        config.Services.Email.emailSendMethod) {
        logger.info("Sending with email send method of: " + config.Services.Email.emailSendMethod);
      } else {
        logger.error("There is no email send method, can't send email.");
        return;
      }

      if (type === "charge.updated") {
        logger.info("Don't need to send an email when a charge is updated, exiting the send_donation_email method.");
        return;
      }
      let donation_cursor;
      const splitType = type.split(".");
      const auditTrailDoc = Audit_trail.findOne({relatedDoc: id, subtype: splitType[1]});
      if (auditTrailDoc) {
        logger.info("Already have this record in the audit trail, escaping function");
        return;
      }
      const event = {
        id: id,
        type: type,
        category: 'Stripe',
        relatedCollection: 'Charges',
        failureCode: body.failure_code,
        failureMessage: body.failure_message,
        page: '/thanks?charge=' + id
      };

      if (type !== 'large_gift') {
        // Audit the charge event
        Utils.audit_event(event);
      }

      // TODO: for failed gifts we need to change the event.page it should be more like this
      // Meteor.absoluteUrl("user/subscriptions/" + payment_type.toLowerCase() + "/change?s=" +
      // subscription + "&c=" + subscription_cursor.customer

      const charge_cursor = Charges.findOne({_id: id});
      logger.info(charge_cursor);

      if (!charge_cursor) {
        logger.error("No charge found here, exiting.");
        return;
      }

      const customer_cursor = Customers.findOne({_id: charge_cursor.customer});
      if (!customer_cursor) {
        logger.error("No customer found here, exiting.");
        return;
      }

      const data_slug = {
        "template_name": "",
        "template_content": [
          {}
        ],
        "message": {
          "global_merge_vars": [
            {
              "name": "CreatedAt",
              "content": moment(new Date(Number(charge_cursor.created * 1000))).format('MM/DD/YYYY h:mma')
            }, {
              "name": "DEV",
              "content": Meteor.settings.dev
            }, {
              "name": "TotalGiftAmount",
              "content": (charge_cursor.amount / 100).toFixed(2)
            }, {
              "name": "ADDRESS_LINE1",
              "content": customer_cursor.metadata.address_line1
            }, {
              "name": "LOCALITY",
              "content": customer_cursor.metadata.city
            }, {
              "name": "REGION",
              "content": customer_cursor.metadata.state
            }, {
              "name": "POSTAL_CODE",
              "content": customer_cursor.metadata.postal_code
            }, {
              "name": "PHONE",
              "content": customer_cursor.metadata.phone
            }, {
              "name": "c",
              "content": charge_cursor.customer
            }, {
              "name": "charge",
              "content": charge_cursor._id
            }, {
              "name": "CHARGEID",
              "content": charge_cursor._id
            }, {
              "name": "failure_message",
              "content": charge_cursor.failure_message
            }, {
              "name": "failure_code",
              "content": charge_cursor.failure_code
            }, {
              "name": "URL",
              "content": Meteor.absoluteUrl()
            }
          ]
        }
      };

      if (charge_cursor.metadata.fees && charge_cursor.metadata.fees > 0) {
        data_slug.message.global_merge_vars.push(
          {
            "name": "GiftAmountFees",
            "content": (charge_cursor.metadata.fees / 100).toFixed(2)
          },
          {
            "name": "GiftAmount",
            "content": ((amount / 100).toFixed(2) - (charge_cursor.metadata.fees / 100).toFixed(2))
          }
        );
      } else {
        data_slug.message.global_merge_vars.push(
          {
            "name": "GiftAmount",
            "content": (amount / 100).toFixed(2)
          }
        );
      }
      if (customer_cursor.metadata.address_line2) {
        data_slug.message.global_merge_vars.push(
          {
            "name": "ADDRESS_LINE2",
            "content": customer_cursor.metadata.address_line2
          }
        );
      }

      if (customer_cursor.metadata.business_name) {
        data_slug.message.global_merge_vars.push(
          {
            "name": "FULLNAME",
            "content": customer_cursor.metadata.business_name + "<br>" + customer_cursor.metadata.fname + " " + customer_cursor.metadata.lname
          }
        );
      } else {
        data_slug.message.global_merge_vars.push(
          {
            "name": "FULLNAME",
            "content": customer_cursor.metadata.fname + " " + customer_cursor.metadata.lname
          }
        );
      }

      // Get the donation with description for either the card or the bank account
      if (charge_cursor && charge_cursor.source && charge_cursor.source.brand) {
        data_slug.message.global_merge_vars.push(
          {
            "name": "DonateWith",
            "content": charge_cursor.source.brand + " - ending in, " + charge_cursor.source.last4
          }, {
            "name": "NAME",
            "content": charge_cursor.source.name
          }, {
            "name": "TYPE",
            "content": "card"
          }
        );
      } else if (charge_cursor && charge_cursor.source && charge_cursor.source.bank_name) {
        data_slug.message.global_merge_vars.push(
          {
            "name": "DonateWith",
            "content": charge_cursor.source.bank_name + " - ending in, " + charge_cursor.source.last4
          }, {
            "name": "NAME",
            "content": charge_cursor.source.name
          }, {
            "name": "TYPE",
            "content": "bank"
          }
        );
      } else {
        data_slug.message.global_merge_vars.push(
          {
            "name": "DonateWith",
            "content": charge_cursor.payment_source.bank_name + " - ending in, " + charge_cursor.payment_source.last4
          }, {
            "name": "NAME",
            "content": customer_cursor.metadata.fname + " " + customer_cursor.metadata.lname
          }
        );
      }

      if (frequency !== "One Time") {
        if (frequency === 'day') {
          data_slug.message.global_merge_vars.push(
            {
              "name": "Frequency",
              "content": "daily"
            }
          );
        } else if (frequency === 'semi-annual') {
          data_slug.message.global_merge_vars.push(
            {
              "name": "Frequency",
              "content": "semi-annual"
            }
          );
        } else {
          data_slug.message.global_merge_vars.push(
            {
              "name": "Frequency",
              "content": frequency + "ly"
            }
          );
        }
      } else {
        data_slug.message.global_merge_vars.push(
          {
            "name": "Frequency",
            "content": "one time"
          }
        );
      }

      if (subscription) {
        donation_cursor = Donations.findOne({subscription_id: subscription});
        const subscription_cursor = Subscriptions.findOne({_id: subscription});

        // payment_type is for setting the payment type used for this subscription, commonly "card", or "bank"
        const payment_type = subscription_cursor.metadata.donateWith.slice(0, 4);

        if (!donation_cursor) {
          if (type !== 'charge.failed') {
            logger.error("No donation found here, exiting.");
            return;
          }
          data_slug.template_name = config.Services.Email.failedPayment;
          data_slug.message.global_merge_vars.push({
            "name": "URL",
            "content": Meteor.absoluteUrl("user/subscriptions/" + payment_type.toLowerCase() + "/change?s=" +
              subscription + "&c=" + subscription_cursor.customer)
          });
        } else if (type === 'charge.failed') {
          data_slug.template_name = config.Services.Email.failedPayment;
          data_slug.message.global_merge_vars.push({
            "name": "URL",
            "content": Meteor.absoluteUrl("user/subscriptions/" + payment_type.toLowerCase() + "/change?s=" +
              subscription + "&c=" + subscription_cursor.customer)
          });
          if (subscription_cursor.metadata.donateTo) {
            data_slug.message.global_merge_vars.push({
              "name": "DonateTo",
              "content": Utils.getDonateToName(subscription_cursor.metadata.donateTo)
            });
          } else {
            logger.info("donationSplitsId: " + subscription_cursor.metadata.donationSplitsId);
            const splits = DonationSplits.findOne({_id: subscription_cursor.metadata.donationSplitsId})
              && DonationSplits.findOne({_id: subscription_cursor.metadata.donationSplitsId}).splits;
            const splitsWithDetails = [];
            splits.forEach(function (split) {
              splitsWithDetails.push({
                donateTo: Utils.getDonateToName(split.donateTo),
                amount: (split.amount / 100).toFixed(2)
              });
            });
            data_slug.message.global_merge_vars.push(
              {
                "name": "splits",
                "content": splitsWithDetails
              }
            );
            data_slug.message.global_merge_vars.push(
              {
                "name": "donationIsSplit",
                "content": true
              }
            );
          }
          data_slug.message.global_merge_vars.push(
            {
              "name": "don",
              "content": donation_cursor._id
            }
          );
        } else if (type === 'charge.succeeded' ||
          type === 'large_gift') {
          if (subscription_cursor.metadata.donateTo) {
            data_slug.message.global_merge_vars.push(
              {
                "name": "DonateTo",
                "content": Utils.getDonateToName(subscription_cursor.metadata.donateTo)
              }
            );
          } else {
            logger.info("donationSplitsId: " + subscription_cursor.metadata.donationSplitsId);
            const splits = DonationSplits.findOne({_id: subscription_cursor.metadata.donationSplitsId})
              && DonationSplits.findOne({_id: subscription_cursor.metadata.donationSplitsId}).splits;
            const splitsWithDetails = [];
            splits.forEach(function (split) {
              splitsWithDetails.push({
                donateTo: Utils.getDonateToName(split.donateTo),
                amount: (split.amount / 100).toFixed(2)
              });
            });
            data_slug.message.global_merge_vars.push(
              {
                "name": "splits",
                "content": splitsWithDetails
              }
            );
            data_slug.message.global_merge_vars.push(
              {
                "name": "donationIsSplit",
                "content": true
              }
            );
          }
          data_slug.message.global_merge_vars.push(
            {
              "name": "don",
              "content": donation_cursor._id
            }
          );
        }
      } else {
        donation_cursor = Donations.findOne({charge_id: id});
        if (!donation_cursor) {
          if (type !== 'charge.failed') {
            logger.error("No donation found here, exiting.");
            return;
          }
          // If you get to this area it means the donor would have already seen their gift
          // failed. If there is no donation cursor that means the gift process
          // didn't get past the initial screen and so the donor already knows
          // their gift failed. Sending an email here would just confuse them
        } else {
          logger.info("donateTo: " + donation_cursor.donateTo);
          if (!donation_cursor.donateTo) {
            const splits = DonationSplits.findOne({_id: donation_cursor.donationSplitsId})
              && DonationSplits.findOne({_id: donation_cursor.donationSplitsId}).splits;
            const splitsWithDetails = [];
            splits.forEach(function (split) {
              splitsWithDetails.push({
                donateTo: Utils.getDonateToName(split.donateTo),
                amount: (split.amount / 100).toFixed(2)
              });
            });
            data_slug.message.global_merge_vars.push(
              {
                "name": "splits",
                "content": splitsWithDetails
              }
            );
            data_slug.message.global_merge_vars.push(
              {
                "name": "donationIsSplit",
                "content": true
              }
            );
          } else {
            data_slug.message.global_merge_vars.push(
              {
                "name": "donateTo",
                "content": Utils.getDonateToName(donation_cursor.donateTo)
              }
            );
          }
          data_slug.message.global_merge_vars.push(
            {
              "name": "don",
              "content": donation_cursor._id
            }
          );
        }
      }

      let to, subject;
      to = customer_cursor.email;
      if (type === 'charge.failed') {
        subject = 'Your gift failed to process.';
      } else if (type === 'charge.pending') {
        data_slug.template_name = config.Services.Email.pending;
        subject = 'Donation';
      } else if (type === 'charge.succeeded') {
        data_slug.template_name = config.Services.Email.receipt;
        subject = 'Receipt for your donation';
      } else if (type === 'large_gift') {
        if (!(config && config.OrgInfo && config.OrgInfo.emails && config.OrgInfo.emails.largeGift)) {
          logger.warn("No large gift email(s) to send to.");
          return;
        }

        const companyName = customer_cursor.metadata.business_name || "";
        const fullName = customer_cursor.metadata.fname + " " + customer_cursor.metadata.lname;
        const emailObject = {
          to: config.OrgInfo.emails.largeGift,
          previewLine: companyName || fullName + ' just gave $' + (amount / 100).toFixed(2),
          type: 'Large Gift',
          emailMessage: companyName || fullName + ' just gave $' + (amount / 100).toFixed(2),
          buttonText: 'Receipt Link',
          buttonURL: config.Settings.DonorTools.url + '/donations?transaction_id=' + charge_cursor._id
        };

        Utils.sendEmailNotice(emailObject);

        event.emailSentTo = config.OrgInfo.emails.largeGift;
        event.category = 'Email';
        event.page = emailObject.buttonURL;
        Utils.audit_event(event);
        return;
      }

      Utils.send_mandrill_email(data_slug, type, to, subject);
      event.emailSentTo = to;
      event.category = 'Email';
      // Audit the email send event
      Utils.audit_event(event);

    }
    catch (e) {
      logger.error('Mandril sendEmailOutAPI Method error: ' + e);
      throw new Meteor.Error(e);
    }
  },
  send_mandrill_email: function (data_slug, type, to, subject) {
    try {
      logger.info("Started send_mandrill_email type: " + type);
      const config = ConfigDoc();

      if (config && config.Services && config.Services.Email &&
        config.Services.Email.emailSendMethod) {
        if (config.Services.Email.emailSendMethod === "Mandrill") {
          Utils.configMandrill();
        }
        logger.info("Sending with email send method of: " + config.Services.Email.emailSendMethod);
      } else {
        logger.error("There is no email send method, can't send email.");
        return;
      }

      if (config && config.OrgInfo && config.OrgInfo.emails && config.OrgInfo.emails.bccAddress) {
        data_slug.message.bcc_address = config.OrgInfo.emails.bccAddress;
      }

      // Add all the standard merge_vars and standard fields for emails
      const dataSlugWithImageVars = Utils.setupImages(data_slug);
      const dataSlugWithFrom = Utils.setupEmailFrom(dataSlugWithImageVars);
      const dataSlugWithTo = Utils.addRecipientToEmail(dataSlugWithFrom, to);
      const dataSlugWithOrgInfoFields = Utils.addOrgInfoFields(dataSlugWithTo);
      dataSlugWithOrgInfoFields.message.subject = subject;
      dataSlugWithOrgInfoFields.message.merge_language = "handlebars";
      Mandrill.messages.sendTemplate(dataSlugWithOrgInfoFields);
    } catch (e) {
      logger.error('Mandril sendEmailOutAPI Method error message: ' + e.message);
      logger.error('Mandril sendEmailOutAPI Method error: ' + e);
      throw new Meteor.Error(e);
    }
  },
  send_scheduled_email: function (id, subscription_id, frequency, amount) {
    logger.info("Started send_scheduled_email with ID: " + id + " subscription_id: " +
      subscription_id + " frequency: " + frequency + "amount: " + amount);
    const config = ConfigDoc();

    if (!(config && config.Services && config.Services.Email &&
      config.Services.Email.scheduled)) {
      logger.warn("There is no template for scheduled emails.");
      return;
    }

    // Check to see if this email has already been sent before continuing, log it if it hasn't
    const subscription_cursor = Subscriptions.findOne({_id: subscription_id});
    if (subscription_cursor.metadata &&
      subscription_cursor.metadata.send_scheduled_email &&
      subscription_cursor.metadata.send_scheduled_email === 'no') {
      return;
    }

    const auditTrailDoc = Audit_trail.findOne({
      relatedDoc: subscription_id,
      category: 'Email',
      subtype: 'scheduled'
    });
    if (auditTrailDoc) {
      logger.info("Already have this record in the audit trail, escaping function");
      return;
    }

    // Setup the rest of the cursors that we'll need
    const donation_cursor = Donations.findOne({_id: id});
    const customer_cursor = Customers.findOne(donation_cursor.customer_id);
    const email_address = customer_cursor.email;

    let start_at = subscription_cursor.trial_end;
    start_at = moment(start_at * 1000).format("MMM DD, YYYY");

    const event = {
      emailSentTo: email_address,
      id: subscription_id,
      type: 'charge.scheduled',
      category: 'Email',
      userId: '',
      relatedCollection: 'Subscriptions',
      page: '/dashboard/subscriptions?sub=' + subscription_id,
      otherInfo: start_at
    };
    Utils.audit_event(event);


    // convert the amount from an integer to a two decimal place number
    amount = (amount / 100).toFixed(2);

    const data_slug = {
      "template_name": config.Services.Email.scheduled,
      "template_content": [
        {}
      ],
      "message": {
        "global_merge_vars": [
          {
            "name": "StartDate",
            "content": start_at
          }, {
            "name": "DEV",
            "content": Meteor.settings.dev
          }, {
            "name": "SUB_GUID",
            "content": subscription_id
          }, {
            "name": "Frequency",
            "content": frequency
          }, {
            "name": "Amount",
            "content": amount
          }
        ]
      }
    };
    Utils.send_mandrill_email(data_slug, config.Services.Email.scheduled, email_address, 'Scheduled Gift');
  },
  /**
   *  Send an email to a fundraiser when they are added to a campaign
   *
   *  @method sendFundraiserAddedEmail
   *  @param {String} email - Email address of the fundraiser
   *  @param {String} tripId - The ID of the trip they have been added to
   */
  sendFundraiserAddedEmail: function (email, tripId) {
    const user = Meteor.users.findOne({'emails.address': email});

    logger.info("Started sendFundraiserAddedEmail with email address of: ", email);
    const config = ConfigDoc();

    if (!(config && config.Services && config.Services.Email &&
      config.Services.Email.newFundraiser)) {
      logger.warn("There is no template for new fundraisers emails.");
      return;
    }

    const auditTrailDoc = Audit_trail.findOne({
      id: tripId,
      emailSentTo: email,
      category: 'Email',
      type: 'fundraiser',
      subtype: 'setup'
    });
    if (auditTrailDoc) {
      logger.info("Already have this record in the audit trail, escaping function");
      return;
    }

    const event = {
      id: tripId,
      emailSentTo: email,
      type: 'fundraiser setup',
      category: 'Email',
      userId: user._id,
      relatedCollection: 'Fundraisers',
      page: Meteor.absoluteUrl("trips/admin/", tripId)
    };
    Utils.audit_event(event);


    const data_slug = {
      "template_name": config.Services.Email.newFundraiser,
      "template_content": [
        {}
      ],
      "message": {
        "global_merge_vars": [
          {
            "name": "URL",
            "content": Meteor.absoluteUrl()
          }, {
            "name": "DEV",
            "content": Meteor.settings.dev
          }
        ]
      }
    };
    Utils.send_mandrill_email(data_slug, config.Services.Email.newFundraiser, email, 'Welcome');
  }
});
