require("dotenv").config();
const { isActiveRoute } = require("./server/helpers/routerHelpers");
const methodoverride = require("method-override");
const MongoStore = require("connect-mongo");
const cookieParser = require("cookie-parser");
const expressEjsLayouts = require("express-ejs-layouts");
const admin = require("./server/routes/admin");
const post = require("./server/routes/main");
const express = require("express");
const app = express();

const connectDB = require("./server/config/db");
const session = require("express-session");

// Connect to DB
connectDB();

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(methodoverride("_method"));

app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
    }),
  })
);

// Templating Engine
app.use(expressEjsLayouts);
app.set("layout", "./layouts/main");
app.set("view engine", "ejs");

app.locals.isActiveRoute = isActiveRoute;

app.use("/", post);
app.use("/", admin);

const port = 3000 || process.env.PORT;
app.listen(port, () => console.log(`Listening on port ${port}...`));
