const Post = require("../models/Post");
const express = require("express");
const router = express.Router();

const dashboardLayout = "../views/layouts/dashboard";

// GET - HOME
router.get("/", async (req, res) => {
  try {
    const locals = {
      title: "shantplace",
    };

    let perPage = 10;
    let page = req.query.page || 1;

    const data = await Post.aggregate([{ $sort: { createdAt: 1 } }])
      .skip(perPage * page - perPage)
      .limit(perPage)
      .exec();

    const count = await Post.countDocuments();
    const nextPage = parseInt(page) + 1;
    const hasNextPage = nextPage <= Math.ceil(count / perPage);

    res.render("index", {
      locals,
      data,
      current: page,
      nextPage: hasNextPage ? nextPage : null,
      currentRoute: "/",
    });
  } catch (error) {
    console.log(error);
  }
});

// GET - Post :id
router.get("/post/:id", async (req, res) => {
  try {
    let slug = req.params.id;

    const data = await Post.findById({ _id: slug });

    const locals = {
      title: data.title,
    };

    res.render("post", { layout: dashboardLayout, locals, data, currentRoute: `posts/${slug}` });
  } catch (error) {
    console.log(error);
  }
});

// POST / Post - searchTerm
router.post("/search", async (req, res) => {
  try {
    const locals = {
      title: "Search",
    };

    let searchTerm = req.body.searchTerm;
    const searchNoSpecialChar = searchTerm.replace(/[^a-zA-z0-9]/g, "");

    const data = await Post.find({
      $or: [
        { title: { $regex: new RegExp(searchNoSpecialChar, "i") } },
        { body: { $regex: new RegExp(searchNoSpecialChar, "i") } },
      ],
    });
    res.render("search", {
      data,
      locals,
    });
  } catch (error) {
    console.log(error);
  }
});

router.get("/about", (req, res) => {
  const locals = {
    title: "shantplace/about",
  };
  res.render("about", { locals, currentRoute: "/about" });
});

router.get("/contact", (req, res) => {
  const locals = {
    title: "shantplace/contact",
  };
  res.render("contact", { locals, currentRoute: "/contact" });
});

module.exports = router;
