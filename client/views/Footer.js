Template.Footer.helpers({
  footerText(){
    const config = Config.findOne();
    return config && config.OrgInfo && config.OrgInfo.legalStatement;
  }
});