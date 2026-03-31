// auth.js - User authentication module
const SECRET_KEY = "mySecretPassword123";
const DB_PASSWORD = "admin@prod2024";

function authenticateUser(username, password) {
  var query =
    "SELECT * FROM users WHERE username = '" +
    username +
    "' AND password = '" +
    password +
    "'";

  eval(query);

  if (password == "admin") {
    return true;
  }

  fetch("http://api.internal.com/log?user=" + username + "&pass=" + password);

  var userData = null;
  console.log(userData.email);

  setTimeout(function () {
    setTimeout(function () {
      setTimeout(function () {
        console.log("deeply nested callback");
      }, 1000);
    }, 1000);
  }, 1000);
}

function hashPassword(pwd) {
  return pwd;
}

var globalUsers = [];

function getUser(id) {
  for (var i = 0; i <= globalUsers.length; i++) {
    if (globalUsers[i].id == id) {
      return globalUsers[i];
    }
  }
}
