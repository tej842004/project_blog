const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const Post = require("../models/Post");
const express = require("express");
const router = express.Router();

const adminLayout = "../views/layouts/admin";
const dashboardLayout = "../views/layouts/dashboard";
const jwtSecret = process.env.JWT_SECRET;

// Check Login
const authMiddleware = async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    const user = await User.findById(decoded.userId);
    req.user = user.toObject();
    req.user.isAdmin = user.isAdmin;
    next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
  }
};

// GET login
router.get("/login", async (req, res) => {
  try {
    const locals = {
      title: "login",
    };
    res.render("admin/login", {
      locals,
      layout: adminLayout,
      currenRoute: "/admin/login",
    });
  } catch (error) {
    console.log(error);
  }
});

// GET register
router.get("/register", async (req, res) => {
  try {
    const locals = {
      title: "register",
    };
    res.render("admin/register", { locals, layout: adminLayout });
  } catch (error) {
    console.log(error);
  }
});

// POST Admin - Check Login
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user._id }, jwtSecret);
    res.cookie("token", token, { httpOnly: true });

    res.redirect("/dashboard");
  } catch (error) {
    console.log(error);
  }
});

//GET Admin - Dashboard
router.get("/dashboard", authMiddleware, async (req, res) => {
  try {
    const locals = {
      title: "Dashboard",
    };

    const userId = req.user._id;

    let perPage = 5;
    let page = req.query.page || 1;

    const user = await User.find({ _id: userId });

    const data = await Post.find({ author: userId })
      .sort({ createdAt: -1 })
      .skip(perPage * page - perPage)
      .limit(perPage);

    const count = await Post.countDocuments({ author: userId });
    const nextPage = parseInt(page) + 1;
    const hasNextPage = nextPage <= Math.ceil(count / perPage);

    res.render("admin/dashboard", {
      user,
      data,
      locals,
      layout: dashboardLayout,
      current: page,
      nextPage: hasNextPage ? nextPage : null,
    });
  } catch (error) {
    console.log(error);
  }
});

// GET Admin - Create New Post
router.get("/add-post", authMiddleware, async (req, res) => {
  try {
    const locals = {
      title: "Add Post",
    };
    const userId = req.user._id;
    const user = await User.find({ _id: userId });
    const data = await Post.find();
    res.render("admin/add-post", {
      user,
      data,
      locals,
      layout: dashboardLayout,
    });
  } catch (error) {
    console.log(error);
  }
});

// POST Admin - Create New Post
router.post("/add-post", authMiddleware, async (req, res) => {
  try {
    const newPost = new Post({
      title: req.body.title,
      body: req.body.body,
      author: req.user._id,
    });
    await newPost.save();
    res.redirect("/dashboard");
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
});

// PUT Admin - Update Post
router.put("/edit-post/:id", authMiddleware, async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;

    const post = await Post.findById(postId);

    if (!post.author.equals(userId))
      return res.status(403).send("You are not authorized to edit this post");

    await Post.findByIdAndUpdate(req.params.id, {
      title: req.body.title,
      body: req.body.body,
      udpatedAt: Date.now(),
    });

    res.redirect(`/edit-post/${req.params.id}`);
  } catch (error) {
    console.log(error);
  }
});

// GET Admin - GET Edit Post
router.get("/edit-post/:id", authMiddleware, async (req, res) => {
  try {
    const locals = {
      title: "Edit Post",
    };
    const userId = req.user._id;
    const user = await User.find({ _id: userId });
    const data = await Post.findOne({ _id: req.params.id });
    res.render("admin/edit-post", {
      user,
      locals,
      data,
      layout: dashboardLayout,
    });
  } catch (error) {
    console.log(error);
  }
});

// DELETE Admin - Delete Post
router.delete("/delete-post/:id", authMiddleware, async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;

    const post = await Post.findById(postId);

    if (!post.author.equals(userId) && !req.user.isAdmin)
      return res.status(403).send("You are not authorized to delete this post");

    await Post.deleteOne({ _id: req.params.id });
    res.redirect("/dashboard");
  } catch (error) {
    console.log(error);
  }
});

//POST Admin - Register
router.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      const user = await User.create({ username, password: hashedPassword });
      res.redirect("/login");
    } catch (error) {
      console.log(error);
    }
  } catch (error) {
    if (error.code === 11000) {
      res.status(409).json({ message: "User already in use" });
    }
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET Admin - Logout
router.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/");
  // res.json({ message: "Logout successful." });
});

router.get("/admin/post/:id", async (req, res) => {
  try {
    let slug = req.params.id;

    const data = await Post.findById({ _id: slug });

    const locals = {
      title: data.title,
    };

    res.render("post", {
      layout: dashboardLayout,
      locals,
      data,
      currentRoute: `posts/${slug}`,
    });
  } catch (error) {
    console.log(error);
  }
});

router.get("/admin/about", authMiddleware, async (req, res) => {
  const locals = {
    title: "admin/about",
  };

  const userId = req.user._id;
  const user = await User.find({ _id: userId });

  res.render("about", {
    user,
    layout: dashboardLayout,
    locals,
    currentRoute: "/about",
  });
});

router.get("/admin/contact", authMiddleware, async (req, res) => {
  const locals = {
    title: "admin/contact",
  };

  const userId = req.user._id;
  const user = await User.find({ _id: userId });

  res.render("contact", {
    user,
    layout: dashboardLayout,
    locals,
    currentRoute: "/contact",
  });
});

router.get("/admin", (req, res) => {
  res.redirect("/dashboard");
});

module.exports = router;
