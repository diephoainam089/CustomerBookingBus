module.exports = {
    'isLoggedIn': function (req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        }
        req.session.oldUrl = req.originalUrl;
        res.redirect('../user/signin');
    },
    'notLoggedIn': function (req, res, next) {
        if (!req.isAuthenticated()) {
            return next();
        }
        res.redirect('/');
    },
    'check_valid': async (arrCheck) => {
        var pattern = new RegExp(/[~`!#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?]/); //unacceptable chars
        if (pattern.test(arrCheck)) {
            // alert("Please only use standard alphanumerics");
            return false;
        }
        return true; //good user input
    }
}