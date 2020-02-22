// Authors:
// Shane Oatman https://github.com/shoatman
// Sunil Bandla https://github.com/sunilbandla
// Daniel Dobalian https://github.com/danieldobalian

var express = require("express");
var morgan = require("morgan");
var passport = require("passport");
var BearerStrategy = require('passport-azure-ad').BearerStrategy;

/* Update these four variables with your values from the B2C portal */
var clientID = "7a7e43ef-4da9-424d-ba21-5e1f8a936cde"; 
var b2cDomainHost = "sgsmcs.b2clogin.com";
var tenantIdGuid = "f9a3f145-a634-41ac-b28a-1c0a1c3524f9";
var policyName = "B2C_1A_signup_signin";


var options = {
    identityMetadata: "https://" + b2cDomainHost + "/" + tenantIdGuid + "/" + policyName + "/v2.0/.well-known/openid-configuration/",

    clientID: clientID,
    policyName: policyName,
    isB2C: true,
    validateIssuer: false,
    loggingLevel: 'info',
    loggingNoPII: false,
    passReqToCallback: false
};

var bearerStrategy = new BearerStrategy(options,
    function (token, done) {
        // Send user info using the second argument
        done(null, {}, token);
    }
);

var app = express();
app.use(morgan('dev'));

app.use(passport.initialize());
passport.use(bearerStrategy);

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Authorization, Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.get("/hello",
    passport.authenticate('oauth-bearer', {session: false}),
    function (req, res) {
        var claims = req.authInfo;
        console.log('User info: ', req.user);
        console.log('Validated claims: ', claims);
        
        if (claims['scp'].split(" ").indexOf("smcs.read") >= 0) {
            // Service relies on the name claim.  
            res.status(200).json({'name': claims['name'], 'project': claims['smcsTenantId'], 'SMCS Role': claims['smcsRole']});
        } else {
            console.log("Invalid Scope, 403");
            res.status(403).json({'error': 'insufficient_scope'}); 
        }
    }
);

var port = process.env.PORT || 5000;
app.listen(port, function () {
    console.log("Listening on port " + port);
});
