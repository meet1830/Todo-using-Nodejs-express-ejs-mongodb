// importing express
const express = require("express");
const validator = require("validator");
const { cleanUpAndValidate } = require("./Utils/AuthUtils");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const UserSchema = require("./UserSchema");
const session = require("express-session");
const mongoDBSession = require("connect-mongodb-session")(session);
const isAuth = require("./middleware");

// creating a server
const app = express();

// set render method to ejs
// for rendering ejs we need view engine
// for it to work the folder name should be views and should contain the files to be rendered
// ejs is run by view engine like chrome is run by v8 engine
app.set("view engine", "ejs");

// remove warning in console
// uptil mongoose 7 this prop was false by default, but after that manually have to set it true or false
mongoose.set("strictQuery", false);
const mongoURI = `mongodb+srv://meet:meet123@cluster0.eym9t1e.mongodb.net/cluster0`;
mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then((res) => {
    console.log("DB connected");
  })
  .catch((err) => {
    console.log("Failed to connect to DB", err);
  });

// these lines help take out the body if sending some data
// middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// both packages installed for session based authentication
// session will be created in backend and will be sent to frontend and will be stored there in the form of a cookie
// express session does this
// connect mongodb session helps store that session in database

// adding session
// create a store first
// this will store the session inside db
const store = new mongoDBSession({
  uri: mongoURI,
  collection: "sessions",
  // by which name we want to see this collection in the db
});

// use middlewares
// secret key matches the password or the information and creates a long string
app.use(
  session({
    secret: "this is my secret code",
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);

// home route
app.get("/", (req, res) => {
  res.send("Welcome to my app");
});

// login page
app.get("/login", (req, res) => {
  // return res.send("Login page");
  // instead of just sending a string, we want to render the template for login from ejs file
  return res.render("login");
});

app.post("/login", async (req, res) => {
  // login id since we can receive email or username
  // sending both the things to body
  const { loginId, password } = req.body;

  if (
    typeof loginId !== "string" ||
    typeof password !== "string" ||
    !loginId ||
    !password
  ) {
    return res.send({
      status: 400,
      message: "Invalid data",
    });
  }

  // find and findOne
  // find returns all the matching keys and returns an array of objects
  // findOne returns single object or null if not able to find
  let userDB;
  try {
    if (validator.isEmail(loginId)) {
      // key will be email but value will be login id that is to be found out
      // make app.post login above async to get rid of await error
      userDB = await UserSchema.findOne({ email: loginId });
    } else {
      // else make search with username
      userDB = await UserSchema.findOne({ username: loginId });
    }
    console.log(userDB);

    // if no userdb hence user needs to register first
    if (!userDB) {
      return res.send({
        status: 400,
        message: "User not found, please register first",
        error: err,
      });
    }

    // comparing password
    const isMatch = await bcrypt.compare(password, userDB.password);
    if (!isMatch) {
      return res.send({
        status: 400,
        message: "Invalid password",
        data: req.body,
        // can send the data to front end so that user can see the password entered
      });
    }

    // final return
    // marking that the authentication is successfull and hence session can be created
    // now everytime while browsing the website just check isauth to be true for that session and restricted pages can be shown to user
    req.session.isAuth = true;
    // store user details in the session
    // if user logs in using different device or browser then db should know that the user has two logins hence send user details, generate different sessions
    // hence to keep track of the multiple sessions in db, which sessions belongs to which user, hence send user details
    req.session.user = {
      username: userDB.username,
      email: userDB.email,
      userId: userDB._id,
    };
    // return res.send({
    //   status: 200,
    //   message: "Logged in successfully",
    // });
    res.redirect("/dashboard");
  } catch (err) {
    return res.send({
      status: 400,
      message: "Internal server error, please login again",
      error: err,
    });
  }
});

// create a route for /home
// check for authentication - isauth is a middle ware the logic inside parenthesis is next, middleware went and see in its code if authenticated then execute next function, called authenticated middleware, or authenticated route
// home just for demonstration purpose redirect to dashboard
/*
app.get("/home", isAuth, (req, res) => {
  // first check if user is authenticated
  if (req.session.isAuth) {
    return res.send({
      message: "This is your homepage",
    });
  } else {
    return res.send({
      message: "Please login again",
    });
  }
});
*/

// creating logout and logoutfromalldevices routes
app.post("/logout", isAuth, (req, res) => {
  // using destroy method to clear out cookies and sessions in db, also catching any error in the process. if successfull redirect to login page
  req.session.destroy((err) => {
    if (err) throw err;
    res.redirect("/login");
  });
});

app.post("/logout_from_all_devices", isAuth, async (req, res) => {
  // have to get the user details to delete all the sessions, in logout had to delete only the current session, but here since have to delete all the sessions in the db need user details
  // we will get that from cookies
  console.log(req.session.user.username);
  // data stored in db in the above format, just console.log(req.session) to view whole obj
  // we have not created a schema for sessions till now
  // first schema is created, then its model is created and then through that model findone func can run
  // module.exports = mongoose.model("users", UserSchema);
  // hence create sessionschema first

  // this line is required to create any schema
  const Schema = mongoose.Schema;
  const sessionSchema = new Schema({ _id: String }, { strict: false });
  // strict: is the id or whatever info compulsory everytime, here no hence marked as false

  // convert the schema into a model
  const sessionModel = mongoose.model("sessions", sessionSchema);

  const username = req.session.user.username;
  // can perform ops on this model
  try {
    const sessionDB = await sessionModel.deleteMany({
      "session.user.username": username,
    });
    console.log(sessionDB);
    return res.send({
      status: 200,
      message: "Logged out from all devices",
    });
  } catch (err) {
    return res.send({
      status: 400,
      message: "Log out from all devices failed",
      error: err,
    });
  }
});

// /dashboard means redirect to todo app
app.get("/dashboard", isAuth, (req, res) => {
  return res.render("dashboard");
});

app.get("/register", (req, res) => {
  // return res.send("Register page");
  return res.render("register");
});

app.post("/register", async (req, res) => {
  console.log(req.body);
  // destructuring the info that we are getting in terminal which is filled in the form, after that form is submitted and post request is made and we get the information
  const { name, email, username, password } = req.body;

  // since below func is async hence need to await for it so that it can validate before moving forward, hence have to mention async in parent function
  try {
    await cleanUpAndValidate({ name, email, username, password });
  } catch (err) {
    return res.send({
      status: 400,
      message: err,
    });
  }
  // since retuning a promise we also need to catch it. since .then and .catch will become very messy hence after this all code has to be written in .then block, we use try catch block

  // sending a password here to the backend without encrypting, security issue
  // hence encrypting the password
  // bcrypt internally uses md5 algo
  const hashedPassword = await bcrypt.hash(password, 7);
  //   console.log(hashedPassword);

  // insert into db
  let user = new UserSchema({
    name: name,
    username: username,
    password: hashedPassword,
    email: email,
  });

  // check if user present in the db
  let userExists;
  try {
    userExists = await UserSchema.findOne({ email });
  } catch (err) {
    return res.send({
      status: 400,
      // message user already exists, but many other problems can occur like internet down when checking, user goes away, etc
      message: "Internal server error, Please try again",
      error: err,
    });
  }

  // in findone function mongodb returns the whole matching object to it, or else returns nothing hence undefined
  if (userExists) {
    return res.send({
      status: 400,
      message: "User already exists",
    });
  }

  // save to db
  try {
    const userDB = await user.save();
    console.log(userDB);
    return res.send({
      status: 201,
      // 201 - code for new user created
      message: "Registered successfully",
      // showing the data that is being stored in db
      data: {
        // _id will be generated by mongoose for every user
        _id: userDB._id,
        username: userDB.username,
        email: userDB.email,
      },
    });
  } catch (err) {
    return res.send({
      status: 400,
      message: "Internal server error, please try again",
      error: err,
    });
  }
});

// listening to server
app.listen(8000, () => {
  console.log("Listening to port 8000");
});
